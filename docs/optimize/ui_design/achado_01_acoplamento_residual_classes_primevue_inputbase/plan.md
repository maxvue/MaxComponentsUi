# Plano de Implementação: Eliminação Sistemática do Acoplamento Residual de Classes PrimeVue (`.p-*`) e Transição para Taxonomia Semântica Própria

## 1. Objetivo da Refatoração

Erradicar completamente todas as **248 ocorrências de classes, seletores CSS e classes em templates com o prefixo `.p-*`** remanescentes em 17 componentes centrais e no wrapper universal `InputBase.vue`.

A refatoração tem como metas estruturais:
1. **Desacoplamento do Wrapper Universal `InputBase.vue`**: Eliminar mais de 40 regras `:deep(.p-select)`, `:deep(.p-inputtext)`, `:deep(.p-inputnumber)`, `:deep(.p-floatlabel)` e `:deep(.p-component)`, padronizando a estilização de nós internos exclusivamente através dos seletores semânticos do Design System (`:deep(.max-input-native)`, `:deep(.max-select)`, `:deep(.max-select-label)`, `:deep(.max-float-label)`) e tags HTML nativas (`:deep(input)`, `:deep(textarea)`, `:deep(label)`).
2. **Purificação de Componentes de Entrada e Seleção**: Remover classes `.p-select*` e `.p-autocomplete*` em templates e blocos SCSS de `MaxInputSelect.vue`, `MaxTagSelect.vue`, `MaxInputAutoComplete.vue` e `MaxInputAutoCompleteApi.vue`, consolidando o padrão BEM semântico próprio (`.max-select-*`, `.max-autocomplete-*`).
3. **Erradicação de Classes Dinâmicas Legadas em Botões**: Eliminar a geração em tempo de execução de classes proprietárias do PrimeVue (`p-button-${severity}`, `p-button-${variant}`, `p-button-sm`, `p-button-lg`, `[data-p~='...']`) em `MaxButton.vue` e `MaxLikeButton.vue`, mantendo unicamente `.max-button-*`.
4. **Substituição de Anatomia Legada em Uploads, Menus e Tabelas**: Substituir a taxonomia `.p-fileupload-*`, `.p-menubar-*` e `.p-datatable-*` em `MaxInputFileUpload.vue`, `MaxInputFileUploadButton.vue`, `MaxTopToolbar.vue`, `MaxTopToolbarSubmenu.vue` e `MaxTable.vue` por marcação semântica própria do Max Design System.
5. **Conformidade com a Diretriz Canônica**: Atender 100% à regra expressa em `GEMINI.md`: *"A biblioteca é 100% autônoma e independente do PrimeVue: Nenhum componente do design system deve importar ou referenciar pacotes do ecossistema PrimeVue... A estilização não deve fazer uso de classes utilitárias ou internas do PrimeVue (ex.: .p-inputtext, .p-select, .p-floatlabel). Todo componente deve possuir marcação HTML semântica própria e estilização isolada."*

---

## 2. Arquivos Afetados

| Caminho Relativo | Caminho Absoluto | Ocorrências `.p-*` |
|---|---|:---:|
| `src/components/InputBase.vue` | `/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/InputBase.vue` | 43 |
| `src/components/MaxInputSelect.vue` | `/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputSelect.vue` | 37 |
| `src/components/MaxTagSelect.vue` | `/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxTagSelect.vue` | 37 |
| `src/components/MaxButton.vue` | `/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxButton.vue` | 24 |
| `src/components/MaxTable.vue` | `/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxTable.vue` | 23 |
| `src/components/MaxTopToolbar.vue` | `/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxTopToolbar.vue` | 16 |
| `src/components/MaxInputAutoCompleteApi.vue` | `/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputAutoCompleteApi.vue` | 14 |
| `src/components/MaxInputAutoComplete.vue` | `/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputAutoComplete.vue` | 13 |
| `src/components/MaxInputIconPicker.vue` | `/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputIconPicker.vue` | 11 |
| `src/components/MaxInputFileUpload.vue` | `/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputFileUpload.vue` | 8 |
| `src/components/MaxTopToolbarSubmenu.vue` | `/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxTopToolbarSubmenu.vue` | 8 |
| `src/components/MaxInputFileUploadButton.vue` | `/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputFileUploadButton.vue` | 6 |
| `src/components/MaxLikeButton.vue` | `/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxLikeButton.vue` | 4 |
| `src/components/MaxInputPhone.vue` | `/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputPhone.vue` | 2 |
| `src/components/MaxUserSection.vue` | `/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxUserSection.vue` | 2 |
| `src/components/MaxAiIcon.vue` | `/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxAiIcon.vue` | 2 |
| `src/components/MaxChips.vue` | `/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxChips.vue` | 1 |
| `tests/components/MaxButton.test.ts` | `/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/tests/components/MaxButton.test.ts` | (asserções) |

