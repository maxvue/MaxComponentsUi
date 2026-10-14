# Plano de Execução — Correção do Escopo Responsivo por Dispositivo (`-mobile`, `-tablet`, `-desktop`) nas Regras `s-*` do `presetMaxUno`

---

## 1. Identificação

- **Título:** Correção do Escopo Responsivo por Dispositivo nas Regras de Dimensionamento `s-*` (`presetMaxUno`)
- **Data:** 2026-10-14
- **Projeto:** `@maxvue/max-components-ui`
- **Worktree Ativa:** `wt-13a68947` (`/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-13a68947`)
- **Especificação Técnica Associada:** `docs/plans/wt-13a68947/spec.md`

---

## 2. Especificação

### 2.1. Problema
Quando um item filho do `MaxGrid` recebe um token de dimensionamento padrão combinado com um token qualificado por dispositivo — especificamente o caso relatado pelo usuário:

```html
<MaxInputCpfCnpj s11-11 s20-full-mobile v-model="proposalStore.data.client_document" label="CPF ou CNPJ" />
```

o componente fica com o dimensionamento `s20-full` (`flex: 1 1 0%; min-width: 400px; max-width: 100%`) tanto em telas mobile quanto em telas desktop, anulando o `s11-11` (`min-width: 220px; max-width: 220px`) no desktop.

### 2.2. Objetivo
Fazer com que a regra dinâmica `s-*` em `src/presetMaxUno.ts` aplique a `@media` query correspondente ao sufixo de dispositivo (`-mobile`, `-tablet`, `-desktop`) também às propriedades de dimensionamento (`flex`, `min-width`, `max-width`), e não apenas às propriedades de quebra (`break-before` / `break-after`). Assim, `s20-full-mobile` só produzirá efeito dentro de `@media (max-width: 767.98px)`, preservando `s11-11` fora desse breakpoint.

### 2.3. Usuários e Consumidores Afetados
- Desenvolvedores que utilizam `@maxvue/max-components-ui` e `presetMaxUno` (como a aplicação `engeapp`, especificamente em `CommercialProposalDetailPage.vue` linha 114 e demais formulários baseados em `MaxGrid`).
- Telas responsivas que combinam atributos/classes `s-*` base com overrides por dispositivo (`-mobile`, `-tablet`, `-desktop`).

### 2.4. Requisitos Funcionais e Técnicos
- **RF-01:** Tokens `s-*` sem sufixo de dispositivo (ex.: `s11-11`, `s-11-full`, `s7-end`, `s3-10-start`) devem continuar gerando `flex: 1 1 0%`, `min-width` e `max-width` (e `break-before`/`break-after` quando houver `start`/`end`) no escopo global (sem `@media`).
- **RF-02:** Tokens `s-*` com sufixo `-mobile`, `-tablet` ou `-desktop` e sem posição (ex.: `s20-full-mobile`, `s-50-mobile`, `s50-tablet`, `s-50-desktop`) devem emitir `flex: 1 1 0%`, `min-width` e `max-width` com `[symbols.parent]` configurado para a respectiva `@media` query:
  - `mobile` → `@media (max-width: 767.98px)`
  - `tablet` → `@media (max-width: 1000.98px)`
  - `desktop` → `@media (min-width: 1001px)`
- **RF-03:** Tokens `s-*` com sufixo de dispositivo e com marcador de posição (`start` ou `end`, em qualquer ordem aceita pela regex, como `s-50-start-mobile` ou `s50-mobile-end`) devem emitir tanto o bloco de dimensões quanto o bloco de quebra sob o mesmo `[symbols.parent]` da `@media` query correspondente ao dispositivo.
- **RF-04:** Na combinação `<MaxInputCpfCnpj s11-11 s20-full-mobile ... />` dentro de `<MaxGrid>`, o CSS gerado pelo UnoCSS deve posicionar a regra base `[s11-11=""]` antes do bloco `@media (max-width: 767.98px)` de `[s20-full-mobile=""]`, resultando em `max-width: 220px` no desktop (`> 767.98px`) e `min-width: 400px; max-width: 100%` no mobile (`<= 767.98px`).

