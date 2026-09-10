# Plano de Implementação — Issue #82

## Descrição e Causa Raiz

### Problema
Durante a auditoria automatizada do ecossistema de stores e comunicação de rede (Lente 6 — N+1 / Performance de Queries e Concorrência de Rede), identificou-se um gargalo severo de concorrência no tratamento de ícones em fallback na store Pinia `useIconStore` (`src/stores/useIcon.Store.ts:173-187` e `src/stores/useIcon.Store.ts:195-203`).

Quando múltiplos ícones não são localizados na requisição primária em lote para a API do backend (ficando registrados em `missing_icons`) ou quando a requisição primária em lote falha por completo (caindo no `.catch` com todos os `icons_to_fetch`), a store dispara um laço de resolução concorrente utilizando `Promise.all(...map(...))`.

Para **cada** ícone resolvido com sucesso pelo serviço de fallback externo (`fetchIconFallback`), o código executa individualmente e de forma concorrente:
1. `saveCache()`: serializa todos os ícones da memória (`icons_data.value`) e despacha uma transação `readwrite` completa com inserções `put` individuais de todo o dicionário no IndexedDB (`saveIconsToIDB`).
2. `syncIconToBackend(icon_name, fallbackSvg)`: dispara uma requisição HTTP `POST` individual imediata para a rota de sincronização (`routeIconsSync`, por padrão `https://engeapp.com.br/api/icons`).

### Agravantes
1. **Tempestade de Requisições HTTP (HTTP Request Storm):** Em telas com densidade média ou alta de ícones novos ou ausentes no banco de dados (por exemplo, dashboards, menus laterais e tabelas com dezenas de ícones), a resolução de 20 a 50 ícones faltantes dispara de 20 a 50 requisições HTTP `POST` simultâneas para o mesmo endpoint do backend. Isso esgota o pool de conexões simultâneas do navegador (limite de 6 conexões por host em HTTP/1.1 ou saturação de streams em HTTP/2) e sobrecarrega os workers do servidor backend.
2. **Saturação e Concorrência Excessiva no Storage Local (IndexedDB Thrashing):** Se 20 ícones forem obtidos via fallback, o método `saveCache()` é executado 20 vezes em paralelo. Cada execução percorre todas as centenas de entradas de `icons_data.value` e agenda uma transação `readwrite` completa no IndexedDB. O navegador é forçado a gerenciar dezenas de transações concorrentes de gravação sobre a mesma object store `'icons'`, gerando atrasos em I/O, desperdício de CPU e potenciais falhas de concorrência ou abortos de transação.
3. **Ausência de Agrupamento em Lote (Batch Syncing):** O método `syncIconToBackend` é projetado exclusivamente para enviar pares unitários `{ icon, svg }`, sem qualquer mecanismo de agregação em lote (*batching*) ou debounce para agrupar múltiplos ícones recuperados na mesma rodada.
4. **Falta de Tratamento Assíncrono Apropriado no `.catch`:** Na linha 195, a chamada `Promise.all(...)` dentro do bloco `.catch` não é aguardada (`await`), executando em paralelo descontrolado e sem sincronização com o ciclo de vida da requisição.

---

### Causa Raiz Comprovada

- **Arquivos e Linhas Exatos:**
  - `src/stores/useIcon.Store.ts:173-187` (bloco de resolução de `missing_icons` dentro do `.then`)
  - `src/stores/useIcon.Store.ts:195-203` (bloco de fallback de `icons_to_fetch` dentro do `.catch`)
  - `src/stores/useIcon.Store.ts:122-136` (implementação de `syncIconToBackend` sem agregação em lote)
  - `src/stores/useIcon.Store.ts:209-219` (implementação de `saveCache` acionada repetidamente por cada item)

