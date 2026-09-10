# Plano de Implementação: Resíduos de Classes e Seletores do PrimeVue

## 1. Diagnóstico e Objetivo

A auditoria de UI & Design comprovou a permanência de 174 seletores residuais `.p-*` no SCSS e 76 classes do ecossistema PrimeVue fossilizadas diretamente nos templates de 18 componentes, violando a diretriz de Independência Total de Bibliotecas Externas (Seção 4 do `GEMINI.md`):
1. **Acoplamento Estrutural em [`InputBase.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/InputBase.vue):**
   O wrapper central aplica estilização aos filhos através de 41 seletores `:deep(.p-inputtext)`, `:deep(.p-select)`, `:deep(.p-select-label)`, `:deep(.p-inputnumber)`, `:deep(.p-datepicker)`, `:deep(.p-autocomplete)`, `:deep(.p-floatlabel)` e `:deep(.p-disabled)`.
2. **Injeção Artificial de Classes PrimeVue em Componentes Nativos:**
   Como consequência direta do design de [`InputBase.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/InputBase.vue), múltiplos componentes filhos inserem classes fantasmas em seus nós nativos `<input>` — como `class="p-inputtext p-component"` em [`MaxInputText.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputText.vue#L12), [`MaxInputCep.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputCep.vue#L3), [`MaxInputCpfCnpj.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputCpfCnpj.vue#L5), [`MaxInputNumber.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputNumber.vue#L7) e [`MaxChips.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxChips.vue#L10) — unicamente para herdarem a estilização do wrapper.
3. **Mimetização de Estruturas DOM do PrimeVue:**
   Componentes como [`MaxInputSelect.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputSelect.vue#L9-L85), [`MaxTagSelect.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxTagSelect.vue#L9-L80), [`MaxTable.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxTable.vue#L3-L17), [`MaxTopToolbar.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxTopToolbar.vue#L4-L13) e [`MaxUserAvatar.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxUserAvatar.vue#L2) recriaram classes internas do PrimeVue (`.p-select`, `.p-select-overlay`, `.p-datatable`, `.p-menubar-*`, `.p-avatar`) em vez de adotarem o padrão semântico `.max-*` do Design System.
4. **Código Morto Herdado:**
   [`MaxInputSearch.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputSearch.vue#L53-L64) mantém seletores `:deep(.p-autocomplete-*)` para elementos que sequer existem no seu template.

**Objetivo:** Substituir todas as classes `.p-*` dos templates por classes semânticas canônicas `.max-*`, refatorar [`InputBase.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/InputBase.vue) para suportar seletores semânticos e elementos HTML nativos (`input`, `textarea`, `.max-input-native`, `.max-select`), e remover código SCSS morto.

---

## 2. Arquivos a Modificar (com links absolutos)

### Wrapper Central e Seletores Base
- [`src/components/InputBase.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/InputBase.vue#L265-L710) — Atualizar os seletores `:deep()` para priorizar `.max-input-native`, `.max-select` e tags nativas.

### Componentes de Entrada de Texto (Remover `p-inputtext p-component`)
- [`src/components/MaxInputText.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputText.vue#L11-L20)
- [`src/components/MaxInputCep.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputCep.vue#L3-L7)
- [`src/components/MaxInputCpfCnpj.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputCpfCnpj.vue#L3-L12)
- [`src/components/MaxInputCoordinateDecimalLat.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputCoordinateDecimalLat.vue#L3-L8)
- [`src/components/MaxInputCoordinateDecimalLng.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputCoordinateDecimalLng.vue#L3-L8)
- [`src/components/MaxInputPhoneMail.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputPhoneMail.vue#L3-L8)
- [`src/components/MaxChips.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxChips.vue#L9-L15)
- [`src/components/MaxInputNumber.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputNumber.vue#L5-L10)
- [`src/components/MaxInputDatePicker.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputDatePicker.vue#L12-L35)
- [`src/components/MaxInputSearch.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputSearch.vue#L3-L65)

### Componentes de Seleção, Apresentação e Listagem
- [`src/components/MaxInputSelect.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputSelect.vue#L9-L85)
- [`src/components/MaxTagSelect.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxTagSelect.vue#L9-L80)
- [`src/components/MaxUserAvatar.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxUserAvatar.vue#L1-L10)
- [`src/components/MaxButton.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxButton.vue#L145-L216)

---

## 3. Especificação Técnica Cirúrgica

### A. Tabela Canônica de Migração de Nomenclatura

| Classe Legada PrimeVue | Nova Classe Canônica Max | Finalidade Semântica |
| :--- | :--- | :--- |
| `.p-inputtext` / `.p-component` | `.max-input-native` | Elemento nativo `<input>` ou wrapper de input |
| `.p-select` | `.max-select` | Caixa do seletor dropdown |
| `.p-select-label` | `.max-select-label` | Rótulo do valor selecionado |
| `.p-select-dropdown` | `.max-select-dropdown` | Gatilho/ícone do dropdown |
| `.p-select-overlay` | `.max-select-overlay` | Painel flutuante de opções |
| `.p-select-list-container` | `.max-select-list-container` | Container rolável da lista |
| `.p-select-option` | `.max-select-option` | Item de opção |
| `.p-disabled` | `.is-disabled` | Estado desabilitado semântico |
| `.p-focus` | `.is-focused` | Estado com foco |
| `.p-avatar` / `.p-avatar-circle` | `.max-user-avatar` / `.is-circle` | Avatar circular |

### B. Refatoração em [`InputBase.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/InputBase.vue)

Atualizar os seletores `:deep()` no SCSS para aceitar a nova classe `.max-input-native` e nós nativos, mantendo retrocompatibilidade transitória:

```scss
// Em src/components/InputBase.vue:
// Linhas 268-275:
:deep(input),
:deep(textarea),
:deep(label),
:deep(.max-input-native),
:deep(.max-select),
:deep(.max-select-label),
:deep(.p-select),
:deep(.p-select-label) {
    font-family: inherit;
    letter-spacing: inherit;
}

// Linhas 490-505 (estilização central dos campos de formulário):
:deep(.max-select),
:deep(.max-select-label),
:deep(.max-input-native),
:deep(input),
:deep(textarea),
:deep(.p-select),
:deep(.p-select-label),
:deep(.p-inputtext),
:deep(.p-inputnumber) {
    height: 100% !important;
    border: none !important;
    outline: none !important;
    background-color: transparent !important;
    box-shadow: none !important;
    color: var(--background-800);
}

// Linhas 570-580:
:deep(.max-input-native),
:deep(input),
:deep(.p-select-label),
:deep(.p-inputtext),
:deep(.p-inputnumber),
:deep(.p-component) {
    font-size: 1rem;
    font-weight: 400;
}

// Linhas 630-636:
:deep(.max-input-native),
:deep(input),
:deep(.p-inputtext),
:deep(.p-datepicker),
:deep(.p-autocomplete) {
    width: 100% !important;
}

// Desabilitados:
:deep(.is-disabled),
:deep(.p-disabled),
:deep(input:disabled) {
    opacity: 0.6 !important;
    cursor: not-allowed !important;
}
```

### C. Refatoração nos Templates dos Componentes Filhos

#### 1. [`MaxInputText.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputText.vue#L11-L20)
```html
<!-- Antes: class="p-inputtext p-component" -->
<input
    class="max-input-native"
    :type="props.type"
    :placeholder="props.placeholder"
    :disabled="props.disabled"
    :spellcheck="resolvedSpellcheck"
    :value="temp_value"
    @input="temp_value = ($event.target as HTMLInputElement).value"
    @blur="isDone = testIsDone()"
/>
```

#### 2. [`MaxInputCep.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputCep.vue#L3-L6)
```html
<!-- Antes: class="p-inputtext p-component" -->
<input 
    type="text" 
    class="max-input-native" 
    v-model="temp_value" 
    v-maska="'#####-###'" 
    :disabled="props.disabled" 
    @blur="onBlur" 
/>
```

#### 3. [`MaxInputCpfCnpj.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputCpfCnpj.vue#L3-L12)
```html
<!-- Antes: class="p-inputtext p-component" -->
<input
    type="text"
    class="max-input-native max-cpf-cnpj-input"
    :value="masked_value"
    v-maska="maskValue"
    :disabled="props.disabled"
    @input="onUserInput"
/>
```

#### 4. [`MaxInputCoordinateDecimalLat.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputCoordinateDecimalLat.vue#L5) e [`MaxInputCoordinateDecimalLng.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputCoordinateDecimalLng.vue#L5)
```html
<!-- Antes: class="p-inputtext p-component" -->
<input type="text" class="max-input-native" :disabled="props.disabled" ... />
```

#### 5. [`MaxInputPhoneMail.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputPhoneMail.vue#L5)
```html
<!-- Antes: class="p-inputtext p-component" -->
<input class="max-input-native" ... />
```

#### 6. [`MaxChips.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxChips.vue#L10)
```html
<!-- Antes: class="max-chips-container p-inputtext p-component" -->
<div class="max-chips-container max-input-native" ...>
```

#### 7. [`MaxInputNumber.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputNumber.vue#L7)
```html
<!-- Antes: class="max-inputnumber p-inputtext p-component" -->
<input class="max-input-native max-inputnumber-field" ... />
```

#### 8. [`MaxInputSearch.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputSearch.vue)
- No template:
  ```html
  <InputBase class="max-input-search input-search-main-div" :iconRight="isLoading === true ? 'line-md:loading-twotone-loop' : 'material-symbols:search-rounded'">
      <input type="text" class="max-input-native" v-bind="attrs" :value="temp_value" @input="onInput" />
  </InputBase>
  ```
- No SCSS: remover completamente os blocos residuais `:deep(.p-autocomplete-*)` e classes mortas `.tst1`, `.tst2`.

#### 9. [`MaxUserAvatar.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxUserAvatar.vue#L1-L10)
```html
<!-- Antes: class="p-avatar p-component p-avatar-circle max-user-avatar" -->
<div 
    class="max-user-avatar is-circle" 
    :class="{ removable: props.removable }"
    ...
>
```

---

## 4. Garantia de Retrocompatibilidade

1. **Camada de Compatibilidade Transitória em [`InputBase.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/InputBase.vue):**
   Os seletores SCSS de `InputBase.vue` mantêm `.p-inputtext`, `.p-select` e `.p-component` como seletores adicionais encadeados por vírgula (`:deep(.max-input-native), :deep(input), :deep(.p-inputtext)`). Caso uma aplicação host ou componente customizado de terceiros ainda injete `.p-inputtext`, ele continuará sendo perfeitamente estilizado.
2. **Contratos e Props Intactos:**
   Nenhuma prop, emit ou v-model foi modificado em nenhum dos 18 componentes. A alteração afeta estritamente as classes CSS dos elementos internos, preservando 100% da API pública.

---

## 5. Critérios de Aceitação e Comandos de Validação

### Critérios de Aceitação

1. **Zero Ocorrências de `class="p-inputtext"`:** Nenhum componente interno deve declarar `p-inputtext` ou `p-component` em seu template Vue.
2. **Funcionamento Idêntico dos Formulários:** Todos os inputs envolvidos (`MaxInputText`, `MaxInputCep`, `MaxInputCpfCnpj`, etc.) continuam funcionando com preenchimento, validação visual (`done`, `error`, `caution`), placeholders e máscaras.
3. **Eliminação do Código Morto:** O arquivo `MaxInputSearch.vue` não possui referências a `.p-autocomplete`.
4. **Passagem sem Erros em Type-check e Testes:** A suíte de testes existente deve passar com 100% de sucesso.

### Comandos de Validação

```bash
# 1. Verificação de Tipos TypeScript
npm run type-check

# 2. Execução da Suíte de Testes de Inputs e Seleção
npx vitest run tests/components/MaxInputText.test.ts tests/components/MaxInputCep.test.ts tests/components/MaxInputCpfCnpj.test.ts tests/components/MaxInputSearch.test.ts tests/components/MaxUserAvatar.test.ts

# 3. Auditoria de Classes Proibidas no Template
# Deve retornar ZERO matches em src/components/:
git grep -n 'class=".*p-inputtext' src/components/
git grep -n 'class=".*p-component' src/components/

# 4. Linting
npm run lint
```