### 2.5. Restrições
- Seguir estritamente as regras de código e estilo do repositório (`eslint.config.js`: aspas simples, ponto e vírgula, sem vírgula final, `curly: ['error', 'multi', 'consistent']`, `nonblock-statement-body-position: ['error', 'beside']`, indentação de 4 espaços, tags de abertura em linha única em `.vue`).
- Não alterar a lógica de particionamento de VNodes em `.max-grid-row` (`src/components/base/gridSlotRows.ts`).
- Executar todas as alterações estritamente dentro da worktree `/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-13a68947`.

### 2.6. Escopo Incluído e Excluído
- **Incluído:**
  - `src/presetMaxUno.ts` (regra `s-*`, linhas 84–117).
  - `tests/preset/presetMaxUno.test.ts` (testes unitários da regra `s-*`).
  - `tests/preset/presetMaxUno.generate.test.ts` (testes de geração CSS via `createGenerator`).
  - `tests/browser/maxGridLineBreaks.browser.ts` (teste em navegador real com mudança de viewport desktop/mobile).
  - `docs/THEME.md`, `COMPONENTS.md` e `playground/src/scenarios/layout-grid.vue` (atualização documental).
- **Excluído:**
  - Modificações em `src/components/MaxGrid.vue`, `src/components/base/gridSlotRows.ts`, `src/components/MaxInputCpfCnpj.vue` ou `src/components/InputBase.vue`.
  - Modificações diretas no repositório externo `/home/johnattas/GitHub/engeapp`.

### 2.7. Comportamentos Esperados, Falhas e Casos Extremos
- **Combinação de atributos attributify e classes:** Funciona identicamente se o consumidor escrever `<MaxInputCpfCnpj s11-11 s20-full-mobile />` (attributify) ou `<MaxInputCpfCnpj class="s11-11 s20-full-mobile" />` (classes), pois o UnoCSS aplica o mesmo `symbols.parent` a ambos os seletores.
- **Ordem dos atributos no HTML:** Independentemente de o consumidor escrever `s11-11 s20-full-mobile` ou `s20-full-mobile s11-11` no template, o UnoCSS agrupa regras sem `parent` (`""`) antes das regras com `parent` (`"@media ..."`), garantindo que o bloco `@media` vença quando o breakpoint estiver ativo.
- **Combinação de múltiplos breakpoints (`tablet` + `mobile`):** No UnoCSS (`@unocss/core`), as chaves de `parent` sem `parentOrder` explícito são ordenadas por `localeCompare`. Como `"@media (max-width: 1000.98px)"` precede lexicograficamente `"@media (max-width: 767.98px)"` (`'1' < '7'`), a regra `-mobile` é emitida após `-tablet`, prevalecendo em telas `<= 767.98px`.
- **Tokens inválidos:** Tokens com dois dispositivos (`s-50-mobile-desktop`), duas posições (`s-50-start-end`) ou intercalação inválida (`s-50-start-mobile-end`) continuam sendo rejeitados pela regex.

---

## 3. Evidências

### 3.1. Arquivos Existentes Inspecionados
1. **`src/presetMaxUno.ts` (linhas 84–117):**
   - Contém a regra `[/^s-?(\d+)(?:-(full|max|\d+))?(?:-(start|end)(?:-(desktop|mobile|tablet))?|-(desktop|mobile|tablet)(?:-(start|end))?)?$/, function* (match, { symbols }) { ... }]`.
   - Nas linhas 97–101, faz `yield { flex: '1 1 0%', 'min-width': `${n * 20}px`, 'max-width': maxWidth }` incondicionalmente fora de qualquer verificação de `device`.
   - Nas linhas 103–115, verifica `if (position)` e somente ali aplica `[symbols.parent]` para `mobile`, `tablet` ou `desktop`.
