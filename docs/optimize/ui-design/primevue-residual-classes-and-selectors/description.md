# Achado de UI & Design: Resíduos de Classes e Seletores do PrimeVue

## 1. Identificação e Sumário Executivo

- **Identificador:** `primevue-residual-classes-and-selectors`
- **Categoria:** Independência Total de Bibliotecas Externas (GEMINI.md — Seção 4)
- **Severidade:** Alta (Violação Arquitetural e Acoplamento Legado)
- **Impacto:** 18 arquivos de componentes afetados, 174 seletores SCSS residuais (`.p-*`) e 76 classes PrimeVue embutidas diretamente nos templates Vue.
- **Componente Central Crítico:** [`src/components/InputBase.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/InputBase.vue) (41 ocorrências de seletores `:deep(.p-*)`).

---

## 2. Descrição e Contexto do Problema

A diretriz canônica em `GEMINI.md` estipula com clareza absoluta:
> **Independência Total do PrimeVue (Zero Dependências Externas)**
> A biblioteca é 100% autônoma e independente do PrimeVue:
> - Nenhum componente do design system deve importar ou referenciar pacotes do ecossistema PrimeVue (`primevue/*`, `@primevue/*`, `@primeuix/*`).
> - A estilização não deve fazer uso de classes utilitárias ou internas do PrimeVue (ex.: `.p-inputtext`, `.p-select`, `.p-floatlabel`).
> - Todo componente deve possuir marcação HTML semântica própria e estilização isolada.
> - Quaisquer imports residuais do PrimeVue encontrados no projeto devem ser tratados como inconformidade técnica e eliminados.

A auditoria revelou que, embora as importações de pacotes do PrimeVue tenham sido removidas, **o sistema de classes internas do PrimeVue permaneceu fossilizado em grande escala**:
1. O wrapper central [`InputBase.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/InputBase.vue) continua aplicando estilização em nós filhos através de seletores `:deep(.p-inputtext)`, `:deep(.p-select)`, `:deep(.p-select-label)`, `:deep(.p-inputnumber)`, `:deep(.p-datepicker)`, `:deep(.p-autocomplete)`, `:deep(.p-floatlabel)`, `:deep(.p-disabled)`, entre outros.
2. Como consequência desse acoplamento em [`InputBase.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/InputBase.vue), múltiplos componentes de entrada adicionam artificialmente `class="p-inputtext p-component"` aos seus elementos nativos `<input>` apenas para "herdar" os estilos do wrapper.
3. Componentes complexos como [`MaxInputSelect.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputSelect.vue), [`MaxTagSelect.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxTagSelect.vue), [`MaxInputAutoComplete.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputAutoComplete.vue), [`MaxTable.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxTable.vue) e [`MaxTopToolbar.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxTopToolbar.vue) recriaram estruturas DOM idênticas às do PrimeVue utilizando suas classes nativas (`.p-select`, `.p-select-overlay`, `.p-autocomplete-list`, `.p-datatable`, `.p-menubar-root-list`), em vez de adotarem marcação semântica com o prefixo do design system (`.max-*`).
4. [`MaxButton.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxButton.vue) mantém dezenas de seletores SCSS de compatibilidade PrimeVue (`&.p-button-secondary`, `&.p-button-success`, `&.p-button-info`, `&.p-button-warn`, `&.p-button-danger`, `&.p-button-outlined`, `&.p-button-text`, `&.p-button-link`, etc.).

---

## 3. Evidências Comprovadas no Código

### A. Classes PrimeVue Embutidas nos Templates

- [`src/components/MaxInputText.vue:L12`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputText.vue#L12):
  ```html
  <input
      class="p-inputtext p-component"
      :type="props.type"
      ...
  />
  ```
- [`src/components/MaxInputCep.vue:L3`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputCep.vue#L3):
  ```html
  <input type="text" class="p-inputtext p-component" v-model="temp_value" ... />
  ```
- [`src/components/MaxInputCpfCnpj.vue:L5`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputCpfCnpj.vue#L5):
  ```html
  <input type="text" class="p-inputtext p-component" :value="masked_value" ... />
  ```
- [`src/components/MaxInputCoordinateDecimalLat.vue:L5`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputCoordinateDecimalLat.vue#L5) e [`src/components/MaxInputCoordinateDecimalLng.vue:L5`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputCoordinateDecimalLng.vue#L5):
  ```html
  <input type="text" class="p-inputtext p-component" ... />
  ```
- [`src/components/MaxInputPhoneMail.vue:L5`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputPhoneMail.vue#L5):
  ```html
  <input class="p-inputtext p-component" ... />
  ```
- [`src/components/MaxChips.vue:L10`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxChips.vue#L10):
  ```html
  <div class="max-chips-container p-inputtext p-component" ...>
  ```
- [`src/components/MaxInputNumber.vue:L7`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputNumber.vue#L7):
  ```html
  <input class="max-inputnumber p-inputtext p-component" ... />
  ```
- [`src/components/MaxInputDatePicker.vue:L14, L31`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputDatePicker.vue#L14):
  ```html
  <input class="p-inputtext max-datepicker-input" ... />
  <div class="p-datepicker-panel max-datepicker-panel" ...>
  ```
- [`src/components/MaxInputSelect.vue:L9, L20, L37, L46, L51, L56, L65, L82`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputSelect.vue#L9):
  ```html
  <div class="p-select" :class="{ 'p-disabled': props.disabled, 'p-focus': isOpen }">
      <div class="p-select-label">...</div>
      <div class="p-select-dropdown">...</div>
  </div>
  <div class="p-select-overlay">
      <div class="p-select-header">
          <input class="p-select-filter" ... />
      </div>
      <div class="p-select-list-container">
          <div class="p-select-option">...</div>
      </div>
  </div>
  ```
- [`src/components/MaxTagSelect.vue:L9, L20, L53, L58, L62, L71, L76, L80`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxTagSelect.vue#L9):
  Estrutura análoga com 11 classes PrimeVue diretamente no template.
- [`src/components/MaxInputAutoComplete.vue:L3, L7, L28, L33, L34, L38`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputAutoComplete.vue#L3) e [`MaxInputAutoCompleteApi.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputAutoCompleteApi.vue):
  Classes `.p-autocomplete`, `.p-autocomplete-input`, `.p-autocomplete-overlay`, `.p-autocomplete-list-container`, `.p-autocomplete-list`, `.p-autocomplete-item`.
- [`src/components/MaxTable.vue:L3, L4, L16, L17`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxTable.vue#L3):
  Classes `.p-datatable`, `.p-datatable-table-container`, `.p-column`, `.p-datatable-cell`.
- [`src/components/MaxTopToolbar.vue:L4, L8, L13`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxTopToolbar.vue#L4) e [`MaxTopToolbarSubmenu.vue:L1, L6, L12, L43`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxTopToolbarSubmenu.vue#L1):
  Classes `.p-menubar-root-list`, `.p-menubar-item`, `.p-menubar-item-content`, `.p-menubar-submenu`, `.p-menubar-submenu-nested`.
- [`src/components/MaxInputFileUpload.vue:L15, L18, L30, L40`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputFileUpload.vue#L15) e [`MaxInputFileUploadButton.vue:L45, L67, L79`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputFileUploadButton.vue#L45):
  Classes `.p-fileupload`, `.p-fileupload-choose`, `.p-fileupload-content`, `.p-fileupload-header`, `.p-fileupload-file`.
- [`src/components/MaxInputIconPicker.vue:L10, L24-L27, L32, L36`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputIconPicker.vue#L10):
  Classes `.p-drawer-bottom`, `.p-drawer-header`, `.p-drawer-title`, `.p-drawer-close-button`, `.p-drawer-content`, `.p-inputtext`.
- [`src/components/MaxUserAvatar.vue:L2`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxUserAvatar.vue#L2):
  Classes `.p-avatar`, `.p-avatar-circle`.

### B. Seletores PrimeVue no SCSS e em `InputBase.vue`

- [`src/components/InputBase.vue:L268-L283`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/InputBase.vue#L268-L283):
  ```scss
  :deep(input),
  :deep(textarea),
  :deep(label),
  :deep(.p-select),
  :deep(.p-select-label) { ... }
  ```
- [`src/components/InputBase.vue:L341, L372, L387-L396, L413-L425`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/InputBase.vue#L341):
  ```scss
  :deep(.p-select) { ... }
  :deep(.p-select-label) { ... }
  :deep(.p-inputnumber) { ... }
  ```
- [`src/components/InputBase.vue:L490-L503`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/InputBase.vue#L490-L503):
  ```scss
  :deep(.p-select),
  :deep(.p-select-label),
  :deep(.p-inputtext),
  :deep(.p-inputnumber) { ... }
  ```
- [`src/components/InputBase.vue:L571-L575, L588-L602`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/InputBase.vue#L571-L602):
  ```scss
  :deep(.p-select-label),
  :deep(.p-inputtext),
  :deep(.p-inputnumber),
  :deep(.p-component) { ... }
  ```
- [`src/components/InputBase.vue:L630-L634, L674-L683, L692-L708`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/InputBase.vue#L630-L708):
  ```scss
  :deep(.p-inputtext),
  :deep(.p-datepicker),
  :deep(.p-autocomplete) { width: 100% !important; }

  :deep(.p-inputtext) { ... }
  :deep(.p-floatlabel .p-select-label) { ... }
  :deep(.p-disabled) { ... }
  ```
- [`src/components/MaxButton.vue:L145, L152, L159, L166, L173, L187, L195, L202, L209, L216`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxButton.vue#L145):
  ```scss
  &.max-button-secondary, &.p-button-secondary { ... }
  &.max-button-success, &.p-button-success { ... }
  &.max-button-info, &.p-button-info { ... }
  &.max-button-warning, &.p-button-warning, &.p-button-warn { ... }
  &.max-button-danger, &.p-button-danger { ... }
  &.max-button-help, &.p-button-help { ... }
  &.max-button-contrast, &.p-button-contrast { ... }
  &.max-button-outlined, &.p-button-outlined { ... }
  &.max-button-text, &.p-button-text { ... }
  &.max-button-link, &.p-button-link { ... }
  ```
- [`src/components/MaxInputSearch.vue:L53, L57, L61`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputSearch.vue#L53):
  ```scss
  :deep(.p-autocomplete-option) { padding: 0 !important; }
  :deep(.p-autocomplete-list) { gap: 5px !important; }
  :deep(.p-autocomplete-overlay) { z-index: 99999 !important; }
  ```
  *(Código morto: `MaxInputSearch` sequer utiliza autocomplete no template).*

---

## 4. Impacto no Sistema e Riscos

1. **Quebra de Encapsulamento e Fragilidade:** O contrato de estilos depende de classes externas não documentadas que vazam entre componentes em vez de usar classes semânticas canônicas da própria biblioteca.
2. **Impedimento à Auditoria de Estilo:** A proliferação de classes `.p-*` impede o linter e o time de saber se um componente ainda depende de estilos legados da Aura ou se já possui estilo proprietário completo.
3. **Resistência à Evolução do Design System:** Qualquer alteração no wrapper [`InputBase.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/InputBase.vue) requer manter regras redundantes para seletores legados PrimeVue em paralelo com seletores semânticos.

---

## 5. Plano de Resolução Recomendado

1. **Definir a Nomenclatura Semântica Canônica:**
   - Substituir `class="p-inputtext p-component"` por `class="max-input-native"` ou `class="max-input-element"`.
   - Substituir `class="p-select"` e derivadas por `class="max-select"`, `class="max-select-label"`, `class="max-select-dropdown"`, `class="max-select-overlay"`, etc.
   - Substituir `class="p-autocomplete*"` por `class="max-autocomplete*"`.
   - Substituir `class="p-datatable*"` por `class="max-datatable*"`.
   - Substituir `class="p-menubar*"` por `class="max-menubar*"`.
   - Substituir `class="p-fileupload*"` por `class="max-fileupload*"`.
2. **Refatorar [`InputBase.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/InputBase.vue):**
   - Eliminar todas as 41 ocorrências de `:deep(.p-*)`.
   - Estilizar os elementos através de seletores semânticos próprios (`:deep(.max-input-native)`, `:deep(.max-select)`, etc.) ou nós HTML padronizados (`:deep(input)`, `:deep(textarea)`, `:deep(select)`).
3. **Atualizar os 18 Componentes Filhos:**
   - Remover as classes `.p-*` dos templates de todos os componentes listados.
   - Substituir seletores no SCSS de [`MaxButton.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxButton.vue), [`MaxInputSelect.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputSelect.vue), [`MaxTagSelect.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxTagSelect.vue), etc., para usar unicamente as classes `.max-*`.
4. **Remover Código Morto:**
   - Limpar regras residuais de autocomplete em [`MaxInputSearch.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputSearch.vue).