- **Fluxo Causal e Rastreamento Reverso de Dados:**
  1. **Interface do Usuário (UI):** O componente visual `<MaxIcon name="..." />` ou formulários/menus que invocam ícones acionam o método `store.getIcon(icon_name)`. Se o ícone não estiver presente em memória (`icons_data.value`), é registrado como `'waiting'`.
  2. **Agrupamento de Requisições Primárias (Store):** O watcher `watchDebounced` agrupa os ícones com status `'waiting'` em um lote (`icons_to_fetch`) e despacha uma requisição GET em lote para `routeIcons?icons[]=...`.
  3. **Origem da Falha no Tratamento de Fallback:**
     - **Cenário A (Ícones ausentes no retorno - Linha 173):** A API primária responde 200, porém alguns ícones vêm como `null` ou ausentes no dicionário JSON de retorno. O código popula `missing_icons` com esses identificadores e, na linha 173, executa:
       ```typescript
       if (missing_icons.length > 0) await Promise.all(missing_icons.map(async (icon_name) => {
           const fallbackSvg = await fetchIconFallback(icon_name);
           if (fallbackSvg) {
               icons_data.value[icon_name] = fallbackSvg;
               delete errors.value[icon_name];
               saveCache(); // <-- CAUSA RAIZ: Chamado N vezes concorrentemente
               syncIconToBackend(icon_name, fallbackSvg); // <-- CAUSA RAIZ: Dispara N POSTs HTTP concorrentes
               return;
           }
           ...
       }));
       ```
     - **Cenário B (Falha da API primária - Linha 195):** A API primária responde com erro (timeout, HTTP 500, falha de rede). O bloco `.catch` executa:
       ```typescript
       Promise.all(icons_to_fetch.map(async (icon_name) => {
           const fallbackSvg = await fetchIconFallback(icon_name);
           if (fallbackSvg) {
               icons_data.value[icon_name] = fallbackSvg;
               delete errors.value[icon_name];
               saveCache(); // <-- CAUSA RAIZ: Chamado N vezes concorrentemente
               syncIconToBackend(icon_name, fallbackSvg); // <-- CAUSA RAIZ: Dispara N POSTs HTTP concorrentes
           }
       }));
       ```
  4. **Camada de Storage e Rede:**
     - A cada resolução de fallback individual, `saveCache()` abre uma transação `readwrite` no IndexedDB através de `saveIconsToIDB` contendo todos os ícones da store.
     - Simultaneamente, `syncIconToBackend` despacha um `fetch(syncUrl, { method: 'POST', body: JSON.stringify({ icon, svg }) })`.
     - O resultado é a multiplicação de $N$ operações pesadas de disco e $N$ requisições de rede paralelas desnecessárias.

---

## Arquivos Afetados

1. `src/stores/useIcon.Store.ts`:
   - Refatoração de `syncIconToBackend` para suportar sincronização em lote (`syncIconsToBackend`), permitindo enviar múltiplos ícones em uma única requisição POST estruturada (`{ icons: Record<string, string> }`), mantendo compatibilidade retroativa para envios individuais (`{ icon, svg, icons }`).
   - Reestruturação dos laços concorrentes em `missing_icons` (bloco `.then`) e `icons_to_fetch` (bloco `.catch`):
     - Manter a atribuição reativa imediata de `icons_data.value[icon_name] = fallbackSvg` para renderização instantânea na tela do usuário.
     - Coletar os ícones recuperados em um mapa local (`recoveredIcons`).
     - Mover a chamada `saveCache()` para **fora** do loop concorrente, executando-a uma única vez após a resolução de todas as promises do lote de fallback.
     - Substituir os múltiplos disparos de `syncIconToBackend` por uma única chamada a `syncIconsToBackend(recoveredIcons)` ao final da resolução do lote.
     - Tornar o handler do `.catch` devidamente assíncrono com `await Promise.all(...)`.
2. `tests/stores/useIcon.Store.test.ts`:
   - Adicionar casos de teste que solicitam múltiplos ícones novos e comprovam que apenas 1 requisição POST consolidada é despachada e que o IndexedDB é acionado uma única vez de forma consolidada.
   - Garantir preservação dos testes unitários existentes (sanitização, fallback unitário, fallback failure resilience, custom route configs).

---

## Execuções Propostas

### 1. Refatorar Sincronização com o Backend para Suportar Lote (`syncIconsToBackend`)
Substituir a assinatura e comportamento de envio individual em `src/stores/useIcon.Store.ts`:
```typescript
const syncIconsToBackend = async (icons: Record<string, string>): Promise<void> => {
    const entries = Object.entries(icons);
    if (entries.length === 0) return;

    try {
        const syncUrl = getMaxAppConfig().routeIconsSync ?? getMaxAppConfig().routeIcons ?? 'https://engeapp.com.br/api/icons';
        
        // Compatibilidade: se for um único ícone, inclui 'icon' e 'svg' na raiz para backends/testes que esperam essa estrutura,
        // além de incluir o mapa completo em 'icons'.
        const payload = entries.length === 1
            ? { icon: entries[0][0], svg: entries[0][1], icons }
            : { icons };

        await fetch(syncUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload)
        });
    } catch {
        // Falha na sincronização não interrompe o funcionamento no frontend
    }
};
```