2. **`src/components/MaxInputCpfCnpj.vue` (linhas 1–30) e `src/components/InputBase.vue` (linhas 1–6, 260–280):**
   - `MaxInputCpfCnpj` tem `<InputBase class="max-input-cpf-cnpj" ...>` como elemento raiz; os atributos `s11-11` e `s20-full-mobile` são repassados via `rootAttrs` para a `<div class="max-input-base max-input-main-div">` raiz do componente, que é filha direta de `.max-grid`.
3. **`src/components/MaxGrid.vue` e `src/components/base/gridSlotRows.ts`:**
   - `gridSlotRows.ts` particiona os filhos do slot default em `.max-grid-row` quando encontra `^s-?\d+(?:-(?:full|max|\d+))?-(start|end)$`.
4. **`tests/preset/presetMaxUno.test.ts` (linhas 494–520) e `tests/preset/presetMaxUno.generate.test.ts` (linhas 162–207):**
   - Atualmente testam o comportamento antigo em que `s-50-mobile`, `s50-tablet` e `s-50-desktop` geravam apenas dimensões globais sem `@media` e `s-50-start-mobile` gerava dimensões globais + `break-before` dentro da `@media`.
5. **`tests/browser/maxGridLineBreaks.browser.ts`:**
   - Executa testes reais de layout no Chromium via Playwright (`vitest.browser.config.ts`).
6. **`docs/THEME.md` (linhas 218–264), `COMPONENTS.md` (linhas 825–852) e `playground/src/scenarios/layout-grid.vue` (linhas 9–41):**
   - Documentam a família de tokens `s-*` e o `MaxGrid`.
7. **Consumidor real inspecionado (`/home/johnattas/GitHub/engeapp/resources/Vue/Pages/CommercialProposalDetailPage.vue`, linhas 112–130):**
   - Linha 114: `<MaxInputCpfCnpj s11-11 s20-full-mobile v-model="proposalStore.data.client_document" label="CPF ou CNPJ" />`.
   - Também foram observados fora do escopo desta tarefa atributos com colchetes literais `[confirm]` e `[cancel]` em `MaxButton` nas linhas 15, 59, 67, 358, 359, 362, 367, 412 e 413 daquele arquivo consumidor (reportados em notificação dedicada).

### 3.2. Arquivos Novos Propostos
- Nenhum arquivo de código-fonte ou de teste novo precisa ser criado; todas as mudanças ocorrerão em arquivos existentes do repositório.

### 3.3. Limitações de Acesso
- Nenhuma limitação de acesso encontrada. Em Plan Mode, nenhuma validação de terminal ou modificação de código foi executada.

---

## 4. Solução e Decisões

### 4.1. Decisões Técnicas Confirmadas
1. **Unificação do escopo `@media` por `device` na regra `s-*` (`src/presetMaxUno.ts`):**
   - Resolver a string `media` logo após identificar `device`:
     ```ts
     let media: string | undefined;
     if (device === 'mobile') media = '@media (max-width: 767.98px)';
     else if (device === 'tablet') media = '@media (max-width: 1000.98px)';
     else if (device === 'desktop') media = '@media (min-width: 1001px)';
     ```
   - Emitir o objeto de dimensões incluindo `[symbols.parent]: media` quando `media` estiver definida:
     ```ts
     if (media) {
         yield {
             [symbols.parent]: media,
             flex: '1 1 0%',
             'min-width': `${n * 20}px`,
             'max-width': maxWidth
         };
     } else {
         yield {
             flex: '1 1 0%',
             'min-width': `${n * 20}px`,
             'max-width': maxWidth
         };
     }
     ```
   - Quando `position` (`start` | `end`) estiver presente, emitir o objeto de quebra com o mesmo `media` (se definido):
     ```ts
     if (position) {
         const breakProp = position === 'start' ? 'break-before' : 'break-after';
         if (media) yield { [symbols.parent]: media, [breakProp]: 'always' };
         else yield { [breakProp]: 'always' };
     }
     ```
