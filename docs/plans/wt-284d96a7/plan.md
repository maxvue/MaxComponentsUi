# Plano de Execução — Outline Mais Escuro para Item Ativo em MaxBadgeButton e MaxBadgeButtonsGroup

## 1. Identificação
- **Título:** Adição de Outline Mais Escuro que o Background para Item Ativo em `MaxBadgeButton` (`MaxBadgeButtons`) e `MaxBadgeButtonsGroup`
- **Data:** 2026-10-14
- **Nome do Projeto:** `@maxvue/max-components-ui`
- **Nome da Worktree:** `wt-284d96a7`
- **Caminho da Worktree:** `/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-284d96a7`
- **Especificação Técnica:** `docs/plans/wt-284d96a7/spec.md`

---

## 2. Especificação

### 2.1. Problema e Objetivo
- **Problema:** Atualmente, quando um item em `MaxBadgeButton` (ou dentro de `MaxBadgeButtonsGroup`) está ativo (`isActive === true`), ele recebe a cor configurada em `color` (padrão `var(--blue-600)`) enquanto os itens inativos recebem `var(--background-400)`, mas o item ativo não possui um contorno (`outline`) mais escuro que seu próprio `background` para destacar visualmente o estado ativo.
- **Objetivo:** Fazer com que o item ativo em `MaxBadgeButton` (`MaxBadgeButtons`) e `MaxBadgeButtonsGroup` exiba um `outline` cuja cor seja calculada dinamicamente para ser mais escura (menor luminância relativa WCAG) que o `background` do item.

### 2.2. Usuários e Consumidores Afetados
- Aplicações consumidoras do ecossistema Max / Engeapp que utilizam `MaxBadgeButton`, `BadgeButton`, `MaxBadgeButtons`, `MaxBadgeButtonsGroup`, `MaxBadgeButtonGroup`, `BadgeButtonsGroup` ou `BadgeButtonGroup` em filtros, seletores de status e barras de ferramentas.

### 2.3. Requisitos e Comportamentos Esperados
- **REQ-01 (Outline no item ativo de `MaxBadgeButton`):** Quando `isActive` for `true` (via `modelValue` booleano `true`, numérico `1` ou toggle interno autônomo), o item deve aplicar um `outline` sólido (`1.5px solid <cor>`, `outline-offset: -1px`) cuja cor possua luminância relativa WCAG estritamente menor que a luminância do `background` efetivo do badge.
- **REQ-02 (Ausência de outline ativo quando inativo):** Quando `isActive` for `false`, nenhum `outline` de estado ativo deve ser aplicado ao item.
- **REQ-03 (Outline nos itens ativos de `MaxBadgeButtonsGroup`):** Todo item selecionado (`isItemSelected(item) === true`) dentro de `MaxBadgeButtonsGroup` (tanto em modo `onlyOne: true` quanto `onlyOne: false`) deve exibir o `outline` mais escuro que o seu respectivo `background` (respeitando `item.color`, `props.color` e `item.background`).
- **REQ-04 (Suporte a temas Claro/Escuro e `background` customizado):** O cálculo da cor do `outline` deve partir do `background` efetivo do badge (`props.background || resolveBadgeColors(color, isDark, false).background`), garantindo que a cor do `outline` seja sempre mais escura que o fundo, tanto no modo claro (`bgLum ≈ 0.83` -> `outlineLum ≈ 0.40`) quanto no modo escuro (`bgLum ≈ 0.18` -> `outlineLum ≈ 0.08`) ou com `background` customizado.
- **REQ-05 (Compatibilidade de Alias `MaxBadgeButtons`):** Exportar os aliases `MaxBadgeButtons` e `BadgeButtons` apontando para `MaxBadgeButton.vue` em `src/index.ts`, `src/scripts/generateResolver.ts` e `src/components-manifest.json`.
- **REQ-06 (Preservação de Acessibilidade `:focus-visible`):** O anel de foco de teclado (`:focus-visible`) em `.max-badge-button` (`outline: var(--max-focus-outline, 2px solid var(--max-focus-ring-color, #00768e))` com `outline-offset: 2px`) deve continuar funcionando sem perda de contraste.

