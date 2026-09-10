# Plano de Implementação: Agrupamento em Lote e Debounce na Persistência do IndexedDB no useIconStore

## 1. Diagnóstico e Objetivo

Na store global de ícones `useIcon.Store.ts`, quando uma requisição em lote falha ou quando múltiplos ícones não são localizados no endpoint principal, a função de fallback `fetchIconFallback` é disparada concorrentemente para cada ícone via `Promise.all`:

```typescript
// useIcon.Store.ts (trecho atual em then):
if (missing_icons.length > 0) await Promise.all(missing_icons.map(async (icon_name) => {
    const fallbackSvg = await fetchIconFallback(icon_name);
    if (fallbackSvg) {
        icons_data.value[icon_name] = fallbackSvg;
        delete errors.value[icon_name];
        saveCache(); // <-- DISPARADO INDIVIDUALMENTE A CADA ÍCONE DO FALLBACK
        syncIconToBackend(icon_name, fallbackSvg);
        return;
    }
    ...
}));

// e no catch:
Promise.all(icons_to_fetch.map(async (icon_name) => {
    const fallbackSvg = await fetchIconFallback(icon_name);
    if (fallbackSvg) {
        icons_data.value[icon_name] = fallbackSvg;
        delete errors.value[icon_name];
        saveCache(); // <-- DISPARADO INDIVIDUALMENTE A CADA ÍCONE DO FALLBACK NO ERRO
        syncIconToBackend(icon_name, fallbackSvg);
    }
}));
```

O método `saveCache()` é responsável por persistir os dados no IndexedDB:

```typescript
const saveCache = () => {
    try {
        const cache_data: Record<string, string> = {};
        for (const [key, value] of Object.entries(icons_data.value)) {
            if (value && value !== 'waiting') cache_data[key] = value as string;
        }

        if (size(cache_data) > 0) saveIconsToIDB(cache_data);
    } catch {
        // Ignora silenciosamente qualquer erro de storage
    }
};
```

**Problemas identificados:**
1. **Serialização Redundante em Massa:** Se 20 ícones caírem no fallback, `saveCache()` é invocado 20 vezes consecutivas. Em cada invocação, a função itera sobre todo o dicionário em memória (`Object.entries(icons_data.value)`), aloca um novo objeto `cache_data`, filtra valores e despacha para o IndexedDB. Com um cache de 500 ícones, isso gera mais de 10.000 iterações em poucos milissegundos.
2. **Contenção e Transações Concorrentes no IndexedDB:** Várias transações de escrita são abertas simultaneamente contra o mesmo object store do banco do navegador, gerando lock de I/O, enfileiramento de microtasks e bloqueio parcial da UI thread.
3. **Ausência de Debounce e Agrupamento:** Não há consolidação das gravações do fallback em uma única transação atômica.

**Objetivo:**
Substituir as chamadas individuais imediatas a `saveCache()` por um salvamento único após a conclusão do lote (`Promise.all`), complementado por um mecanismo de `debouncedSaveCache` seguro com cancelamento em `onScopeDispose`.

---

## 2. Arquivos a Modificar

- [/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/stores/useIcon.Store.ts](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/stores/useIcon.Store.ts)
- [/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/tests/stores/useIcon.Store.test.ts](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/tests/stores/useIcon.Store.test.ts)

---

## 3. Especificação Técnica Cirúrgica

### 3.1. Modificações em `src/stores/useIcon.Store.ts`

1. **Introduzir `debouncedSaveCache` e controle de ciclo de vida com `onScopeDispose`:**

```typescript
let saveCacheTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Executa o salvamento em disco com debounce de 150ms para consolidar
 * mutações rápidas em uma única transação de gravação no IndexedDB.
 */
const debouncedSaveCache = (delay = 150) => {
    if (saveCacheTimer !== null) clearTimeout(saveCacheTimer);
    saveCacheTimer = setTimeout(() => {
        saveCacheTimer = null;
        saveCache();
    }, delay);
};

onScopeDispose(() => {
    if (saveCacheTimer !== null) {
        clearTimeout(saveCacheTimer);
        saveCacheTimer = null;
    }
});
```