2. **Manutenção de `yield` separado para dimensões e para `position`:**
   - Preservar os dois `yield` (um para dimensões e outro condicional para `position`) mantém total compatibilidade estrutural com os testes unitários e de geração CSS para tokens sem dispositivo (`s10-start`, `s7-end`, etc.), enquanto aplica `[symbols.parent]: media` a ambos os `yield` quando `device` está presente.

### 4.2. Alternativas Descartadas
- **Alternativa A (Descartada): Aplicar `media` às dimensões apenas quando `position` não estiver presente.**
  - *Motivo do descarte:* Criaria uma inconsistência grave caso o desenvolvedor utilizasse `<MaxInputCpfCnpj s11-11 s20-full-start-mobile />`, fazendo com que a adição de `-start` voltasse a vazar `s20-full` para o desktop.
- **Alternativa B (Descartada): Alterar `gridSlotRows.ts` para criar linhas `.max-grid-row` baseadas em dispositivo no VDOM.**
  - *Motivo do descarte:* O VDOM do Vue é agnóstico de viewport CSS em tempo de renderização de slots, e o caso do usuário (`s11-11 s20-full-mobile`) não utiliza `-start`/`-end`, tratando exclusivamente do vazamento das dimensões CSS de `s20-full-mobile` para o desktop.

---

## 5. Etapas de Execução

> **Instrução de Preflight (por leitura antes de implementar):**
> Antes de iniciar as edições na sessão Execute, o executor deve verificar por leitura que `package.json`, `src/presetMaxUno.ts` e `vitest.config.ts` estão íntegros na worktree `/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-13a68947`. **Não execute** testes intermediários a cada microedição: implemente todas as etapas (Etapas 1 a 4) e só então execute a bateria de validação na Etapa 5.

### Etapa 1 — Atualizar a regra `s-*` em `src/presetMaxUno.ts`
- **Arquivo afetado:** `src/presetMaxUno.ts` (linhas 84–117)
- **Dependências:** Nenhuma.
- **Ação:**
  - Substituir o bloco da regra `s-*` para determinar `media` a partir de `device` (`mobile`, `tablet`, `desktop`) antes do primeiro `yield`.
  - Incluir `[symbols.parent]: media` no `yield` das dimensões (`flex`, `min-width`, `max-width`) quando `media` existir, e reutilizar `media` no `yield` de `position` (`break-before` / `break-after`).
  - Respeitar as regras do ESLint (`if` de linha única na mesma linha sem chaves ou blocos multilinhas com chaves consistentes via `curly: ['error', 'multi', 'consistent']`).
- **Resultado esperado:** Qualquer token `s-*` com `-mobile`, `-tablet` ou `-desktop` passa a emitir suas dimensões (e eventual quebra) dentro da `@media` query correspondente.

### Etapa 2 — Atualizar os testes unitários e de geração CSS do preset UnoCSS
- **Arquivos afetados:**
  - `tests/preset/presetMaxUno.test.ts` (linhas 494–520)
  - `tests/preset/presetMaxUno.generate.test.ts` (linhas 162–207)