### 2.4. Casos Extremos e Falhas Tratadas
- **Cor inválida ou variável CSS não resolvida:** `parseColorToRgb` já utiliza `getColorFromVar` com fallback seguro para `[59, 130, 246]` (`#3b82f6`), impedindo exceções em runtime ou SSR/testes.
- **Cor de fundo preta extrema (`#000000`, luminância `0`):** O cálculo limita a luminância-alvo a `[0, 1]`, retornando `#000000` sem valores `NaN` ou fora do intervalo RGB.
- **Modo `neon: true`:** O cálculo do outline ativo utiliza o fundo base resolvido ou `activeOutline` sem quebrar a borda/glow neon existente.

### 2.5. Escopo Incluído e Excluído
- **Incluído:**
  - `src/helpers/colorLuminance.ts`
  - `src/components/MaxBadge.vue`
  - `src/components/MaxBadgeButton.vue`
  - `src/components/MaxBadgeButtonsGroup.vue`
  - `src/index.ts`
  - `src/scripts/generateResolver.ts`
  - `src/components-manifest.json`
  - `tests/components/MaxBadgeButton.test.ts`
  - `tests/components/MaxBadgeButtonsGroup.test.ts`
- **Excluído:**
  - Alterações em lógica de eventos, `v-model` ou seleção de `MaxBadgeButton` e `MaxBadgeButtonsGroup`.
  - Alteração visual do `MaxBadge` quando usado isoladamente (sem `outlineColor`).

---

## 3. Evidências da Investigação

### 3.1. Arquivos Existentes Inspecionados
- [`src/components/MaxBadgeButton.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-284d96a7/src/components/MaxBadgeButton.vue):
  - Renderiza `<button type="button" class="max-badge-button" :class="{ 'is-active': isActive, 'is-disabled': props.disabled }">` contendo `<MaxBadge :color="currentColor" ... />`.
  - Quando `isActive` é `true`, `currentColor` retorna `props.color` (default `'var(--blue-600)'`); quando `false`, retorna `'var(--background-400)'`.
  - Não aplica `outline` diferenciado quando `isActive` é `true`.
- [`src/components/MaxBadgeButtonsGroup.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-284d96a7/src/components/MaxBadgeButtonsGroup.vue):
  - Renderiza um `<MaxBadgeButton>` para cada item de `safeItems`, passando `:model-value="isItemSelected(item)"`.
- [`src/components/MaxBadge.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-284d96a7/src/components/MaxBadge.vue):
  - Resolve cores via `resolveBadgeColors(props.color, isDark.value, props.neon)` e aplica `backgroundColor` e `color` em `badgeStyles`.
- [`src/helpers/colorLuminance.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-284d96a7/src/helpers/colorLuminance.ts):
  - Contém `parseColorToRgb`, `getWcagRelativeLuminance`, `adjustToWcagLuminance` e `resolveBadgeColors` (que usa `@maxvue/max-use` `getColorFromVar`).
- [`src/index.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-284d96a7/src/index.ts), [`src/scripts/generateResolver.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-284d96a7/src/scripts/generateResolver.ts) e [`src/components-manifest.json`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-284d96a7/src/components-manifest.json):
  - Exportam `MaxBadgeButton`, `BadgeButton`, `MaxBadgeButtonsGroup`, `MaxBadgeButtonGroup`, `BadgeButtonsGroup`, `BadgeButtonGroup` e os helpers de `colorLuminance.ts`.
- [`tests/components/MaxBadgeButton.test.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-284d96a7/tests/components/MaxBadgeButton.test.ts) e [`tests/components/MaxBadgeButtonsGroup.test.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-284d96a7/tests/components/MaxBadgeButtonsGroup.test.ts):
  - Suítes unitárias existentes dos dois componentes.
- [`eslint.config.js`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-284d96a7/eslint.config.js) e `GEMINI.md`:
  - Regras estritas de formatação: tags de abertura em uma única linha no `<template>`, `vue/script-indent` com `baseIndent: 1` (4 espaços), `curly: ['error', 'multi']`, `@stylistic/nonblock-statement-body-position: ['error', 'beside']`, aspas simples, ponto e vírgula obrigatório, sem vírgula final (`comma-dangle: 'never'`).

### 3.2. Arquivos Novos Propostos
- Nenhum arquivo de código novo precisa ser criado; todas as alterações ocorrem nos arquivos existentes listados na seção 2.5.

### 3.3. Limitações de Acesso
- Nenhuma limitação de acesso identificada no repositório/worktree.

---

## 4. Solução e Decisões Técnicas