---

## 3. Passo a Passo Detalhado da Implementação

### Fase 1: Purificação do Wrapper Universal `InputBase.vue`

`InputBase.vue` é o componente mais crítico do Design System por envelopar praticamente todos os campos de formulário. A limpeza de seus seletores `:deep()` deve garantir 100% de paridade visual para inputs nativos e componentes derivados:

1. **Seletores de Reset e Alinhamento Base (Linhas 291-309)**:
   - **Antes**:
     ```scss
     :deep(input),
     :deep(textarea),
     :deep(label),
     :deep(.max-input-native),
     :deep(.max-select),
     :deep(.max-select-label),
     :deep(.p-select),
     :deep(.p-select-label) {
     ```
   - **Depois**:
     ```scss
     :deep(input),
     :deep(textarea),
     :deep(label),
     :deep(.max-input-native),
     :deep(.max-select),
     :deep(.max-select-label) {
     ```
2. **Seletores de Largura e Dimensionamento do Slot (Linhas 581-585)**:
   - **Antes**:
     ```scss
     :deep(.p-select),
     :deep(.p-select-label),
     :deep(.p-inputtext),
     :deep(.p-inputnumber),
     .input-slot-div {
         width: 100% !important;
     }
     ```
   - **Depois**:
     ```scss
     :deep(.max-select),
     :deep(.max-select-label),
     :deep(.max-input-native),
     :deep(.max-input-number),
     :deep(input),
     :deep(textarea),
     .input-slot-div {
         width: 100% !important;
     }
     ```
3. **Seletores de Estado Desabilitado (Linhas 660-664)**:
   - **Antes**:
     ```scss
     :deep(.p-select-label),
     :deep(.p-inputtext),
     :deep(.p-inputnumber),
     :deep(.p-component),
     .input-slot-div {
         cursor: not-allowed !important;
     }
     ```
   - **Depois**:
     ```scss
     :deep(.max-select-label),
     :deep(.max-input-native),
     :deep(.max-input-number),
     :deep(input:disabled),
     :deep(textarea:disabled),
     :deep(.is-disabled),
     .input-slot-div {
         cursor: not-allowed !important;
     }
     ```
4. **Ajustes de FloatLabel e Padding (Linhas 710-712, 784-786, 791, 801-803)**:
   - Substituir `:deep(.p-inputtext)` por `:deep(.max-input-native), :deep(input)`.
   - Substituir `:deep(.p-datepicker)` por `:deep(.max-date-picker-input)`.
   - Substituir `:deep(.p-autocomplete)` por `:deep(.max-autocomplete)`.
   - Substituir `:deep(.p-disabled)` por `:deep(.is-disabled), :deep([disabled])`.
   - Substituir `.p-floatlabel .p-select-label` por `.is-float .max-select-label, .max-float-label .max-select-label`.

### Fase 2: Purificação de `MaxButton.vue` e `MaxLikeButton.vue`

1. **Refatoração do Objeto Reativo `buttonClasses` em `MaxButton.vue` (Linhas 77-87)**:
   - **Antes**:
     ```typescript
     const buttonClasses = computed(() => ({
         [`p-button-${props.severity}`]: Boolean(props.severity),
         [`max-button-${props.severity}`]: Boolean(props.severity),
         [`p-button-${props.variant}`]: Boolean(props.variant),
         [`max-button-${props.variant}`]: Boolean(props.variant),
         'max-button-dashed': props.dashed,
         'max-button-uppercase': props.uppercase,
         'max-button-loading': props.loading,
         'p-button-sm': props.size === 'small' || props.size === 'sm',
         'p-button-lg': props.size === 'large' || props.size === 'lg'
     }));
     ```
   - **Depois**:
     ```typescript
     const buttonClasses = computed(() => ({
         [`max-button-${props.severity}`]: Boolean(props.severity),
         [`max-button-${props.variant}`]: Boolean(props.variant),
         'max-button-dashed': props.dashed,
         'max-button-uppercase': props.uppercase,
         'max-button-loading': props.loading,
         'max-button-sm': props.size === 'small' || props.size === 'sm',
         'max-button-lg': props.size === 'large' || props.size === 'lg'
     }));
     ```