- **Dependências:** Etapa 1.
- **Ação:**
  - Em `tests/preset/presetMaxUno.test.ts`:
    - Atualizar o teste `'resolve o token reconhecido mesmo sem a propriedade input'` (`s3-10-start-desktop`) para esperar `[parentSymbol]: '@media (min-width: 1001px)'` também no primeiro item do array retornado (`{ [parentSymbol]: '@media (min-width: 1001px)', flex: '1 1 0%', 'min-width': '60px', 'max-width': '200px' }`).
    - Atualizar o bloco `it.each` de tokens com posição e dispositivo (`s-50-start-mobile`, `s50-mobile-end`, `s-50-start-tablet`, `s50-tablet-end`, `s-50-start-desktop`, `s50-desktop-end`) para verificar que tanto o objeto de dimensões quanto o de quebra contêm `[parentSymbol]: media`.
    - Atualizar o bloco `it.each` de tokens com dispositivo sem posição (`s-50-mobile`, `s50-tablet`, `s-50-desktop` e adicionar `s20-full-mobile`) para verificar que o objeto de dimensões contém `[parentSymbol]: media`.
  - Em `tests/preset/presetMaxUno.generate.test.ts`:
    - Atualizar os testes de geração CSS para tokens com dispositivo e posição (`s3-10-start-mobile`, `s5-max-desktop-end`, `s8-12-end-tablet`, `s4-tablet-start`) verificando que tanto `flex:1 1 0%;min-width:...;max-width:...;` quanto `break-before:always;` / `break-after:always;` estão contidos dentro do bloco `@media` e que não há declaração fora da `@media`.
    - Atualizar o teste de tokens com dispositivo sem posição (`s10-mobile`, `s8-16-tablet`, `s12-full-desktop`, `s20-full-mobile`) verificando que a regra gerada está encapsulada no respectivo `@media (...)`.
    - Adicionar um teste específico para a combinação attributify `<MaxInputCpfCnpj s11-11 s20-full-mobile />` verificando que:
      1. `[s11-11=""]{flex:1 1 0%;min-width:220px;max-width:220px;}` é emitido fora de `@media`;
      2. `@media (max-width: 767.98px){\n[s20-full-mobile=""]{flex:1 1 0%;min-width:400px;max-width:100%;}\n}` é emitido após `[s11-11=""]`.
- **Resultado esperado:** Cobertura unitária e de geração CSS alinhada ao contrato responsivo.

### Etapa 3 — Adicionar teste de navegador real para `s11-11 s20-full-mobile` no `MaxGrid`
- **Arquivo afetado:** `tests/browser/maxGridLineBreaks.browser.ts`
- **Dependências:** Etapa 1.
- **Ação:**
  - Adicionar um teste em `tests/browser/maxGridLineBreaks.browser.ts` montando `MaxGrid` com `MaxInputCpfCnpj` (ou elemento/componente equivalente com os atributos `s11-11 s20-full-mobile`) e a folha de estilos gerada pelo UnoCSS (para `s11-11` e `s20-full-mobile` via `presetMaxUno` + `presetAttributify`):
    - Em viewport desktop (`await page.viewport(1280, 800)`): verificar que `getComputedStyle(el).minWidth === '220px'`, `getComputedStyle(el).maxWidth === '220px'` e `el.getBoundingClientRect().width === 220`.
    - Em viewport mobile (`await page.viewport(375, 667)`): verificar que `getComputedStyle(el).minWidth === '400px'` e `getComputedStyle(el).maxWidth === '100%'` (sobrescrevendo os `220px` do desktop).
- **Resultado esperado:** Comprovação em motor Chromium real (Playwright) de que `s11-11 s20-full-mobile` aplica `s11-11` no desktop e `s20-full` apenas no mobile.

### Etapa 4 — Atualizar documentação e playground
- **Arquivos afetados:**
  - `docs/THEME.md` (seção 7.2, linhas 218–264)
  - `COMPONENTS.md` (seção `MaxGrid`, linhas 825–852)
  - `playground/src/scenarios/layout-grid.vue` (linhas 9–41)
- **Dependências:** Etapa 1.
- **Ação:**
  - Em `docs/THEME.md`: atualizar a explicação e a tabela de tokens `s-*` para documentar que os sufixos `-mobile`, `-tablet` e `-desktop` encapsulam as dimensões (`flex`, `min-width`, `max-width`) e eventual quebra (`break-before`/`break-after`) na respectiva `@media` query, permitindo compor `s11-11 s20-full-mobile`.
  - Em `COMPONENTS.md`: atualizar a descrição dos sufixos `-mobile`, `-tablet`, `-desktop` na seção do `MaxGrid`.
  - Em `playground/src/scenarios/layout-grid.vue`: atualizar a nota `.max-grid-doc-note` para esclarecer que os sufixos `-mobile`, `-tablet` e `-desktop` aplicam dimensionamento e fragmentação responsivos via `@media` CSS (embora não criem `.max-grid-row` estruturais no VDOM).
