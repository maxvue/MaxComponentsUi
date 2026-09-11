# Plano de Implementação: Erradicação de Estilos Inline no Template e Padronização da Infraestrutura de Overlays com `MaxBaseOverlay`

## 1. Objetivo da Refatoração

Erradicar mais de **60 ocorrências de estilos inline** (`style="..."` e `:style="..."`) presentes nos templates de mais de 20 componentes SFC da biblioteca, restabelecendo o cumprimento estrito das regras de encapsulamento semântico do `GEMINI.md`.

As metas prioritárias da refatoração são:
1. **Padronização da Infraestrutura de Elementos Flutuantes (Overlay Engine)**: Eliminar expressões artesanais de coordenadas (`:style="{ top: position.top + 'px', left: position.left + 'px', width: position.width, zIndex: zIndex }"`) replicadas em `MaxInputSelect.vue`, `MaxTagSelect.vue`, `MaxInputDatePicker.vue`, `MaxInputPhone.vue`, `MaxInputAutoComplete.vue` e `MaxInputAutoCompleteApi.vue`. Padronizar a ancoragem através da primitiva já arquitetada `src/components/base/MaxBaseOverlay.vue`, que gerencia coordenadas fixed, auto-flip em bordas de viewport, z-index incremental e ciclo de vida de listeners (scroll e resize com RAF).
2. **Eliminação de Estilos Inline Estáticos**: Substituir declarações como `style="display: none;"` em `MaxInputFile.vue` e `MaxInputFileUpload.vue`, e dimensões hardcoded como `style="height: 300px; width: 300px;"` em `MaxInputFileUploadBig.vue` e `MaxLoaderAi.vue`, por classes CSS semânticas estruturadas exclusivamente na tag `<style lang="scss" scoped>`.
3. **Substituição de Manipulação Direta de CSS por CSS Custom Properties Delimitadas**: Onde valores dinâmicos de dados do usuário forem inevitáveis (como cores de tags personalizadas em tempo de execução ou escala reativa), injetar variáveis CSS delimitadas (ex.: `:style="{ '--tag-color': color }"`) em vez de propriedades CSS diretas (`:style="{ color: color, paddingRight: '10px' }"`), delegando a estilização ao SCSS scoped.
4. **Conformidade com Políticas de Segurança (CSP)**: Garantir compatibilidade do Design System com ambientes que exigem Content Security Policy rigoroso (proibição de `unsafe-inline`).

---

## 2. Arquivos Afetados

| Caminho Relativo | Caminho Absoluto | Padrão Encontrado |
|---|---|---|
| `src/components/base/MaxBaseOverlay.vue` | `/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/base/MaxBaseOverlay.vue` | Primitiva central de ancoragem a ser consolidada |
| `src/components/MaxInputFile.vue` | `/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputFile.vue` | `style="display: none;"` em `<input type="file">` |
| `src/components/MaxInputFileUpload.vue` | `/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputFileUpload.vue` | `style="display: none;"` em `<input type="file">` |
| `src/components/MaxInputFileUploadBig.vue` | `/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputFileUploadBig.vue` | `style="height: 300px; width: 300px;"` em `<DotLottieVue>` |
| `src/components/MaxLoaderAi.vue` | `/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxLoaderAi.vue` | `style="height: 400px; width: 400px;"` em `<DotLottieVue>` |
| `src/components/MaxInputSelect.vue` | `/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputSelect.vue` | `:style` em overlay (top/left/width) e `:style="{ paddingRight: ... }"` |
| `src/components/MaxTagSelect.vue` | `/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxTagSelect.vue` | `:style` em overlay e `:style="getStyleColor(...)"` |
| `src/components/MaxInputDatePicker.vue` | `/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputDatePicker.vue` | `:style="{ top: ..., left: ..., zIndex: ... }"` em dropdown |
| `src/components/MaxInputAutoComplete.vue` | `/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputAutoComplete.vue` | `:style="{ top: ..., left: ..., width: ... }"` em overlay |
| `src/components/MaxInputAutoCompleteApi.vue` | `/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputAutoCompleteApi.vue` | `:style="{ top: ..., left: ..., width: ... }"` em overlay |
| `src/components/MaxInputPhone.vue` | `/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputPhone.vue` | `:style` para coordenadas do dropdown de DDI |
| `src/components/MaxPopover.vue` | `/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxPopover.vue` | `:style` para coordenadas e opacidade no template |
| `src/components/MaxPopoverConfirm.vue` | `/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxPopoverConfirm.vue` | `:style` para coordenadas manuais de diálogo |
| `src/components/MaxPopoverMenu.vue` | `/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxPopoverMenu.vue` | `:style` para coordenadas do menu flutuante |
| `src/components/MaxUserSection.vue` | `/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxUserSection.vue` | `:style="{ top: ..., left: ..., zIndex: ... }"` no menu do usuário |
| `src/components/MaxIconButton.vue` | `/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxIconButton.vue` | `:style="{ width, height, transform }"` no elemento raiz |