2. **Remoção de Seletores Duplicados `.p-button-*` no SCSS de `MaxButton.vue`**:
   - Remover todas as referências `&.p-button-*` (ex.: `&.p-button-secondary`, `&.p-button-success`, `&.p-button-info`, `&.p-button-warning`, `&.p-button-danger`, `&.p-button-contrast`, `&.p-button-help`).
   - Remover seletores de atributo legados do PrimeVue:
     ```scss
     // Remover:
     &[data-p~='outlined'],
     &[data-p~='text'],
     &[data-p~='link']
     ```
   - Em `MaxLikeButton.vue`, substituir as regras `&.p-button-sm` e `&.p-button-lg` por `&.max-button-sm` e `&.max-button-lg`.

### Fase 3: Purificação dos Selects (`MaxInputSelect.vue` e `MaxTagSelect.vue`)

1. **Templates de `MaxInputSelect.vue` e `MaxTagSelect.vue`**:
   - No trigger do select:
     - Remover: `class="max-select p-select"` e `:class="{ 'p-disabled': props.disabled, 'p-focus': isOpen }"`.
     - Manter: `class="max-select"` e `:class="{ 'is-disabled': props.disabled, 'is-focused': isOpen }"`.
   - No rótulo:
     - Substituir `class="max-select-label p-select-label"` por `class="max-select-label"`.
   - No botão de limpar seleção:
     - Substituir `class="max-select-clear-btn p-select-clear-btn"` por `class="max-select-clear-btn"`.
   - No chevron dropdown:
     - Substituir `class="max-select-dropdown p-select-dropdown"` por `class="max-select-dropdown"`.
   - No painel flutuante (overlay) e filhos:
     - Substituir `p-select-overlay` por `max-select-overlay`.
     - Substituir `p-select-header` por `max-select-header`.
     - Substituir `p-select-filter-container` por `max-select-filter-container`.
     - Substituir `p-select-filter` por `max-select-filter`.
     - Substituir `p-select-list-container` por `max-select-list-container`.
     - Substituir `p-select-empty-message` por `max-select-empty-message`.
     - Substituir `p-select-option-group` por `max-select-option-group`.
     - Substituir `p-select-option` por `max-select-option`.
     - Substituir `:class="{ 'p-select-option-highlighted': ..., 'p-select-option-selected': ... }"` por `:class="{ 'is-highlighted': ..., 'is-selected': ... }"`.
2. **Estilização SCSS**:
   - Limpar todos os seletores `.p-select*` mantendo a hierarquia semântica aninhada sob `.max-select` e `.max-select-overlay`.

### Fase 4: Purificação de Autocompletes (`MaxInputAutoComplete.vue` e `MaxInputAutoCompleteApi.vue`)

1. **Templates**:
   - Substituir `p-autocomplete` por `max-autocomplete`.
   - Substituir `p-inputtext p-autocomplete-input` por `max-input-native max-autocomplete-input`.
   - Substituir `p-autocomplete-overlay` por `max-autocomplete-overlay`.
   - Substituir `p-autocomplete-list-container` por `max-autocomplete-list-container`.
   - Substituir `p-autocomplete-list` por `max-autocomplete-list`.
   - Substituir `p-autocomplete-item` por `max-autocomplete-item`.
   - Substituir `p-autocomplete-item-active` por `is-active`.
2. **Estilização SCSS**:
   - Atualizar a árvore aninhada eliminando `:deep(.p-autocomplete)`, `.p-autocomplete-input`, etc.

### Fase 5: Purificação de Uploads e Toolbar

1. **`MaxInputFileUpload.vue` e `MaxInputFileUploadButton.vue`**:
   - No template de `MaxInputFileUpload.vue`:
     - Trocar `class="p-fileupload"` por `class="max-file-upload"`.
     - Trocar `class="p-button p-fileupload-choose"` por `class="max-file-upload-button max-file-upload-choose"`.
     - Trocar `class="p-button"` por `class="max-file-upload-button"`.
   - No SCSS de ambos os arquivos: migrar `.p-fileupload*` e `.p-button` para as classes BEM correspondentes.