### 2. Otimizar a Resolução de `missing_icons` no Bloco de Sucesso (`.then`)
Em `src/stores/useIcon.Store.ts:173-187`:
- Inicializar `const recoveredIcons: Record<string, string> = {};`.
- No laço `missing_icons.map(...)`:
  - Ao obter `fallbackSvg`, atribuir diretamente `icons_data.value[icon_name] = fallbackSvg` e `delete errors.value[icon_name]` (garantindo feedback visual imediato na UI).
  - Registrar no mapa local: `recoveredIcons[icon_name] = fallbackSvg;`.
  - Remover `saveCache()` e `syncIconToBackend()` de dentro da iteração individual.
- Após o término de `await Promise.all(...)`:
  - Se `size(recoveredIcons) > 0`:
    - Executar `saveCache()` uma única vez para persistir todos os ícones recuperados de forma atômica no IndexedDB.
    - Executar `syncIconsToBackend(recoveredIcons)` uma única vez para sincronizar o lote com o backend em uma única requisição POST.

### 3. Otimizar a Resolução de Falha Primária no Bloco de Erro (`.catch`)
Em `src/stores/useIcon.Store.ts:189-204`:
- Transformar o callback do `.catch` em assíncrono: `.catch(async (error) => { ... })`.
- Inicializar `const recoveredIcons: Record<string, string> = {};`.
- Executar `await Promise.all(icons_to_fetch.map(async (icon_name) => { ... }))`:
  - Ao obter `fallbackSvg`, atribuir diretamente `icons_data.value[icon_name] = fallbackSvg` e `delete errors.value[icon_name]`.
  - Registrar no mapa local: `recoveredIcons[icon_name] = fallbackSvg;`.
  - Remover `saveCache()` e `syncIconToBackend()` de dentro da iteração individual.
- Após o término do `await Promise.all(...)`:
  - Se `size(recoveredIcons) > 0`:
    - Executar `saveCache()` uma única vez.
    - Executar `syncIconsToBackend(recoveredIcons)` uma única vez.

---

## Especificação de Teste TDD (Red-Green)

### Cenário Red (Reprodução do Bug / Storm de Requisições e Gravações)
Criar teste unitário em `tests/stores/useIcon.Store.test.ts`:
```typescript
it('agrupa múltiplos ícones recuperados via fallback em um único POST de sincronização e grava cache de forma consolidada', async () => {
    const store = useIconStore();

    const mockFetch = vi.spyOn(globalThis, 'fetch').mockImplementation((url, init) => {
        const urlStr = String(url);
        
        // POST de sincronização com backend
        if (init?.method === 'POST') {
            return Promise.resolve({
                ok: true,
                json: () => Promise.resolve({ success: true })
            } as any);
        }

        // Fallback do Iconify
        if (urlStr.includes('api.iconify.design')) {
            const match = urlStr.match(/api\.iconify\.design\/([^.]+)\.svg/);
            const iconName = match ? decodeURIComponent(match[1]) : 'icon';
            return Promise.resolve({
                ok: true,
                text: () => Promise.resolve(`<svg data-icon="${iconName}"><circle r="4"/></svg>`)
            } as any);
        }

        // Rota principal retornando ícones ausentes (null)
        if (urlStr.includes('icons%5B%5D=')) {
            return Promise.resolve({
                ok: true,
                json: () => Promise.resolve({
                    'icon-batch-1': null,
                    'icon-batch-2': null,
                    'icon-batch-3': null
                })
            } as any);
        }

        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) } as any);
    });

    // Solicita 3 ícones faltantes em lote
    store.getIcon('icon-batch-1');
    store.getIcon('icon-batch-2');
    store.getIcon('icon-batch-3');

    await new Promise((r) => setTimeout(r, 250)); // aguarda debounce da store
    await new Promise((r) => setTimeout(r, 150)); // aguarda fallbacks e sincronização

    // No código original (Red), foram disparadas 3 requisições POST concorrentes
    // A asserção abaixo FALHA no código atual e passa no código corrigido (Green)
    const postCalls = mockFetch.mock.calls.filter((call) => call[1]?.method === 'POST');
    expect(postCalls).toHaveLength(1);

    const postBody = JSON.parse(postCalls[0][1]!.body as string);
    expect(postBody.icons).toBeDefined();
    expect(postBody.icons['icon-batch-1']).toContain('data-icon="icon-batch-1"');
    expect(postBody.icons['icon-batch-2']).toContain('data-icon="icon-batch-2"');
    expect(postBody.icons['icon-batch-3']).toContain('data-icon="icon-batch-3"');

    // Valida que todos os ícones estão disponíveis na store
    expect(store.icons_data['icon-batch-1']).toContain('data-icon="icon-batch-1"');
    expect(store.icons_data['icon-batch-2']).toContain('data-icon="icon-batch-2"');
    expect(store.icons_data['icon-batch-3']).toContain('data-icon="icon-batch-3"');
});
```