---

## 3. Passo a Passo Detalhado da Implementação

### Fase 1: Eliminação de Estilos Inline Estáticos em Inputs Nativos e Animações

1. **`MaxInputFile.vue` (Linha 7) e `MaxInputFileUpload.vue` (Linha 7)**:
   - **No `<template>`**:
     ```html
     <!-- Antes -->
     <input ref="nativeInputRef" type="file" class="max-input-file-hidden" style="display: none;" ... />

     <!-- Depois -->
     <input ref="nativeInputRef" type="file" class="max-input-file-hidden" ... />
     ```
   - **No `<style lang="scss" scoped>`**:
     ```scss
     .max-input-file-hidden,
     .max-file-native-input {
         display: none !important;
     }
     ```
2. **`MaxInputFileUploadBig.vue` (Linhas 25 e 34)**:
   - **No `<template>`**:
     ```html
     <!-- Antes -->
     <DotLottieVue style="height: 300px; width: 300px;" background="red" autoplay loop src="..." />

     <!-- Depois -->
     <DotLottieVue class="upload-lottie-canvas" background="red" autoplay loop src="..." />
     ```
   - **No `<style lang="scss" scoped>`**:
     ```scss
     .upload-lottie-canvas {
         width: 300px;
         height: 300px;
     }
     ```
3. **`MaxLoaderAi.vue` (Linha 5)**:
   - **No `<template>`**:
     ```html
     <!-- Antes -->
     <DotLottieVue style="height: 400px; width: 400px;" autoplay loop src="..." />

     <!-- Depois -->
     <DotLottieVue class="loader-ai-lottie" autoplay loop src="..." />
     ```
   - **No `<style lang="scss" scoped>`**:
     ```scss
     .loader-ai-lottie {
         width: 400px;
         height: 400px;
     }
     ```

### Fase 2: Purificação de Estilos Inline de Layout e Espaçamento

1. **`MaxInputSelect.vue` (Linha 30)**:
   - **No `<template>`**:
     - **Antes**: `<MaxIcon ... :style="{ paddingRight: option_selected.icon ? '10px' : '0' }" />`
     - **Depois**: `<MaxIcon ... :class="{ 'has-padding-right': Boolean(option_selected.icon) }" />`
   - **No `<style lang="scss" scoped>`**:
     ```scss
     .value-div {
         :deep(.has-padding-right) {
             padding-right: 10px;
         }
     }
     ```
2. **`MaxIconButton.vue` (Linhas 6-10)**:
   - **No `<template>`**:
     - **Antes**:
       ```html
       :style="{
           width: size,
           height: size,
           transform: 'scale(' + (hover && !isDisabled ? props.hoverScale : 1) + ')'
       }"
       ```
     - **Depois**:
       ```html
       :style="{
           '--icon-btn-size': size,
           '--icon-btn-scale': hover && !isDisabled ? String(props.hoverScale) : '1'
       }"
       ```
   - **No `<style lang="scss" scoped>`**:
     ```scss
     .icon-div {
         width: var(--icon-btn-size, 16px);
         height: var(--icon-btn-size, 16px);
         transform: scale(var(--icon-btn-scale, 1));
     }
     ```

### Fase 3: Padronização de Dropdowns e Menus com `MaxBaseOverlay`

A biblioteca já possui o componente primitivo `src/components/base/MaxBaseOverlay.vue`. Este componente encapsula:
- Ancoragem ao elemento gatilho (`props.target`) via `getBoundingClientRect()`.
- Cálculo de auto-flip para abertura superior quando não há espaço na parte inferior da tela.
- Ajuste de limites na viewport (`vw` e `vh`) para evitar estouro horizontal.
- Suporte a `matchTargetWidth` para manter a largura idêntica ao campo de input.
- Reposicionamento via `requestAnimationFrame` em eventos de `scroll` (com captura em toda a árvore) e `resize`.
- Fechamento acessível por clique fora (`onClickOutside`) e tecla `Escape` (`closeOnEscape`).
- Gerenciamento seguro de `z-index` incremental.

#### Migração de `MaxInputSelect.vue`:
- **Substituição da estrutura no `<template>`**:
  ```html
  <!-- ANTES -->
  <Teleport to="body" v-if="isOpen">
      <div class="max-select-backdrop" @click="hide">
          <div
              ref="overlayEl"
              :id="listboxId"
              class="max-select-overlay"
              role="listbox"
              tabindex="-1"
              :style="{ top: position.top + 'px', left: position.left + 'px', width: position.width }"
              @click.stop
          >
              <!-- Conteúdo da lista -->
          </div>
      </div>
  </Teleport>

  <!-- DEPOIS -->
  <MaxBaseOverlay
      v-model:visible="isOpen"
      :target="triggerEl"
      match-target-width
      role="listbox"
      @hide="hide"
  >
      <div :id="listboxId" class="max-select-overlay" tabindex="-1">
          <!-- Conteúdo da lista intacto -->
      </div>
  </MaxBaseOverlay>
  ```