2. **`MaxTopToolbar.vue` e `MaxTopToolbarSubmenu.vue`**:
   - Trocar `p-menubar-root-list` por `max-toolbar-root-list`.
   - Trocar `p-menubar-item` por `max-toolbar-item`.
   - Trocar `p-menubar-item-content` por `max-toolbar-item-content`.
   - Trocar `p-menubar-submenu-root` por `max-toolbar-submenu-root`.
   - Trocar `p-menubar-submenu` por `max-toolbar-submenu`.
   - No SCSS: atualizar os seletores mantendo exatamente as mesmas propriedades CSS de padding, cores e animações de submenu.

### Fase 6: Purificação dos Demais Componentes

1. **`MaxTable.vue`**:
   - No bloco `<style lang="scss" scoped>`, substituir os seletores `:deep(.p-datatable)`, `.p-datatable-table-container`, `.p-datatable-column-header-content`, `.p-datatable-column-title`, `&.p-row-even` e `&.p-row-odd` por suas contrapartes nativas (`.max-table-container`, `.max-table-header-content`, `&.is-even`, `&.is-odd`).
2. **`MaxInputIconPicker.vue`**:
   - Substituir seletores residuais de drawer PrimeVue (`.p-drawer-header`, `.p-drawer-title`, etc.) pelas classes canônicas de `MaxDrawer` (`.max-drawer-header`, `.max-drawer-title`).
3. **`MaxUserSection.vue`**:
   - Trocar `:deep(.p-avatar)` por `:deep(.max-user-avatar)`.
4. **`MaxInputPhone.vue`**:
   - Trocar `:deep(.p-inputtext)` por `:deep(.max-input-native)`.
5. **`MaxAiIcon.vue` e `MaxChips.vue`**:
   - Eliminar quaisquer menções residuais a classes `.p-*`.

---

## 4. Regras de Estilo do GEMINI.md a Cumprir

- **Zero Dependências PrimeVue**: Nenhum arquivo ou componente deve possuir seletores iniciados com `.p-` ou atributos `data-p`.
- **Proibição de Classes Utilitárias no Template**: Toda a substituição é estritamente semântica (BEM) e estruturada dentro da árvore DOM.
- **Aninhamento Obrigatório no `<style lang="scss" scoped>`**: As regras SCSS devem espelhar a hierarquia do template sem seletores globais desnecessários.
- **Ordem dos Blocos SFC**: Preservar 1º `<template>`, 2º `<script setup lang="ts">`, 3º `<style lang="scss" scoped>`.

---

## 5. Critérios de Aceite e Verificação Técnica

1. **Varredura de Resíduos (Zero Tolerância)**:
   ```bash
   rg -c '\.p-[a-z]|class="[^"]*\bp-[a-z]' src/components
   ```
   *Critério*: Deve retornar **0 ocorrências** em todos os arquivos dentro de `src/components/`.
2. **Verificação de Tipagem TypeScript**:
   ```bash
   npm run type-check
   ```
   *Critério*: Conclusão com código de saída 0 e sem erros do `vue-tsc`.
3. **Linters de Código e Estilo**:
   ```bash
   npm run lint
   ```
   *Critério*: Nenhuma violação no ESLint ou Stylelint.
4. **Bateria Completa de Testes Unitários**:
   ```bash
   npm run test
   ```
   *Critério*: 100% de sucesso nos 176 arquivos de teste e mais de 2.480 testes. Atualizar testes unitários em `tests/components/` que eventualmente testem a presença literal de classes legadas como `.p-button`.

---

## 6. Mitigação de Riscos de Regressão

| Risco Potencial | Probabilidade | Severidade | Estratégia de Mitigação |
|---|:---:|:---:|---|
| Desalinhamento ou perda de altura em inputs envelopados por `InputBase` | Média | Alta | Garantir que o seletor unificado `:deep(.max-input-native), :deep(input)` aplique as propriedades de reset (`height: 100% !important; outline: none; border: none; width: 100%`) com a mesma especificidade anterior. |
| Quebra de testes que assertam classes `.p-button` no DOM | Alta | Média | Inspecionar a suíte `tests/components/MaxButton.test.ts` e atualizar assertivas para verificar a presença de `.max-button-${severity}` e `.max-button-${variant}`. |
| Quebra de estilização em `MaxTopToolbar` com submenus aninhados | Média | Alta | Executar validação visual no `dev:playground` navegando por submenus em múltiplos níveis para verificar posicionamento e hover states. |
| Perda de padding em `MaxSelect` ou `MaxTagSelect` | Baixa | Média | Assegurar que `.max-select-label` mantenha os mesmos paddings e alturas de linha do padrão do Design System (altura padrão de inputs: 36px). |