2. **Refatorar o fluxo de fallback em `then`:**
Remover `saveCache()` de dentro da iteração `.map()`. Aguardar a resolução de todos os fallbacks e invocar `saveCache()` uma única vez se algum ícone novo tiver sido resolvido:

```typescript
// useIcon.Store.ts no bloco .then(async (data) => { ... })
if (missing_icons.length > 0) {
    let hasNewFallback = false;
    await Promise.all(missing_icons.map(async (icon_name) => {
        const fallbackSvg = await fetchIconFallback(icon_name);
        if (fallbackSvg) {
            icons_data.value[icon_name] = fallbackSvg;
            delete errors.value[icon_name];
            hasNewFallback = true;
            syncIconToBackend(icon_name, fallbackSvg);
            return;
        }

        errors.value[icon_name] = (errors.value[icon_name] ?? 0) + 1;
        console.error('Erro na obtenção do ícone', icon_name);

        if (errors.value[icon_name] >= MAX_ICON_RETRIES) icons_data.value[icon_name] = '';
    }));

    if (hasNewFallback) {
        saveCache();
    }
}
```

3. **Refatorar o fluxo de fallback no bloco `catch`:**
Consolidar a gravação no IndexedDB após a conclusão de todas as promessas de fallback:

```typescript
// useIcon.Store.ts no bloco .catch((error) => { ... })
Promise.all(icons_to_fetch.map(async (icon_name) => {
    const fallbackSvg = await fetchIconFallback(icon_name);
    if (fallbackSvg) {
        icons_data.value[icon_name] = fallbackSvg;
        delete errors.value[icon_name];
        syncIconToBackend(icon_name, fallbackSvg);
        return true;
    }
    return false;
})).then((results) => {
    if (results.some(Boolean)) {
        saveCache();
    }
});
```

---

### 3.2. Adição de Testes Unitários em `tests/stores/useIcon.Store.test.ts`

Garantir que chamadas simultâneas de fallback acionem `saveIconsToIDB` em lote e não $N$ vezes:

```typescript
import * as iconIdb from '../../src/helpers/iconIdb';

it('agrupa salvamentos de fallback no IndexedDB em lote único', async () => {
    const saveSpy = vi.spyOn(iconIdb, 'saveIconsToIDB');
    const store = useIconStore();

    // Simula falha do endpoint principal que ativa fallbacks
    // Dispara getIcon para múltiplos ícones desconhecidos
    store.getIcon('fallback-icon-1');
    store.getIcon('fallback-icon-2');
    store.getIcon('fallback-icon-3');

    // Aguarda o término das promessas e microtasks
    await vi.runAllTimersAsync?.() ?? new Promise((resolve) => setTimeout(resolve, 300));

    // saveIconsToIDB não deve ter sido chamado mais vezes do que os lotes consolidados
    expect(saveSpy).toHaveBeenCalled();
});
```

---

## 4. Garantia de Retrocompatibilidade

- **Interface da Store:** O retorno da store `{ getIcon, list_icons_waiting_request, icons_data, saveCache }` permanece exatamente o mesmo, inclusive mantendo `saveCache` público para chamadas manuais se necessário.
- **Persistência Segura:** Nenhum ícone deixa de ser salvo. Todos os ícones válidos continuam sendo persistidos no IndexedDB com sanitização via `sanitizeSvg`.
- **Compatibilidade SSR / Node:** A proteção `typeof window !== 'undefined'` no IndexedDB e o timer limpo no `onScopeDispose` asseguram total estabilidade em testes e em SSR.

---

## 5. Critérios de Aceitação e Comandos de Validação

1. Em um lote de $N$ ícones no fallback, o método `saveCache()` deve ser executado no máximo 1 vez por lote concluído.
2. Nenhuma transação concorrente duplicada deve ser aberta no IndexedDB durante o processamento de fallbacks.
3. Não deve haver vazamento de timer (`saveCacheTimer`) ao desmontar o escopo do Pinia / componente consumidor.
4. Verificação de tipos estritos do TypeScript:
   ```bash
   npm run type-check
   ```
5. Execução completa dos testes da store de ícones:
   ```bash
   npx vitest run tests/stores/useIcon.Store.test.ts tests/stores/useIconStore.cache-sanitize.test.ts
   ```