### 4.1. Decisões Confirmadas e Fundamentadas no Código
1. **Cálculo WCAG de Cor Mais Escura que o Background (`resolveBadgeActiveOutlineColor` em `src/helpers/colorLuminance.ts`):**
   - **Justificativa:** O projeto já padroniza todas as cores de `MaxBadge` e `MaxStats` em `src/helpers/colorLuminance.ts` utilizando `parseColorToRgb` (com `getColorFromVar` do `@maxvue/max-use`), `getWcagRelativeLuminance` e `adjustToWcagLuminance`. Calcular o `outline` reduzindo a luminância relativa WCAG do `background` efetivo (`targetLum = bgLum > 0.5 ? bgLum * 0.48 : bgLum * 0.45`) garante matematicamente que o `outline` tenha o mesmo matiz/saturação e seja sempre mais escuro que o `background` do item, tanto no modo claro (`bgLum = 0.83` -> `~0.40`) quanto no modo escuro (`bgLum = 0.18` -> `~0.08`) ou com prop `background` customizada.
2. **Aplicação do Outline em `MaxBadgeButton` e `MaxBadge`:**
   - Em `MaxBadge.vue`, a prop opcional `outlineColor?: string` adiciona `outline: 1.5px solid ${props.outlineColor}` e `outlineOffset: '-1px'` em `badgeStyles`.
   - Em `MaxBadgeButton.vue`, quando `isActive` é `true`, `activeOutlineColor` é computado via `resolveBadgeActiveOutlineColor(currentColor.value, isDark.value, props.background)` e aplicado tanto em `button.max-badge-button.is-active` (via `:style="buttonStyles"` com `border-radius: 6px`) quanto repassado a `<MaxBadge :outline-color="activeOutlineColor" />`.
   - Quando o botão recebe foco de teclado (`:focus-visible`), `button.max-badge-button:focus-visible` aplica o anel de foco externo (`outline-offset: 2px !important`), enquanto o `.max-badge` interno mantém o outline ativo (`outline-offset: -1px`), evitando colisão visual e preservando acessibilidade WCAG.
3. **Propagação Automática em `MaxBadgeButtonsGroup`:**
   - Como `MaxBadgeButtonsGroup.vue` renderiza `<MaxBadgeButton>` para cada item com `:model-value="isItemSelected(item)"`, todos os itens ativos do grupo recebem automaticamente o `outline` mais escuro que seu respectivo `background`. Adicionalmente, `MaxBadgeButtonsGroupProps` aceitará `color?: string` e `dark?: boolean` opcionais no nível do grupo como fallback para `item.color` e `item.dark`.

### 4.2. Alternativas Descartadas
- **Cor fixa estática para o outline (ex: `outline: 1px solid #000`):** Descartada porque não acompanha a tonalidade (matiz/saturação) do background do item e pode ficar com baixo contraste em fundos escuros.
- **Usar `filter: brightness(...)` no elemento inteiro:** Descartada porque escureceria também o fundo e o texto do badge, em vez de aplicar apenas um `outline` mais escuro que o background.

---

## 5. Etapas de Execução

> **Instrução de Execução em Lote:** Implemente todas as Etapas 1 a 4 antes de rodar a bateria de validações da Etapa 5. Não execute testes, checagem de tipos ou lint entre microedições.

### Etapa 1 — Implementar cálculo de cor de outline mais escura em `src/helpers/colorLuminance.ts` e exportar em `src/index.ts`
- **Arquivos afetados:**
  - `src/helpers/colorLuminance.ts`
  - `src/index.ts`
- **Ações:**
  1. Em `src/helpers/colorLuminance.ts`:
     - Adicionar a propriedade `activeOutline: string;` na interface `BadgeColors`.
     - Em `resolveBadgeColors`, calcular `const activeOutlineLum = bgLum > 0.5 ? bgLum * 0.48 : bgLum * 0.45;` e `const activeOutline = adjustToWcagLuminance(baseColor, activeOutlineLum);`, incluindo `activeOutline` no objeto retornado (tanto para modo normal quanto para modo `isNeon`).
     - Criar e exportar a função memoizada `resolveBadgeActiveOutlineColor(baseColor: string = 'var(--blue-600)', isDark: boolean = false, customBackground?: string): string`:
       - Se `customBackground` for informado e não vazio, extrair `[r, g, b] = parseColorToRgb(customBackground)`, calcular `bgLum = getWcagRelativeLuminance(r, g, b)`, calcular `targetLum = bgLum > 0.5 ? bgLum * 0.48 : bgLum * 0.45` e retornar `adjustToWcagLuminance(customBackground, targetLum)`.
       - Caso contrário, retornar `resolveBadgeColors(baseColor, isDark, false).activeOutline`.
  2. Em `src/index.ts`:
     - Exportar `resolveBadgeActiveOutlineColor` junto às demais funções de `./helpers/colorLuminance`.
     - Exportar os aliases `export { default as MaxBadgeButtons } from './components/MaxBadgeButton.vue';` e `export { default as BadgeButtons } from './components/MaxBadgeButton.vue';`.