- **Resultado esperado:** Documentação técnica e playground sincronizados com o comportamento real.

### Etapa 5 — Validação em Lote e Fechamento
- **Arquivos afetados:** Nenhum (somente execução de validação e atualização de `docs/plans/wt-13a68947/execution-state.json` durante a sessão Execute).
- **Dependências:** Conclusão integral das Etapas 1 a 4.
- **Ação:**
  - Executar os testes unitários e de geração do preset e `MaxGrid`.
  - Executar o teste de navegador real via Playwright.
  - Executar `npm run type-check`, `npm run type-check:test` e `npm run lint`.
  - Se houver qualquer falha, corrigir em lote e reexecutar apenas as verificações afetadas.

---

## 6. Validação e Matriz de Aceite

### 6.1. Diferenciação entre Verificações Realizadas e Validações Futuras
- **Verificações realizadas no Plan Mode (somente leitura):**
  - Inspeção estática de `src/presetMaxUno.ts`, `src/components/MaxGrid.vue`, `src/components/base/gridSlotRows.ts`, `src/components/MaxInputCpfCnpj.vue`, `src/components/InputBase.vue`, `node_modules/@unocss/core/dist/index.mjs` e testes existentes.
  - Inspeção do caso real em `/home/johnattas/GitHub/engeapp/resources/Vue/Pages/CommercialProposalDetailPage.vue` (linha 114).
- **Validações futuras (a executar em lote na sessão Execute após concluir as Etapas 1–4):**
  1. `npx vitest run tests/preset/presetMaxUno.test.ts tests/preset/presetMaxUno.generate.test.ts tests/components/MaxGrid.test.ts`
  2. `npx vitest run --config vitest.browser.config.ts tests/browser/maxGridLineBreaks.browser.ts`
  3. `npm run type-check`
  4. `npm run type-check:test`
  5. `npm run lint`

### 6.2. Matriz de Aceite por Tarefa

| Tarefa / Etapa | Requisito Atendido | Evidência Factual Esperada | Testes Pertinentes | Revisão pelo Risco | Verificação Manual |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Etapa 1** (`src/presetMaxUno.ts`) | RF-01, RF-02, RF-03 | `yield` de dimensões e de posição incluem `[symbols.parent]: media` sempre que `device` for `mobile`, `tablet` ou `desktop` | `presetMaxUno.test.ts`, `presetMaxUno.generate.test.ts` | Baixo risco: preserva tokens sem `device` intactos e corrige vazamento global de tokens com `device` | N/A |
| **Etapa 2** (`tests/preset/*`) | RF-01, RF-02, RF-03, RF-04 | Testes unitários e de CSS gerado aprovados, incluindo `<MaxInputCpfCnpj s11-11 s20-full-mobile />` | `npx vitest run tests/preset/presetMaxUno.test.ts tests/preset/presetMaxUno.generate.test.ts` | Verifica ordem exata do CSS gerado (`[s11-11=""]` antes de `@media (max-width: 767.98px)`) | N/A |
| **Etapa 3** (`tests/browser/maxGridLineBreaks.browser.ts`) | RF-04 | Em `1280x800`, item com `s11-11 s20-full-mobile` tem `maxWidth: 220px`; em `375x667`, tem `minWidth: 400px` e `maxWidth: 100%` | `npx vitest run --config vitest.browser.config.ts tests/browser/maxGridLineBreaks.browser.ts` | Confirma comportamento real no motor de layout do navegador (Chromium) | Opcional via `npm run dev:playground` |
| **Etapa 4** (`docs/THEME.md`, `COMPONENTS.md`, `layout-grid.vue`) | Documentação e exemplos atualizados | Documentação descreve escopo `@media` nas dimensões e quebras para `-mobile`, `-tablet`, `-desktop` | `npm run lint` e `npx vitest run tests/architecture/playgroundCoverage.test.ts` | Garante conformidade com regras de ESLint/Stylelint e cobertura do playground | N/A |

---

## 7. Riscos e Operação

