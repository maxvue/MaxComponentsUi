# Resíduos Sistêmicos de Classes Legadas do PrimeVue (`.p-*`) em Componentes e no Wrapper Universal `InputBase`

## Severidade: Crítica

## Componentes Impactados
- `src/components/InputBase.vue` (43 ocorrências de seletores `:deep(.p-*)`)
- `src/components/MaxButton.vue` (24 seletores de variantes baseados em `.p-button-*`)
- `src/components/MaxTagSelect.vue` (25 seletores e classes `.p-select-*`)
- `src/components/MaxInputSelect.vue` (20 seletores e classes `.p-select-*`)
- `src/components/MaxTopToolbar.vue` (12 seletores `.p-menubar-*`)
- `src/components/MaxInputAutoComplete.vue` (6 seletores `.p-autocomplete-*`)
- `src/components/MaxInputAutoCompleteApi.vue` (7 seletores `.p-autocomplete-*`)
- `src/components/MaxInputFileUpload.vue` (4 classes e seletores `.p-fileupload-*`, `.p-button`)
- `src/components/MaxInputFileUploadButton.vue` (6 classes e seletores `.p-fileupload-*`)
- `src/components/MaxTable.vue` (6 seletores `:deep(.p-datatable-*)`)
- `src/components/MaxInputIconPicker.vue` (4 seletores `.p-drawer-*`)
- `src/components/MaxLikeButton.vue` (4 seletores `.p-button-*`)
- `src/components/MaxTopToolbarSubmenu.vue` (4 seletores `.p-menubar-*`)
- `src/components/MaxInputPhone.vue` (2 seletores `:deep(.p-inputtext)`, `:deep(.p-inputicon)`)
- `src/components/MaxUserSection.vue` (2 seletores `:deep(.p-avatar)`)

---

## Sintoma Observado vs Causa Raiz Profunda

### Sintoma Observado
Apesar de a documentação e os registros de migração (`status-primevue.migration.yaml` e `GEMINI.md`) declararem que 100% dos componentes foram migrados e que o projeto possui independência total do PrimeVue, uma auditoria no código revela mais de **160 ocorrências de classes e seletores com o prefixo `.p-*`** espalhados por 15 componentes centrais da biblioteca.
No template de componentes como `MaxInputFileUpload.vue`, botões e containers ainda são renderizados com `class="p-button"` e `class="p-fileupload"`. No componente `InputBase.vue` — a espinha dorsal de formulários da biblioteca —, existem mais de 40 regras SCSS utilizando `:deep(.p-select)`, `:deep(.p-inputtext)`, `:deep(.p-inputnumber)` e `:deep(.p-floatlabel)` para estilizar o conteúdo inserido em seus slots.

### Causa Raiz Profunda
A migração do PrimeVue foi tratada na "Fase 1" estritamente como a remoção física dos `import ... from 'primevue/...'` no TypeScript/JavaScript. No entanto, o refactoring visual e estrutural do DOM e do CSS foi postergado ou omitido:
1. **Acoplamento Inverso no `InputBase`**: Originalmente, o `InputBase` foi desenhado como uma casca sobreposta aos componentes do PrimeVue, estilizando seus nós internos via pseudo-classe `:deep(.p-*)`. Ao reescrever os componentes de input como componentes nativos independentes, os desenvolvedores optaram pelo caminho de menor esforço: mantiveram as mesmas classes `.p-inputtext`, `.p-select`, `.p-floatlabel` em seus templates nativos para que o `InputBase` continuasse conseguindo estilizá-los.
2. **Dependência Oculta de Nomenclatura Externa**: O Design System adotou a taxonomia proprietária do PrimeVue como se fosse seu padrão semântico, violando o princípio de isolamento e marcação semântica própria estipulado em `GEMINI.md` ("Todo componente deve possuir marcação HTML semântica própria e estilização isolada").
3. **Fragilidade Arquitetural**: Se qualquer componente filho for refatorado para utilizar classes BEM semânticas próprias (ex.: `.max-input-text`, `.max-select`), ele imediatamente perde toda a estilização, alinhamento, altura e padding gerenciados pelo `InputBase`.

---

## Evidência Técnica

### 1. `src/components/InputBase.vue`
Seletores `:deep()` acoplados às classes proprietárias do PrimeVue:
```scss
// Linhas 297-298
:deep(.p-select),
:deep(.p-select-label) {
    border-radius: unset;
    border: none;
}

// Linhas 371-373
:deep(.p-inputtext) {
    border-radius: unset;
    border: none;
}

// Linhas 581-585
:deep(.p-select),
:deep(.p-select-label),
:deep(.p-inputtext),
:deep(.p-inputnumber),
.input-slot-div {
    width: 100% !important;
}

// Linhas 660-664
:deep(.p-select-label),
:deep(.p-inputtext),
:deep(.p-inputnumber),
:deep(.p-component),
.input-slot-div {
    cursor: not-allowed !important;
}

// Linhas 784-786
:deep(.p-floatlabel .p-select-label),
:deep(.p-inputtext) {
    padding-bottom: 0 !important;
}
```

### 2. `src/components/MaxInputFileUpload.vue`
Uso explícito de classes `.p-*` diretamente nas tags do template e no SCSS:
```html
<!-- Linhas 15-21 -->
<div class="p-fileupload" :disabled="attrs.disabled ?? false">
    <button
        type="button"
        class="p-button p-fileupload-choose"
        :disabled="attrs.disabled ?? false"
        :aria-label="uploading ? 'Carregando arquivos' : 'Escolher arquivos para envio'"
        @click.stop="triggerChoose"
    >
```
E na estilização SCSS:
```scss
// Linhas 373-386
.p-fileupload {
    height: 30px;
    border-radius: calc(1rem - 5px);
    overflow: hidden;
    display: grid;
    grid-template-columns: auto 1fr auto;
    width: 100%;
    align-items: center;

    .p-button {
        cursor: pointer;
        display: grid;
        place-items: center;
        height: 30px;
```

### 3. `src/components/MaxButton.vue`
Variantes de botão declaradas diretamente sobre seletores legados `.p-button-*`:
```scss
// Linhas 152-195
&.p-button-secondary {
    background: var(--max-button-secondary-border-color, #f1f5f9);
    border-color: var(--max-button-secondary-border-color, #f1f5f9);
    color: var(--background-775);
}
&.p-button-success {
    background: var(--max-button-success-border-color, #22c55e);
    border-color: var(--max-button-success-border-color, #22c55e);
    color: #ffffff;
}
&.p-button-danger {
    background: var(--max-button-danger-border-color, #ef4444);
    border-color: var(--max-button-danger-border-color, #ef4444);
    color: #ffffff;
}
```

---

## Impacto na Consistência Visual do Design System

1. **Falsa Independência e Risco de Regressão**: A biblioteca continua dependendo mental e estruturalmente da taxonomia de um framework descontinuado. Novos componentes construídos por desenvolvedores sem o histórico do PrimeVue não seguirão o padrão `.p-*`, gerando quebra silenciosa de layout quando envelopados por `InputBase`.
2. **Impossibilidade de Conclusão da Fase 2**: O "sweep de nomenclatura" da Fase 2 fica travado enquanto o CSS do `InputBase` mantiver acoplamento rígido com nós internos de seletores `.p-*`.
3. **Sobrescrita Indesejada e Conflito de Especificidade**: O uso excessivo de `:deep(.p-*)` no `InputBase` com `!important` anula qualquer customização legítima que componentes de formulário precisem aplicar em seus próprios elementos de entrada.