- **Dependências:** Nenhuma.
- **Resultado esperado:** Helper `resolveBadgeActiveOutlineColor` disponível e tipado, retornando sempre um hexadecimal `#rrggbb` com luminância WCAG menor que a do background do item.

### Etapa 2 — Atualizar `MaxBadge.vue`, `MaxBadgeButton.vue` e `MaxBadgeButtonsGroup.vue`
- **Arquivos afetados:**
  - `src/components/MaxBadge.vue`
  - `src/components/MaxBadgeButton.vue`
  - `src/components/MaxBadgeButtonsGroup.vue`
- **Ações:**
  1. Em `src/components/MaxBadge.vue`:
     - Adicionar `outlineColor?: string;` em `MaxBadgeProps` (com default `undefined` em `withDefaults`).
     - Em `badgeStyles`, adicionar:
       ```ts
       if (props.outlineColor) {
           styles.outline = `1.5px solid ${props.outlineColor}`;
           styles.outlineOffset = '-1px';
       }
       ```
     - Garantir que todas as tags de abertura no `<template>` estejam em linha única (regra 5.1 do `GEMINI.md`) e que a transição CSS inclua `outline-color 0.2s ease`.
  2. Em `src/components/MaxBadgeButton.vue`:
     - Importar `useHtmlDark` de `'../helpers/useHtmlDark'` e `resolveBadgeActiveOutlineColor` de `'../helpers/colorLuminance'`.
     - Adicionar `dark?: boolean;` em `MaxBadgeButtonProps` (default `undefined`).
     - Computar `isDark`, `activeOutlineColor` (quando `isActive.value` for `true`, chama `resolveBadgeActiveOutlineColor(currentColor.value, isDark.value, props.background)`, senão `undefined`) e `buttonStyles` (quando `activeOutlineColor.value` existir, retorna `{ outline: \`1.5px solid \${activeOutlineColor.value}\`, outlineOffset: '-1px', '--max-badge-active-outline': activeOutlineColor.value }`).
     - No `<template>` (com tags de abertura em linha única):
       - Passar `:style="buttonStyles"` no `<button class="max-badge-button" ...>`.
       - Passar `:dark="props.dark"` e `:outline-color="activeOutlineColor"` no `<MaxBadge ... />`.
     - No `<style lang="scss" scoped>` de `MaxBadgeButton.vue`:
       - Adicionar `border-radius: 6px;` em `.max-badge-button`.
       - Em `&:focus-visible`, manter o foco canônico com `outline: var(--max-focus-outline, 2px solid var(--max-focus-ring-color, #00768e)) !important;` e `outline-offset: 2px !important;`.
  3. Em `src/components/MaxBadgeButtonsGroup.vue`:
     - Adicionar `color?: string;` e `dark?: boolean;` opcionais em `MaxBadgeButtonsGroupProps` (com defaults `undefined`).
     - No `<template>` (com tags de abertura em linha única), passar `:color="item.color ?? props.color"` e `:dark="item.dark ?? props.dark"` para `<MaxBadgeButton>`.
- **Dependências:** Etapa 1.
- **Resultado esperado:** Tanto `<MaxBadgeButton>` quanto `<MaxBadgeButtonsGroup>` renderizam um `outline` mais escuro que o `background` do item quando ativo, e removem o `outline` quando inativo.

### Etapa 3 — Atualizar aliases em `src/scripts/generateResolver.ts` e `src/components-manifest.json`
- **Arquivos afetados:**
  - `src/scripts/generateResolver.ts`
  - `src/components-manifest.json`
- **Ações:**
  1. Em `src/scripts/generateResolver.ts`, adicionar `'MaxBadgeButtons': 'MaxBadgeButton'` no mapa `aliases`.
  2. Atualizar `src/components-manifest.json` adicionando os aliases correspondentes (`MaxBadgeButtons`, `max_badge_buttons`, `max-badge-buttons`, `BadgeButtons`, `badge_buttons`, `badge-buttons` -> `"MaxBadgeButton"`).