- **Compatibilidade e Impacto em Consumidores Existentes:**
  - Qualquer consumidor que utilizava tokens com sufixo `-mobile`, `-tablet` ou `-desktop` (como `s20-full-mobile` em `CommercialProposalDetailPage.vue`) tinha a intenção de que o dimensionamento fosse restrito ao respectivo dispositivo. A correção elimina o bug em que o token vazava para todas as resoluções de tela.
  - Caso algum consumidor utilize um único token com dispositivo e posição (ex.: `<div s10-start-mobile />`) sem declarar um token base para desktop, as dimensões `s10` agora também serão restritas ao mobile (`@media (max-width: 767.98px)`). Se desejar dimensão fixa em todas as telas e outra no mobile, basta declarar o token base junto ao token de dispositivo (ex.: `s10 s20-full-mobile`), que é o padrão natural de utilitários responsivos no UnoCSS.
- **Desempenho:**
  - Impacto zero em tempo de execução: a resolução ocorre na geração de CSS do UnoCSS adicionando apenas a propriedade `[symbols.parent]` já suportada nativamente pelo `@unocss/core`.
- **Limites de Reversão:**
  - Mudança puramente funcional e autocontida em `src/presetMaxUno.ts`, facilmente reversível via Git caso necessário.

---

## 8. Retomada e Governança de Execução (`execution-state.json` v2)

### 8.1. Instruções de Retomada para o Executor
1. **Leitura eficiente:** Na primeira admissão na fase Execute, leia este `plan.md` e `spec.md`. Nas retomadas subsequentes, consulte apenas os trechos pertinentes às etapas pendentes.
2. **Conferência de estado prévio:** Antes de editar qualquer arquivo, confira `git status`, `git diff` e a existência de `docs/plans/wt-13a68947/execution-state.json` para identificar trabalho já concluído e não refazer etapas já validadas.
3. **Respeito às decisões e execução em lote:** Siga a arquitetura definida na Seção 4 sem reabrir decisões sem evidência nova. Implemente todas as Etapas 1 a 4 antes de rodar os comandos de validação da Etapa 5.
4. **Conflitos de escrita:** As Etapas 1, 2, 3 e 4 tocam conjuntos disjuntos de arquivos (`src/presetMaxUno.ts`, `tests/preset/*`, `tests/browser/*`, `docs/*` + `playground/*`), mas como as Etapas 2 e 3 dependem semanticamente da Etapa 1 para passar nos testes, execute a Etapa 1 primeiro e valide tudo em lote na Etapa 5.

### 8.2. Registro Obrigatório de Progresso (`execution-state.json` v2) na Fase Execute
Durante a sessão de execução (Execute), registre o progresso após marcos e no fechamento em `docs/plans/wt-13a68947/execution-state.json` obedecendo estritamente ao schema **version 2**:
- **Campos permitidos no topo e nas tarefas:** Somente os campos do contrato v2 (é terminantemente **proibido** adicionar `blocker`, `diagnostic`, `branchSync`, `durableSync` ou `followUp`; motivos devem caber em `nextAction` com até 512 caracteres).
- **Hashes reais:** `planPath` aponta para `docs/plans/wt-13a68947/plan.md`, `planHash` deve ser o SHA256 real do arquivo `plan.md`, e cada `revision` em `verification` e `checks` deve ser o SHA256 real do estado/conteúdo verificado (nunca rótulos arbitrários).
- **Status válidos:**
  - Status de tarefa (`status`): `pending` | `running` | `completed` | `blocked` | `manualPending` | `validationFailed`.
  - Resultado de validação e de cada check (`result`): estritamente `passed` | `failed` | `pending` (`blocked` **não** é valor válido para `result`).
  - Quando `result === "passed"`, `exitCode` deve ser `0`. Quando `result === "failed"`, `exitCode` deve ser inteiro diferente de `0`. Quando `result === "pending"`, não inclua `exitCode`.
  - `command` deve ter até 4.096 caracteres e refletir exatamente o comando executado.