- **Limpeza no `<script setup>`**:
  - Eliminar os watchers e listeners manuais de scroll/resize e cálculos de pixels repetidos em `position`, pois `MaxBaseOverlay` já os executa de forma centralizada e performática.

#### Migração em Cadeia nos Demais Componentes Flutuantes:
1. **`MaxTagSelect.vue`**: Adotar `MaxBaseOverlay` com `:target="triggerEl"`, removendo o backdrop artesanal e o binding de coordenadas no `:style`.
2. **`MaxInputAutoComplete.vue` e `MaxInputAutoCompleteApi.vue`**: Adotar `MaxBaseOverlay` ancorado ao container de input (`:target="ac"`).
3. **`MaxInputDatePicker.vue`**: Adotar `MaxBaseOverlay` ancorado ao trigger do seletor de data.
4. **`MaxInputPhone.vue`**: Ancorar o seletor de bandeira/DDI utilizando `MaxBaseOverlay`.
5. **`MaxUserSection.vue`**: Substituir o menu flutuante em teleport com `:style` pelo `MaxBaseOverlay` ancorado ao avatar.

### Fase 4: Refatoração de Tags com Cores Dinâmicas em `MaxTagSelect.vue`

- **No `<template>`**:
  - **Antes**: `:style="getStyleColor(option_selected, false, true)"`
  - **Depois**:
    ```html
    :style="{
        '--tag-custom-color': getOptionColor(option_selected),
        '--tag-custom-bg': getOptionBg(option_selected)
    }"
    ```
- **No `<style lang="scss" scoped>`**:
  ```scss
  .value-tag-div {
      color: var(--tag-custom-color, var(--background-775));
      background-color: var(--tag-custom-bg, var(--background-100));
  }
  ```

---

## 4. Regras de Estilo do GEMINI.md a Cumprir

- **Proibição Absoluta de Atributos de Estilo no Template**: Nenhum elemento HTML ou componente SFC deve carregar regras CSS de dimensionamento, alinhamento ou visibilidade diretamente em atributos `style="..."`.
- **O Único Meio Permitido é `<style lang="scss" scoped>`**: Toda e qualquer propriedade visual estática deve residir obrigatoriamente dentro do bloco com escopo do componente.
- **Isolamento de Responsabilidades**: O template é exclusivo para estrutura e semântica; o script para comportamento e dados; o SCSS para apresentação visual.

---

## 5. Critérios de Aceite e Verificação Técnica

1. **Varredura de Estilos Inline Estáticos**:
   ```bash
   rg 'style="display:\s*none;"' src/components
   rg 'style="height:' src/components
   ```
   *Critério*: Deve retornar **0 resultados**.
2. **Redução Maciça de Diretivas `:style`**:
   - As únicas ocorrências remanescentes aceitáveis de `:style` em templates devem ser restritas à passagem de variáveis CSS no padrão `'--nome-da-variavel': valor`.
3. **Checagem de Compilação TypeScript e Linters**:
   ```bash
   npm run type-check
   npm run lint
   ```
   *Critério*: Código de saída 0 sem warnings ou erros.
4. **Validação de Testes Unitários de Dropdowns e Overlays**:
   ```bash
   npx vitest run tests/components/MaxInputSelect.test.ts
   npx vitest run tests/components/MaxTagSelect.test.ts
   npx vitest run tests/components/MaxInputAutoComplete.test.ts
   ```
   *Critério*: Todos os testes de abertura, fechamento e seleção de opções continuam passando sem regressão.
5. **Suíte Completa do Projeto**:
   ```bash
   npm run test
   ```
   *Critério*: 100% de aprovação nos 176 arquivos de teste.

---

## 6. Mitigação de Riscos de Regressão

| Risco Potencial | Probabilidade | Severidade | Estratégia de Mitigação |
|---|:---:|:---:|---|
| Deslocamento visual de dropdowns em telas com scroll ou dentro de modais com scroll interno | Média | Alta | `MaxBaseOverlay` já utiliza listener de scroll com `useCapture = true` (`window.addEventListener('scroll', ..., true)`), capturando a rolagem de qualquer elemento ancestral e reposicionando com `requestAnimationFrame`. |
| Conflito de `z-index` quando múltiplos selects ou modais estão abertos simultaneamente | Baixa | Média | `MaxBaseOverlay` utiliza gerador sequencial reativo de `z-index` incremental (`nextZIndex`), garantindo que o overlay mais recente sempre fique sobreposto ao anterior. |
| Quebra de acessibilidade no fechamento com tecla ESC | Baixa | Alta | `MaxBaseOverlay` possui suporte nativo a `closeOnEscape = true` com captura no documento e emissão correta de `update:visible`. |
| Largura de dropdown menor que o input | Baixa | Média | O parâmetro `matchTargetWidth: true` garante que o painel receba explicitamente a largura em pixels do elemento-gatilho via `minWidth: ${t.width}px`. |