- **Dependências:** Etapa 2.
- **Resultado esperado:** Manifesto e resolver sincronizados com os aliases exportados em `src/index.ts`.

### Etapa 4 — Atualizar Testes Unitários em `tests/components/MaxBadgeButton.test.ts` e `tests/components/MaxBadgeButtonsGroup.test.ts`
- **Arquivos afetados:**
  - `tests/components/MaxBadgeButton.test.ts`
  - `tests/components/MaxBadgeButtonsGroup.test.ts`
- **Ações:**
  1. Em `tests/components/MaxBadgeButton.test.ts`:
     - Adicionar teste verificando que, quando ativo (`modelValue: true` ou após clique), o botão e o `.max-badge` possuem `outline` aplicado cuja cor extraída tem luminância relativa WCAG (`getWcagRelativeLuminance`) estritamente menor que a luminância do `background-color` do badge.
     - Verificar que, quando inativo (`modelValue: false`), não há `outline` ativo no estilo do botão nem do `.max-badge`.
     - Testar também com `background` customizado (ex: `background: '#93c5fd'`).
  2. Em `tests/components/MaxBadgeButtonsGroup.test.ts`:
     - Adicionar teste verificando que, em `MaxBadgeButtonsGroup`, o item ativo (`is-active`) exibe `outline` com cor mais escura que seu `background-color`, enquanto os demais itens inativos não possuem `outline` ativo, e que ao trocar a seleção o `outline` acompanha o novo item ativo.
- **Dependências:** Etapa 2.
- **Resultado esperado:** Cobertura automatizada completa dos novos requisitos.

### Etapa 5 — Validação em Lote
- **Comandos de verificação (executar após concluir as Etapas 1 a 4):**
  1. `npx vitest run tests/components/MaxBadgeButton.test.ts tests/components/MaxBadgeButtonsGroup.test.ts tests/components/MaxBadge.test.ts`
  2. `npm run type-check`
  3. `npm run type-check:test`
  4. `npm run lint`
- **Dependências:** Etapas 1, 2, 3 e 4 concluídas.

---

## 6. Validação e Matriz de Aceite

### 6.1. Matriz de Aceite por Tarefa

| Tarefa / Etapa | Requisito Associado | Evidência Observável | Testes Pertinentes | Revisão pelo Risco | Verificação Manual |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Etapa 1:** `colorLuminance.ts` + `index.ts` | REQ-01, REQ-04, REQ-05 | `resolveBadgeActiveOutlineColor` retorna hex `#rrggbb` com luminância WCAG `< bgLum` em modo claro, escuro e `customBackground`. | `tests/components/MaxBadgeButton.test.ts` | Baixo (função pura determinística com cache e fallback RGB). | N/A |
| **Etapa 2:** `MaxBadge.vue`, `MaxBadgeButton.vue`, `MaxBadgeButtonsGroup.vue` | REQ-01, REQ-02, REQ-03, REQ-06 | Item `.is-active` renderiza `outline: 1.5px solid #<hex>` mais escuro que `background-color`; item inativo não possui `outline`. | `tests/components/MaxBadgeButton.test.ts`, `tests/components/MaxBadgeButtonsGroup.test.ts`, `tests/components/MaxBadge.test.ts` | Baixo (preserva todos os emits, props e `:focus-visible` existentes). | Opcional via `npm run dev:playground` no cenário `buttons-badges`. |
| **Etapa 3:** `generateResolver.ts` + `components-manifest.json` | REQ-05 | Resolver resolve `MaxBadgeButtons` e `BadgeButtons` para `MaxBadgeButton`. | `npm run type-check` e `npm run lint` | Baixo. | N/A |
| **Etapa 4 e 5:** Testes e Gates de Qualidade | REQ-01 a REQ-06 | Todos os testes unitários, `type-check`, `type-check:test` e `lint` passam com `exitCode: 0`. | `npx vitest run ...`, `npm run type-check`, `npm run type-check:test`, `npm run lint` | Baixo. | N/A |