### Cenário Green (Validação Pós-Correção)
Ao aplicar as execuções propostas:
1. `postCalls.length` é exatamente `1`.
2. O payload contém `{ icons: { 'icon-batch-1': '...', 'icon-batch-2': '...', 'icon-batch-3': '...' } }`.
3. Todos os ícones são renderizados sem atraso perceptual na store.
4. O teste de regressão para 1 único ícone (`at-icons:bot`) continua funcionando e enviando `{ icon, svg, icons }`.

---

## Banco de Dados
**Nenhuma.** Alteração restrita ao comportamento da store Pinia `useIconStore` no frontend.

---

## Riscos de Quebra e Não-Regressão

| Risco Identificado | Probabilidade | Impacto | Estratégia de Mitigação |
| :--- | :--- | :--- | :--- |
| **Quebra de Contrato com Backends que esperam `icon` e `svg` individuais:** Backends mais antigos podem esperar o payload `{ icon: string, svg: string }`. | Baixa | Médio | Quando o lote contiver exatamente 1 ícone, o payload enviado incluirá `{ icon: name, svg: content, icons: { [name]: content } }`. Quando contiver múltiplos ícones, enviará `{ icons: Record<string, string> }`. |
| **Atraso na Renderização Visual na UI:** Se a atualização da store esperasse todos os fallbacks do lote terminarem, a UI poderia demorar mais para exibir os primeiros ícones resolvidos. | Baixa | Alto | A atribuição `icons_data.value[icon_name] = fallbackSvg` é mantida imediatamente dentro da resolução de cada promise individual. Apenas a consolidação de disco (`saveCache`) e a sincronização HTTP com o backend (`syncIconsToBackend`) ocorrem após o término do lote. |
| **Falha Parcial no Fallback:** Alguns ícones do lote podem falhar no Iconify enquanto outros têm sucesso. | Média | Baixo | Apenas os ícones com `fallbackSvg !== null` são incluídos no mapa `recoveredIcons`. Os que falham continuam contabilizando retries em `errors.value[icon_name]` sem prejudicar os ícones recuperados. |
| **Regressão em Testes Unitários Existentes:** Testes existentes de sanitização, timeout e fallback unitário em `tests/stores/useIcon.Store.test.ts`. | Baixa | Alto | Execução de toda a suíte de testes de ícones antes e após a implementação para garantir que todos os 24 testes existentes continuem com status `PASS`. |

---

## Validação

A comprovação do sucesso da implementação será obtida através da execução dos seguintes comandos:

1. **Execução dos Testes Unitários da Store de Ícones:**
   ```bash
   npx vitest run tests/stores/useIcon.Store.test.ts tests/stores/useIconStore.test.ts tests/stores/useIconStore.cache-sanitize.test.ts
   ```
2. **Execução de Todos os Testes de Componentes de Ícones:**
   ```bash
   npx vitest run tests/components/MaxIcon.test.ts tests/components/MaxIconButton.test.ts tests/components/MaxIconConfirm.test.ts tests/components/MaxInputIconPicker.test.ts
   ```
3. **Checagem Estática de Tipagem (TypeScript):**
   ```bash
   npm run type-check
   ```
4. **Validação de Estilo e Linter (ESLint):**
   ```bash
   npm run lint
   ```

---

## Skills Aplicáveis

- `systematic-debugging-best-practices` — Diagnóstico com causa raiz comprovada e rastreamento reverso de dados.
- `test-driven-development` — Especificação de teste Red-Green com asserção do número de requisições e estrutura de lote.
- `vue-debugging-best-practices` — Reatividade de stores Pinia, watchers assíncronos e debounce.
- `vue-pinia-state-management-best-practices` — Gerenciamento de estado, cache local e persistência em IndexedDB.
- `frontend-api-integration-patterns` — Padrões de batching, mitigação de request storms e resiliência de rede.
- `vue-vitest-testing-best-practices` — Mocking determinístico de fetch, timers e asserções granulares.
- `vue-eslint-stylelint-quality-standards` — Padrões de formatação e linting estrito aderentes ao `eslint.config.js`.
- `code-review-and-quality` — Garantia de não-regressão e robustez arquitetural.