### 6.2. Diferenciação entre Verificações Realizadas (Plan) e Futuras (Execute)
- **Verificações realizadas nesta sessão Plan (somente leitura):**
  - Inspeção completa de `MaxBadgeButton.vue`, `MaxBadgeButtonsGroup.vue`, `MaxBadge.vue`, `colorLuminance.ts`, `index.ts`, `generateResolver.ts`, `components-manifest.json`, `eslint.config.js`, `vitest.config.ts`, `tests/setup.ts` e suítes de teste existentes.
- **Validações futuras (a serem executadas na sessão Execute):**
  - Execução de `npx vitest run tests/components/MaxBadgeButton.test.ts tests/components/MaxBadgeButtonsGroup.test.ts tests/components/MaxBadge.test.ts`.
  - Execução de `npm run type-check`, `npm run type-check:test` e `npm run lint`.

---

## 7. Riscos, Preflight e Operação

### 7.1. Preflight do Ambiente por Leitura (Antes de Implementar no Execute)
- Conferir por leitura que a execução está na worktree `/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-284d96a7` (branch `wt-284d96a7`).
- Verificar que `package.json` mantém `@maxvue/max-use` via versão npm (`^1.1.47`) sem caminhos locais `file:../MaxUse`.
- Não alterar configurações de banco, `.env` ou serviços externos (biblioteca pura de componentes frontend com Vitest + `happy-dom`).

### 7.2. Riscos e Mitigações
- **Risco 1 — Conflito com regras estritas do ESLint/Stylelint (ex: `vue/script-indent`, `curly: multi`, tags de abertura em linha única):**
  - *Mitigação:* Seguir estritamente `baseIndent: 1` (4 espaços) dentro de `<script setup lang="ts">`, manter `if` de linha única na mesma linha sem chaves (`if (!isActive.value) return undefined;`), manter tags de abertura HTML/Vue em uma única linha no `<template>`, e validar com `npm run lint`.
- **Risco 2 — Sobreposição do `outline` ativo com o `:focus-visible` de acessibilidade:**
  - *Mitigação:* O outline ativo usa `outline-offset: -1px` (interno à borda do badge), enquanto `:focus-visible` no botão usa `outline-offset: 2px !important` (anel externo), garantindo que ambos coexistam claramente quando o botão estiver focado via teclado.
- **Risco 3 — Limites de Reversão:**
  - *Mitigação:* Mudança puramente aditiva e isolada em estilos/cálculo de cor de `MaxBadgeButton`, `MaxBadgeButtonsGroup`, `MaxBadge` e `colorLuminance.ts`, totalmente reversível via Git na worktree.

---

## 8. Guia de Retomada e Registro de Estado (`execution-state.json`)

### 8.1. Instruções para o Executor na Admissão e Retomada
1. **Leitura inicial:** Ler este plano (`docs/plans/wt-284d96a7/plan.md`) e a especificação (`docs/plans/wt-284d96a7/spec.md`) na primeira admissão; em retomadas, consultar apenas as etapas pendentes e `docs/plans/wt-284d96a7/execution-state.json`.
2. **Conferência de trabalho prévio:** Verificar `git status` e `git diff` na worktree `/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-284d96a7` para identificar etapas já aplicadas.
3. **Execução disciplinada:** Seguir as decisões e a ordem das Etapas 1 a 4 sem reabrir decisões arquiteturais e sem executar testes/lint/build entre microedições.
4. **Validação em lote:** Após concluir todas as edições das Etapas 1 a 4, executar os comandos da Etapa 5, corrigir eventuais apontamentos em lote e revalidar.

### 8.2. Registro de Progresso (`docs/plans/wt-284d96a7/execution-state.json`)
Durante a fase **Execute**, atualizar `docs/plans/wt-284d96a7/execution-state.json` utilizando estritamente o **schema version 2**:
- Vincular `planRevision` ao hash SHA256 real do arquivo `docs/plans/wt-284d96a7/plan.md`.
- Não incluir campos proibidos (`blocker`, `diagnostic`, `branchSync`, `durableSync`, `followUp`); usar `nextAction` (máx. 512 caracteres) para descrever próximos passos ou motivos.
- Status de tarefa permitidos: `pending`, `running`, `completed`, `blocked`, `manualPending`, `validationFailed`.
- Em `verification`: `{ "revision": "<SHA256>", "checks": [{ "command": "...", "revision": "<SHA256>", "result": "passed" | "failed" | "pending", "exitCode": 0 }] }` (onde `passed` exige `exitCode: 0`, `failed` exige inteiro `!= 0`, e `pending` não inclui `exitCode`).
