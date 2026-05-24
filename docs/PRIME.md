# Componentes PrimeVue — Referência

Referência dos **83 componentes PrimeVue 4** re-exportados pela biblioteca `@maxvue/max-components-ui/prime`.

**Versão:** PrimeVue 4.5.5+

```typescript
import { DataTable, Column, Card, Dialog } from '@maxvue/max-components-ui/prime'
```

> **Nota:** Estes são componentes PrimeVue puros, sem customizações adicionais.
> Para componentes Max com estilo personalizado, use `@maxvue/max-components-ui`.

---

## Índice

- [Formulário](#formulário)
- [Botões](#botões)
- [Dados](#dados)
- [Painéis](#painéis)
- [Overlays](#overlays)
- [Menus](#menus)
- [Outros](#outros)

---

## Formulário

### AutoComplete

Campo de texto com sugestões de preenchimento automático. Suporta busca local e remota, seleção múltipla e agrupamento.

**Docs PrimeVue:** [primevue.org/autocomplete](https://primevue.org/autocomplete/)

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `modelValue` | `any` | `null` | Valor do campo (v-model) |
| `suggestions` | `any[]` | `null` | Lista de sugestões exibidas |
| `optionLabel` | `string \| Function` | `null` | Campo ou função para exibir o label da opção |
| `optionValue` | `string` | `null` | Campo usado como valor |
| `dropdown` | `boolean` | `false` | Exibe botão de dropdown para listar todas as opções |
| `multiple` | `boolean` | `false` | Permite seleção múltipla (chips) |
| `forceSelection` | `boolean` | `false` | Aceita apenas valores da lista |
| `delay` | `number` | `300` | Delay em ms antes de disparar a busca |
| `minLength` | `number` | `1` | Caracteres mínimos para iniciar a busca |
| `completeOnFocus` | `boolean` | `false` | Dispara busca ao receber foco |
| `placeholder` | `string` | `null` | Texto de placeholder |
| `disabled` | `boolean` | `false` | Desabilita o campo |

**Slots:** `option`, `optiongroup`, `header`, `footer`, `chip`, `empty`, `dropdownicon`, `removeTokenIcon`, `loadingIcon`
**Eventos:** `complete`, `item-select`, `item-unselect`, `dropdown-click`, `clear`, `focus`, `blur`

```vue
<AutoComplete
  v-model="cidade"
  :suggestions="sugestoes"
  optionLabel="name"
  @complete="buscar($event.query)"
  placeholder="Digite a cidade"
/>
```

---

### CascadeSelect

Select em cascata para seleção hierárquica (ex: País → Estado → Cidade).

**Docs PrimeVue:** [primevue.org/cascadeselect](https://primevue.org/cascadeselect/)

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `modelValue` | `any` | `null` | Valor selecionado (v-model) |
| `options` | `any[]` | `null` | Dados hierárquicos |
| `optionLabel` | `string` | `null` | Campo do label |
| `optionValue` | `string` | `null` | Campo do valor |
| `optionGroupLabel` | `string` | `null` | Campo do label do grupo |
| `optionGroupChildren` | `string[]` | `null` | Campos dos filhos em cada nível |
| `placeholder` | `string` | `null` | Placeholder |

**Eventos:** `change`, `group-change`, `show`, `hide`

---

### Checkbox

Checkbox padrão do PrimeVue. Suporta modo binário (v-model booleano) e modo de grupo.

**Docs PrimeVue:** [primevue.org/checkbox](https://primevue.org/checkbox/)

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `modelValue` | `any` | `null` | Valor (v-model) |
| `value` | `any` | `null` | Valor emitido quando marcado (modo grupo) |
| `binary` | `boolean` | `false` | Modo booleano (true/false) |
| `name` | `string` | `null` | Nome do campo |
| `trueValue` | `any` | `true` | Valor quando marcado (modo binário) |
| `falseValue` | `any` | `false` | Valor quando desmarcado (modo binário) |
| `disabled` | `boolean` | `false` | Desabilita |
| `readonly` | `boolean` | `false` | Somente leitura |
| `indeterminate` | `boolean` | `false` | Estado indeterminado |

**Eventos:** `change`, `focus`, `blur`

---

### CheckboxGroup

Container para agrupar múltiplos `Checkbox` com v-model compartilhado (array de valores).

**Docs PrimeVue:** [primevue.org/checkbox](https://primevue.org/checkbox/)

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `modelValue` | `any[]` | `null` | Array de valores selecionados (v-model) |

---

### ColorPicker

Seletor de cor com suporte a formatos HEX, RGB e HSB.

**Docs PrimeVue:** [primevue.org/colorpicker](https://primevue.org/colorpicker/)

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `modelValue` | `string \| object` | `null` | Cor selecionada (v-model) |
| `format` | `'hex' \| 'rgb' \| 'hsb'` | `'hex'` | Formato de saída |
| `inline` | `boolean` | `false` | Exibe o seletor inline (sem popup) |
| `disabled` | `boolean` | `false` | Desabilita |

**Eventos:** `change`, `show`, `hide`

---

### DatePicker

Seletor de data e hora com calendário visual. Suporta faixa de datas, múltiplas datas e seleção de hora.

**Docs PrimeVue:** [primevue.org/datepicker](https://primevue.org/datepicker/)

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `modelValue` | `Date \| Date[]` | `null` | Data selecionada (v-model) |
| `selectionMode` | `'single' \| 'multiple' \| 'range'` | `'single'` | Modo de seleção |
| `dateFormat` | `string` | `'mm/dd/yy'` | Formato de exibição |
| `inline` | `boolean` | `false` | Calendário inline |
| `showTime` | `boolean` | `false` | Exibe seletor de hora |
| `hourFormat` | `'12' \| '24'` | `'24'` | Formato de hora |
| `showIcon` | `boolean` | `false` | Exibe ícone de calendário |
| `minDate` | `Date` | `null` | Data mínima permitida |
| `maxDate` | `Date` | `null` | Data máxima permitida |
| `disabled` | `boolean` | `false` | Desabilita |
| `placeholder` | `string` | `null` | Placeholder |
| `numberOfMonths` | `number` | `1` | Meses exibidos simultaneamente |
| `view` | `'date' \| 'month' \| 'year'` | `'date'` | Visualização inicial |

**Slots:** `header`, `footer`, `date`, `decade`
**Eventos:** `date-select`, `show`, `hide`, `month-change`, `year-change`

```vue
<DatePicker v-model="dataInicio" dateFormat="dd/mm/yy" showIcon placeholder="Selecione a data" />
```

---

### InputOtp

Campo para entrada de código OTP (One-Time Password) com caixas individuais por caractere.

**Docs PrimeVue:** [primevue.org/inputotp](https://primevue.org/inputotp/)

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `modelValue` | `string \| number` | `null` | Valor OTP (v-model) |
| `length` | `number` | `4` | Número de caracteres |
| `mask` | `boolean` | `false` | Oculta os caracteres (modo senha) |
| `integerOnly` | `boolean` | `false` | Aceita apenas números |
| `disabled` | `boolean` | `false` | Desabilita |

**Eventos:** `change`, `complete`, `focus`, `blur`

---

### Knob

Controle circular rotativo para entrada numérica com visual analógico.

**Docs PrimeVue:** [primevue.org/knob](https://primevue.org/knob/)

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `modelValue` | `number` | `null` | Valor numérico (v-model) |
| `min` | `number` | `0` | Valor mínimo |
| `max` | `number` | `100` | Valor máximo |
| `step` | `number` | `1` | Incremento |
| `size` | `number` | `100` | Tamanho em pixels |
| `strokeWidth` | `number` | `14` | Largura do traço |
| `showValue` | `boolean` | `true` | Exibe o valor numérico no centro |
| `valueTemplate` | `string` | `'{value}'` | Template do valor (ex: `'{value}%'`) |
| `disabled` | `boolean` | `false` | Desabilita |
| `readonly` | `boolean` | `false` | Somente leitura |

**Eventos:** `change`

---

### Listbox

Lista de seleção (single ou múltipla) com scroll e filtro integrado.

**Docs PrimeVue:** [primevue.org/listbox](https://primevue.org/listbox/)

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `modelValue` | `any` | `null` | Valor selecionado (v-model) |
| `options` | `any[]` | `null` | Lista de opções |
| `optionLabel` | `string \| Function` | `null` | Campo do label |
| `optionValue` | `string` | `null` | Campo do valor |
| `multiple` | `boolean` | `false` | Seleção múltipla |
| `filter` | `boolean` | `false` | Habilita filtro de busca |
| `filterPlaceholder` | `string` | `null` | Placeholder do filtro |
| `disabled` | `boolean` | `false` | Desabilita |
| `listStyle` | `string` | `null` | Estilo CSS da lista (ex: `'max-height:200px'`) |

**Slots:** `option`, `optiongroup`, `header`, `footer`, `empty`, `filter`
**Eventos:** `change`, `filter`

---

### MultiSelect

Dropdown com seleção múltipla, exibindo chips ou labels dos itens selecionados.

**Docs PrimeVue:** [primevue.org/multiselect](https://primevue.org/multiselect/)

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `modelValue` | `any[]` | `null` | Valores selecionados (v-model) |
| `options` | `any[]` | `null` | Lista de opções |
| `optionLabel` | `string \| Function` | `null` | Campo do label |
| `optionValue` | `string` | `null` | Campo do valor |
| `filter` | `boolean` | `false` | Habilita filtro |
| `display` | `'comma' \| 'chip'` | `'comma'` | Formato de exibição dos selecionados |
| `maxSelectedLabels` | `number` | `null` | Máximo de labels visíveis (exibe "N itens selecionados" após) |
| `placeholder` | `string` | `null` | Placeholder |
| `disabled` | `boolean` | `false` | Desabilita |
| `showToggleAll` | `boolean` | `true` | Exibe checkbox "selecionar todos" |

**Slots:** `value`, `option`, `optiongroup`, `header`, `footer`, `empty`, `chip`
**Eventos:** `change`, `filter`, `selectall-change`, `show`, `hide`

---

### Password

Campo de senha com indicador de força e toggle de visibilidade.

**Docs PrimeVue:** [primevue.org/password](https://primevue.org/password/)

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `modelValue` | `string` | `null` | Valor da senha (v-model) |
| `feedback` | `boolean` | `true` | Exibe indicador de força |
| `toggleMask` | `boolean` | `false` | Botão para mostrar/ocultar senha |
| `disabled` | `boolean` | `false` | Desabilita |
| `placeholder` | `string` | `null` | Placeholder |
| `promptLabel` | `string` | `null` | Texto do prompt de força |
| `weakLabel` | `string` | `null` | Label "fraca" |
| `mediumLabel` | `string` | `null` | Label "média" |
| `strongLabel` | `string` | `null` | Label "forte" |

**Slots:** `header`, `footer`, `showicon`, `hideicon`

---

### Rating

Componente de avaliação por estrelas.

**Docs PrimeVue:** [primevue.org/rating](https://primevue.org/rating/)

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `modelValue` | `number` | `null` | Nota selecionada (v-model) |
| `stars` | `number` | `5` | Número de estrelas |
| `cancel` | `boolean` | `true` | Permite limpar a seleção |
| `disabled` | `boolean` | `false` | Desabilita |
| `readonly` | `boolean` | `false` | Somente leitura |

**Slots:** `onicon`, `officon`, `cancelicon`
**Eventos:** `change`, `focus`, `blur`

---

### Select

Dropdown de seleção única (substituto do antigo `Dropdown` no PrimeVue 4).

**Docs PrimeVue:** [primevue.org/select](https://primevue.org/select/)

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `modelValue` | `any` | `null` | Valor selecionado (v-model) |
| `options` | `any[]` | `null` | Lista de opções |
| `optionLabel` | `string \| Function` | `null` | Campo do label |
| `optionValue` | `string` | `null` | Campo do valor |
| `optionGroupLabel` | `string` | `null` | Campo do label do grupo |
| `optionGroupChildren` | `string` | `null` | Campo dos itens do grupo |
| `filter` | `boolean` | `false` | Habilita filtro de busca |
| `showClear` | `boolean` | `false` | Botão para limpar seleção |
| `placeholder` | `string` | `null` | Placeholder |
| `disabled` | `boolean` | `false` | Desabilita |
| `editable` | `boolean` | `false` | Permite digitação livre |
| `loading` | `boolean` | `false` | Exibe ícone de carregamento |

**Slots:** `value`, `option`, `optiongroup`, `header`, `footer`, `empty`, `clearicon`, `dropdownicon`, `loadingicon`, `filter`
**Eventos:** `change`, `filter`, `show`, `hide`, `focus`, `blur`

```vue
<Select v-model="estado" :options="estados" optionLabel="nome" optionValue="uf" placeholder="Selecione o estado" />
```

---

### SelectButton

Grupo de botões para seleção única ou múltipla (segmented control).

**Docs PrimeVue:** [primevue.org/selectbutton](https://primevue.org/selectbutton/)

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `modelValue` | `any` | `null` | Valor selecionado (v-model) |
| `options` | `any[]` | `null` | Lista de opções |
| `optionLabel` | `string` | `null` | Campo do label |
| `optionValue` | `string` | `null` | Campo do valor |
| `multiple` | `boolean` | `false` | Seleção múltipla |
| `disabled` | `boolean` | `false` | Desabilita |
| `allowEmpty` | `boolean` | `true` | Permite desmarcar todos |

**Slots:** `option`
**Eventos:** `change`

---

### Slider

Controle deslizante para seleção de valor numérico ou faixa.

**Docs PrimeVue:** [primevue.org/slider](https://primevue.org/slider/)

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `modelValue` | `number \| number[]` | `0` | Valor (v-model). Array para modo range |
| `min` | `number` | `0` | Valor mínimo |
| `max` | `number` | `100` | Valor máximo |
| `step` | `number` | `1` | Incremento |
| `range` | `boolean` | `false` | Modo faixa (dois handles) |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | Orientação |
| `disabled` | `boolean` | `false` | Desabilita |

**Eventos:** `change`, `slideend`

---

### Textarea

Área de texto multi-linha do PrimeVue.

**Docs PrimeVue:** [primevue.org/textarea](https://primevue.org/textarea/)

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `modelValue` | `string` | `null` | Valor do texto (v-model) |
| `autoResize` | `boolean` | `false` | Redimensiona automaticamente |
| `rows` | `number` | `null` | Linhas visíveis |
| `cols` | `number` | `null` | Colunas visíveis |
| `disabled` | `boolean` | `false` | Desabilita |

---

### ToggleButton

Botão que alterna entre dois estados (ligado/desligado) com label e ícone.

**Docs PrimeVue:** [primevue.org/togglebutton](https://primevue.org/togglebutton/)

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `modelValue` | `boolean` | `false` | Estado do botão (v-model) |
| `onLabel` | `string` | `'Yes'` | Label quando ativo |
| `offLabel` | `string` | `'No'` | Label quando inativo |
| `onIcon` | `string` | `null` | Ícone quando ativo |
| `offIcon` | `string` | `null` | Ícone quando inativo |
| `disabled` | `boolean` | `false` | Desabilita |

**Eventos:** `change`

---

### ToggleSwitch

Interruptor on/off estilo switch.

**Docs PrimeVue:** [primevue.org/toggleswitch](https://primevue.org/toggleswitch/)

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `modelValue` | `boolean` | `false` | Estado do switch (v-model) |
| `trueValue` | `any` | `true` | Valor quando ativo |
| `falseValue` | `any` | `false` | Valor quando inativo |
| `disabled` | `boolean` | `false` | Desabilita |
| `readonly` | `boolean` | `false` | Somente leitura |

**Eventos:** `change`, `focus`, `blur`

---

### TreeSelect

Dropdown com seleção em estrutura de árvore hierárquica.

**Docs PrimeVue:** [primevue.org/treeselect](https://primevue.org/treeselect/)

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `modelValue` | `any` | `null` | Nó(s) selecionado(s) (v-model) |
| `options` | `TreeNode[]` | `null` | Dados da árvore |
| `selectionMode` | `'single' \| 'multiple' \| 'checkbox'` | `'single'` | Modo de seleção |
| `placeholder` | `string` | `null` | Placeholder |
| `filter` | `boolean` | `false` | Habilita filtro |
| `disabled` | `boolean` | `false` | Desabilita |
| `display` | `'comma' \| 'chip'` | `'comma'` | Formato de exibição |

**Slots:** `value`, `header`, `footer`, `empty`
**Eventos:** `change`, `node-select`, `node-unselect`, `show`, `hide`

---

### RadioButton

Botão de rádio para seleção exclusiva dentro de um grupo.

**Docs PrimeVue:** [primevue.org/radiobutton](https://primevue.org/radiobutton/)

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `modelValue` | `any` | `null` | Valor do grupo (v-model) |
| `value` | `any` | `null` | Valor quando selecionado |
| `name` | `string` | `null` | Nome do grupo |
| `disabled` | `boolean` | `false` | Desabilita |

**Eventos:** `change`, `focus`, `blur`

---

## Botões

### SpeedDial

Menu de ações rápidas em formato radial, linear ou semicircular. Expande ao clicar no botão principal.

**Docs PrimeVue:** [primevue.org/speeddial](https://primevue.org/speeddial/)

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `model` | `MenuItem[]` | `null` | Itens do menu |
| `direction` | `'up' \| 'down' \| 'left' \| 'right'` | `'up'` | Direção de expansão |
| `type` | `'linear' \| 'circle' \| 'semi-circle' \| 'quarter-circle'` | `'linear'` | Formato de distribuição |
| `radius` | `number` | `0` | Raio para modos circular/semi |
| `mask` | `boolean` | `false` | Overlay ao expandir |
| `disabled` | `boolean` | `false` | Desabilita |

**Slots:** `button`, `item`
**Eventos:** `click`, `show`, `hide`

---

### SplitButton

Botão com ação principal e dropdown de ações secundárias.

**Docs PrimeVue:** [primevue.org/splitbutton](https://primevue.org/splitbutton/)

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `label` | `string` | `null` | Texto do botão principal |
| `icon` | `string` | `null` | Ícone do botão principal |
| `model` | `MenuItem[]` | `null` | Itens do dropdown |
| `severity` | `string` | `null` | `'secondary'`, `'success'`, `'info'`, `'warn'`, `'danger'`, `'help'`, `'contrast'` |
| `size` | `'small' \| 'large'` | `null` | Tamanho |
| `disabled` | `boolean` | `false` | Desabilita |
| `loading` | `boolean` | `false` | Estado de carregamento |
| `raised` | `boolean` | `false` | Adiciona sombra |
| `rounded` | `boolean` | `false` | Bordas arredondadas |
| `outlined` | `boolean` | `false` | Variante outlined |

**Slots:** `default`, `icon`, `menubuttonicon`
**Eventos:** `click`

---

## Dados

### DataTable

Tabela de dados avançada com ordenação, filtro, paginação, seleção, edição inline, agrupamento, expansão de linhas e virtualização.

**Docs PrimeVue:** [primevue.org/datatable](https://primevue.org/datatable/)

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `value` | `any[]` | `null` | Dados da tabela |
| `dataKey` | `string` | `null` | Campo único que identifica cada linha |
| `rows` | `number` | `null` | Linhas por página (habilita paginação) |
| `totalRecords` | `number` | `null` | Total de registros (paginação remota) |
| `paginator` | `boolean` | `false` | Exibe paginador |
| `sortField` | `string` | `null` | Campo de ordenação |
| `sortOrder` | `number` | `null` | `1` (asc) ou `-1` (desc) |
| `sortMode` | `'single' \| 'multiple'` | `'single'` | Modo de ordenação |
| `filters` | `object` | `null` | Filtros ativos (v-model) |
| `filterDisplay` | `'menu' \| 'row'` | `null` | Localização dos filtros |
| `selection` | `any` | `null` | Linha(s) selecionada(s) (v-model) |
| `selectionMode` | `'single' \| 'multiple'` | `null` | Modo de seleção |
| `scrollable` | `boolean` | `false` | Scroll horizontal/vertical |
| `scrollHeight` | `string` | `null` | Altura para scroll (ex: `'400px'`, `'flex'`) |
| `virtualScrollerOptions` | `object` | `null` | Configuração do virtual scroller |
| `loading` | `boolean` | `false` | Exibe indicador de carregamento |
| `stripedRows` | `boolean` | `false` | Linhas listradas |
| `showGridlines` | `boolean` | `false` | Exibe linhas de grade |
| `size` | `'small' \| 'large'` | `null` | Tamanho compacto ou grande |
| `rowHover` | `boolean` | `false` | Destaca linha ao hover |
| `expandedRows` | `any[]` | `null` | Linhas expandidas (v-model) |
| `editMode` | `'cell' \| 'row'` | `null` | Modo de edição |
| `lazy` | `boolean` | `false` | Paginação/ordenação remota |
| `reorderableColumns` | `boolean` | `false` | Permite reordenar colunas |
| `resizableColumns` | `boolean` | `false` | Permite redimensionar colunas |

**Slots:** `header`, `footer`, `empty`, `loading`, `expansion`, `groupheader`, `groupfooter`, `paginatorstart`, `paginatorend`
**Eventos:** `page`, `sort`, `filter`, `row-click`, `row-dblclick`, `row-select`, `row-unselect`, `row-expand`, `row-collapse`, `cell-edit-init`, `cell-edit-complete`, `cell-edit-cancel`, `row-edit-init`, `row-edit-save`, `row-edit-cancel`, `column-resize-end`, `column-reorder`, `row-reorder`, `state-save`, `state-restore`

```vue
<DataTable :value="produtos" paginator :rows="10" stripedRows dataKey="id">
  <Column field="nome" header="Nome" sortable />
  <Column field="preco" header="Preço" sortable />
  <Column field="categoria" header="Categoria" />
</DataTable>
```

#### Column

Define uma coluna do `DataTable`.

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `field` | `string` | `null` | Campo do objeto de dados |
| `header` | `string` | `null` | Texto do cabeçalho |
| `sortable` | `boolean` | `false` | Permite ordenação |
| `filter` | `boolean` | `false` | Habilita filtro |
| `style` | `object \| string` | `null` | Estilo CSS da coluna |
| `frozen` | `boolean` | `false` | Coluna fixa (sticky) |
| `alignFrozen` | `'left' \| 'right'` | `'left'` | Lado da coluna fixa |
| `expander` | `boolean` | `false` | Coluna de expansão |
| `selectionMode` | `'single' \| 'multiple'` | `null` | Coluna de seleção (checkbox/radio) |
| `bodyStyle` | `object \| string` | `null` | Estilo do corpo |
| `headerStyle` | `object \| string` | `null` | Estilo do cabeçalho |

**Slots:** `body`, `header`, `footer`, `filter`, `editor`, `sorticon`, `filtericon`

#### ColumnGroup / Row

Agrupamento de colunas para cabeçalhos e rodapés multi-linha.

```vue
<ColumnGroup type="header">
  <Row>
    <Column header="Produto" :rowspan="2" />
    <Column header="Vendas" :colspan="2" />
  </Row>
</ColumnGroup>
```

---

### DataView

Exibição de dados em formato lista ou grid com template customizável.

**Docs PrimeVue:** [primevue.org/dataview](https://primevue.org/dataview/)

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `value` | `any[]` | `null` | Dados |
| `layout` | `'list' \| 'grid'` | `'list'` | Modo de exibição |
| `paginator` | `boolean` | `false` | Exibe paginador |
| `rows` | `number` | `null` | Itens por página |
| `dataKey` | `string` | `null` | Campo identificador |

**Slots:** `list`, `grid`, `header`, `footer`, `empty`

---

### OrderList

Lista com reordenação por drag-and-drop e botões de mover.

**Docs PrimeVue:** [primevue.org/orderlist](https://primevue.org/orderlist/)

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `modelValue` | `any[]` | `null` | Itens da lista (v-model) |
| `dataKey` | `string` | `null` | Campo identificador |
| `selection` | `any[]` | `null` | Itens selecionados |
| `stripedRows` | `boolean` | `false` | Listras |

**Slots:** `option`, `header`, `controlsstart`, `controlsend`

---

### OrganizationChart

Visualização de estrutura hierárquica (organograma).

**Docs PrimeVue:** [primevue.org/organizationchart](https://primevue.org/organizationchart/)

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `value` | `TreeNode` | `null` | Dados da árvore |
| `selectionMode` | `'single' \| 'multiple'` | `null` | Modo de seleção |
| `selection` | `any` | `null` | Nó(s) selecionado(s) |
| `collapsible` | `boolean` | `false` | Permite colapsar nós |

**Slots:** `default` (recebe `{ node }`)

---

### Paginator

Componente de paginação standalone.

**Docs PrimeVue:** [primevue.org/paginator](https://primevue.org/paginator/)

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `totalRecords` | `number` | `0` | Total de registros |
| `rows` | `number` | `0` | Registros por página |
| `first` | `number` | `0` | Índice do primeiro registro |
| `rowsPerPageOptions` | `number[]` | `null` | Opções de itens por página |
| `template` | `string` | (padrão) | Layout do paginador |

**Eventos:** `page` (`{ page, first, rows, pageCount }`)

---

### PickList

Lista dupla para transferir itens entre "disponíveis" e "selecionados".

**Docs PrimeVue:** [primevue.org/picklist](https://primevue.org/picklist/)

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `modelValue` | `any[][]` | `null` | `[source, target]` (v-model) |
| `dataKey` | `string` | `null` | Campo identificador |
| `selection` | `any[][]` | `null` | Itens selecionados `[sourceSelection, targetSelection]` |
| `stripedRows` | `boolean` | `false` | Listras |

**Slots:** `sourceheader`, `targetheader`, `option`, `sourcecontrolsstart`, `targetcontrolsstart`

---

### Timeline

Linha do tempo vertical ou horizontal para exibição de eventos sequenciais.

**Docs PrimeVue:** [primevue.org/timeline](https://primevue.org/timeline/)

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `value` | `any[]` | `null` | Eventos da timeline |
| `align` | `'left' \| 'right' \| 'alternate'` | `'left'` | Alinhamento do conteúdo |
| `layout` | `'vertical' \| 'horizontal'` | `'vertical'` | Orientação |

**Slots:** `content`, `opposite`, `marker`, `connector`

---

### Tree

Visualização e seleção de dados em estrutura de árvore com checkbox, expansão e drag-and-drop.

**Docs PrimeVue:** [primevue.org/tree](https://primevue.org/tree/)

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `value` | `TreeNode[]` | `null` | Dados da árvore |
| `selectionMode` | `'single' \| 'multiple' \| 'checkbox'` | `null` | Modo de seleção |
| `selectionKeys` | `object` | `null` | Nós selecionados (v-model) |
| `expandedKeys` | `object` | `null` | Nós expandidos (v-model) |
| `filter` | `boolean` | `false` | Habilita filtro |
| `filterPlaceholder` | `string` | `null` | Placeholder do filtro |
| `loading` | `boolean` | `false` | Carregamento |

**Slots:** `default` (recebe `{ node }`), `togglericon`, `loadingicon`
**Eventos:** `node-select`, `node-unselect`, `node-expand`, `node-collapse`, `filter`

---

### TreeTable

DataTable com suporte a dados hierárquicos (árvore).

**Docs PrimeVue:** [primevue.org/treetable](https://primevue.org/treetable/)

Props similares ao `DataTable`, mas recebe `TreeNode[]` no `value`.

---

### VirtualScroller

Renderização virtualizada de listas grandes para performance otimizada.

**Docs PrimeVue:** [primevue.org/virtualscroller](https://primevue.org/virtualscroller/)

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `items` | `any[]` | `null` | Dados da lista |
| `itemSize` | `number \| number[]` | `null` | Altura de cada item em px |
| `orientation` | `'vertical' \| 'horizontal' \| 'both'` | `'vertical'` | Orientação |
| `numToleratedItems` | `number` | `null` | Itens extras renderizados fora da viewport |
| `lazy` | `boolean` | `false` | Carregamento sob demanda |

**Slots:** `content`, `item`, `loader`
**Eventos:** `scroll`, `scroll-index-change`, `lazy-load`

---

## Painéis

### Accordion

Painel colapsável com múltiplas seções. No PrimeVue 4, usa sub-componentes `AccordionPanel`, `AccordionHeader` e `AccordionContent`.

**Docs PrimeVue:** [primevue.org/accordion](https://primevue.org/accordion/)

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `value` | `string \| string[]` | `null` | Painel(is) ativo(s) (v-model) |
| `multiple` | `boolean` | `false` | Permite múltiplos painéis abertos |
| `lazy` | `boolean` | `false` | Renderiza conteúdo apenas quando aberto |
| `expandIcon` | `string` | `null` | Ícone de expansão |
| `collapseIcon` | `string` | `null` | Ícone de colapso |

```vue
<Accordion value="0">
  <AccordionPanel value="0">
    <AccordionHeader>Título 1</AccordionHeader>
    <AccordionContent>Conteúdo do painel 1</AccordionContent>
  </AccordionPanel>
  <AccordionPanel value="1">
    <AccordionHeader>Título 2</AccordionHeader>
    <AccordionContent>Conteúdo do painel 2</AccordionContent>
  </AccordionPanel>
</Accordion>
```

#### Sub-componentes: AccordionPanel, AccordionHeader, AccordionContent

- **AccordionPanel** — Wrapper do painel. Prop: `value` (identificador).
- **AccordionHeader** — Cabeçalho clicável.
- **AccordionContent** — Corpo do painel.

---

### Card

Container com cabeçalho, corpo, subtítulo e rodapé.

**Docs PrimeVue:** [primevue.org/card](https://primevue.org/card/)

Sem props. Usa slots para estruturar o conteúdo.

**Slots:** `header`, `title`, `subtitle`, `content`, `footer`

```vue
<Card>
  <template #title>Título do Card</template>
  <template #subtitle>Subtítulo</template>
  <template #content>Conteúdo principal do card.</template>
  <template #footer>
    <Button label="Salvar" />
  </template>
</Card>
```

---

### Divider

Separador visual horizontal ou vertical.

**Docs PrimeVue:** [primevue.org/divider](https://primevue.org/divider/)

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `layout` | `'horizontal' \| 'vertical'` | `'horizontal'` | Orientação |
| `align` | `'left' \| 'center' \| 'right' \| 'top' \| 'bottom'` | `null` | Alinhamento do conteúdo |
| `type` | `'solid' \| 'dashed' \| 'dotted'` | `'solid'` | Estilo da linha |

---

### Fieldset

Container com legenda e opção de colapso.

**Docs PrimeVue:** [primevue.org/fieldset](https://primevue.org/fieldset/)

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `legend` | `string` | `null` | Texto da legenda |
| `toggleable` | `boolean` | `false` | Permite colapsar |
| `collapsed` | `boolean` | `false` | Estado colapsado (v-model) |

**Slots:** `legend`, `togglericon`
**Eventos:** `toggle`

---

### Panel

Painel com cabeçalho e conteúdo colapsável.

**Docs PrimeVue:** [primevue.org/panel](https://primevue.org/panel/)

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `header` | `string` | `null` | Texto do cabeçalho |
| `toggleable` | `boolean` | `false` | Permite colapsar |
| `collapsed` | `boolean` | `false` | Estado colapsado (v-model) |

**Slots:** `header`, `icons`, `togglericon`, `footer`
**Eventos:** `toggle`

---

### ScrollPanel

Container com scrollbar customizável (cross-browser).

**Docs PrimeVue:** [primevue.org/scrollpanel](https://primevue.org/scrollpanel/)

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `style` | `object` | `null` | Dimensões (ex: `{ width: '100%', height: '300px' }`) |

---

### Splitter / SplitterPanel

Container dividido em painéis redimensionáveis.

**Docs PrimeVue:** [primevue.org/splitter](https://primevue.org/splitter/)

**Splitter props:**

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `layout` | `'horizontal' \| 'vertical'` | `'horizontal'` | Orientação |
| `gutterSize` | `number` | `4` | Tamanho da alça em px |
| `stateKey` | `string` | `null` | Chave para salvar estado no storage |

**SplitterPanel props:**

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `size` | `number` | `null` | Tamanho inicial (%) |
| `minSize` | `number` | `null` | Tamanho mínimo (%) |

**Eventos:** `resizeend`

```vue
<Splitter>
  <SplitterPanel :size="70">Painel esquerdo (70%)</SplitterPanel>
  <SplitterPanel :size="30">Painel direito (30%)</SplitterPanel>
</Splitter>
```

---

### Stepper

Navegação passo a passo (wizard). No PrimeVue 4, usa sub-componentes `StepList`, `StepPanels`, `StepItem`, `Step` e `StepPanel`.

**Docs PrimeVue:** [primevue.org/stepper](https://primevue.org/stepper/)

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `value` | `string \| number` | `null` | Passo ativo (v-model) |
| `linear` | `boolean` | `false` | Impede pular passos |

```vue
<Stepper value="1">
  <StepList>
    <Step value="1">Dados</Step>
    <Step value="2">Endereço</Step>
    <Step value="3">Confirmação</Step>
  </StepList>
  <StepPanels>
    <StepPanel v-slot="{ activateCallback }" value="1">
      <p>Conteúdo do passo 1</p>
      <Button label="Próximo" @click="activateCallback('2')" />
    </StepPanel>
    <StepPanel v-slot="{ activateCallback }" value="2">
      <p>Conteúdo do passo 2</p>
      <Button label="Próximo" @click="activateCallback('3')" />
    </StepPanel>
    <StepPanel value="3">
      <p>Conteúdo final</p>
    </StepPanel>
  </StepPanels>
</Stepper>
```

#### Sub-componentes: StepList, StepPanels, StepItem, Step, StepPanel

- **StepList** — Container da lista de passos.
- **StepPanels** — Container dos painéis de conteúdo.
- **StepItem** — Wrapper de cada passo (opcional, para controle avançado).
- **Step** — Indicador visual do passo. Prop: `value`.
- **StepPanel** — Conteúdo do passo. Prop: `value`. Slot: `default` (recebe `{ activateCallback }`).

---

### Tabs

Navegação por abas. No PrimeVue 4, usa sub-componentes `TabList`, `Tab`, `TabPanels` e `TabPanel`.

**Docs PrimeVue:** [primevue.org/tabs](https://primevue.org/tabs/)

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `value` | `string \| number` | `null` | Aba ativa (v-model) |
| `lazy` | `boolean` | `false` | Renderiza painel apenas quando ativo |
| `scrollable` | `boolean` | `false` | Scroll horizontal para muitas abas |

```vue
<Tabs value="0">
  <TabList>
    <Tab value="0">Geral</Tab>
    <Tab value="1">Detalhes</Tab>
    <Tab value="2">Configurações</Tab>
  </TabList>
  <TabPanels>
    <TabPanel value="0">Conteúdo da aba Geral</TabPanel>
    <TabPanel value="1">Conteúdo da aba Detalhes</TabPanel>
    <TabPanel value="2">Conteúdo da aba Configurações</TabPanel>
  </TabPanels>
</Tabs>
```

#### Sub-componentes: TabList, Tab, TabPanels, TabPanel

- **TabList** — Container horizontal das abas.
- **Tab** — Aba individual. Prop: `value`.
- **TabPanels** — Container dos painéis.
- **TabPanel** — Conteúdo da aba. Prop: `value`.

---

### Toolbar

Barra de ferramentas com áreas esquerda, central e direita.

**Docs PrimeVue:** [primevue.org/toolbar](https://primevue.org/toolbar/)

**Slots:** `start`, `center`, `end`

```vue
<Toolbar>
  <template #start>
    <Button icon="pi pi-plus" label="Novo" />
  </template>
  <template #end>
    <Button icon="pi pi-download" label="Exportar" />
  </template>
</Toolbar>
```

---

### Editor

Editor de texto rico baseado no Quill.js.

**Docs PrimeVue:** [primevue.org/editor](https://primevue.org/editor/)

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `modelValue` | `string` | `null` | Conteúdo HTML (v-model) |
| `placeholder` | `string` | `null` | Placeholder |
| `readonly` | `boolean` | `false` | Somente leitura |
| `modules` | `object` | `null` | Módulos do Quill |

**Slots:** `toolbar`
**Eventos:** `text-change`, `selection-change`, `load`

---

## Overlays

### ConfirmDialog

Dialog de confirmação global. Usado com o serviço `useConfirm()`.

**Docs PrimeVue:** [primevue.org/confirmdialog](https://primevue.org/confirmdialog/)

Deve ser colocado uma vez no layout raiz. Controlado via `useConfirm()`.

```vue
<!-- No layout -->
<ConfirmDialog />

<!-- No componente -->
<script setup>
import { useConfirm } from 'primevue/useconfirm';
const confirm = useConfirm();

confirm.require({
  message: 'Deseja excluir este item?',
  header: 'Confirmação',
  icon: 'pi pi-exclamation-triangle',
  accept: () => excluir(),
  reject: () => {}
});
</script>
```

---

### ConfirmPopup

Popover de confirmação posicionado sobre o elemento gatilho. Usa `useConfirm()`.

**Docs PrimeVue:** [primevue.org/confirmpopup](https://primevue.org/confirmpopup/)

---

### Dialog

Modal/dialog com cabeçalho, conteúdo e rodapé customizáveis.

**Docs PrimeVue:** [primevue.org/dialog](https://primevue.org/dialog/)

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `visible` | `boolean` | `false` | Visibilidade (v-model) |
| `header` | `string` | `null` | Texto do cabeçalho |
| `modal` | `boolean` | `false` | Overlay escuro atrás do dialog |
| `closable` | `boolean` | `true` | Botão de fechar |
| `draggable` | `boolean` | `true` | Permite arrastar |
| `keepInViewport` | `boolean` | `true` | Mantém dentro da viewport |
| `maximizable` | `boolean` | `false` | Botão maximizar |
| `position` | `'center' \| 'top' \| 'bottom' \| 'left' \| 'right' \| ...` | `'center'` | Posição |
| `dismissableMask` | `boolean` | `false` | Fecha ao clicar no overlay |
| `closeOnEscape` | `boolean` | `true` | Fecha com ESC |
| `blockScroll` | `boolean` | `false` | Bloqueia scroll do body |

**Slots:** `header`, `footer`, `closeicon`, `maximizeicon`
**Eventos:** `show`, `hide`, `after-hide`, `maximize`, `unmaximize`, `dragend`

```vue
<Dialog v-model:visible="exibirDialog" header="Editar Registro" modal :style="{ width: '450px' }">
  <p>Conteúdo do dialog</p>
  <template #footer>
    <Button label="Cancelar" @click="exibirDialog = false" text />
    <Button label="Salvar" @click="salvar" />
  </template>
</Dialog>
```

---

### Drawer

Painel lateral deslizante (sidebar).

**Docs PrimeVue:** [primevue.org/drawer](https://primevue.org/drawer/)

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `visible` | `boolean` | `false` | Visibilidade (v-model) |
| `position` | `'left' \| 'right' \| 'top' \| 'bottom' \| 'full'` | `'left'` | Posição |
| `header` | `string` | `null` | Texto do cabeçalho |
| `modal` | `boolean` | `true` | Overlay atrás |
| `dismissable` | `boolean` | `true` | Fecha ao clicar fora |
| `closeOnEscape` | `boolean` | `true` | Fecha com ESC |
| `blockScroll` | `boolean` | `false` | Bloqueia scroll do body |

**Slots:** `header`, `closeicon`
**Eventos:** `show`, `hide`

```vue
<Drawer v-model:visible="menuAberto" header="Menu" position="left">
  <Menu :model="itensMenu" />
</Drawer>
```

---

### DynamicDialog

Dialog renderizado dinamicamente via serviço `useDialog()`. Permite abrir dialogs programaticamente com componentes como conteúdo.

**Docs PrimeVue:** [primevue.org/dynamicdialog](https://primevue.org/dynamicdialog/)

---

### Popover

Painel flutuante que aparece posicionado relativo a um elemento gatilho.

**Docs PrimeVue:** [primevue.org/popover](https://primevue.org/popover/)

Controlado via `ref` e métodos `toggle(event)`, `show(event)`, `hide()`.

**Slots:** `default`
**Eventos:** `show`, `hide`

```vue
<Button @click="popover.toggle($event)" label="Informações" />
<Popover ref="popover">
  <p>Conteúdo do popover</p>
</Popover>
```

---

## Menus

### Breadcrumb

Navegação em trilha (breadcrumb).

**Docs PrimeVue:** [primevue.org/breadcrumb](https://primevue.org/breadcrumb/)

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `model` | `MenuItem[]` | `null` | Itens da trilha |
| `home` | `MenuItem` | `null` | Item "home" (primeiro) |

**Slots:** `item`, `separator`

---

### ContextMenu

Menu de contexto exibido ao clicar com botão direito.

**Docs PrimeVue:** [primevue.org/contextmenu](https://primevue.org/contextmenu/)

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `model` | `MenuItem[]` | `null` | Itens do menu |
| `global` | `boolean` | `false` | Associa ao documento inteiro |

Controlado via `ref` e método `show(event)`.

---

### Dock

Barra de ícones estilo macOS Dock com efeito de ampliação.

**Docs PrimeVue:** [primevue.org/dock](https://primevue.org/dock/)

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `model` | `MenuItem[]` | `null` | Itens do dock |
| `position` | `'top' \| 'bottom' \| 'left' \| 'right'` | `'bottom'` | Posição |

**Slots:** `item`, `icon`

---

### Menu

Menu popup ou inline simples.

**Docs PrimeVue:** [primevue.org/menu](https://primevue.org/menu/)

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `model` | `MenuItem[]` | `null` | Itens do menu |
| `popup` | `boolean` | `false` | Modo popup (controlado via `toggle`) |

**Slots:** `item`, `itemicon`, `start`, `end`, `submenuheader`
**Eventos:** `show`, `hide`, `focus`, `blur`

---

### Menubar

Barra de menu horizontal com submenus em dropdown.

**Docs PrimeVue:** [primevue.org/menubar](https://primevue.org/menubar/)

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `model` | `MenuItem[]` | `null` | Itens do menu |

**Slots:** `start`, `end`, `item`, `itemicon`, `submenuicon`, `menubutton`

```vue
<Menubar :model="itensMenu">
  <template #start>
    <img src="/logo.svg" alt="Logo" height="40" />
  </template>
  <template #end>
    <Button icon="pi pi-user" text rounded />
  </template>
</Menubar>
```

---

### MegaMenu

Menu de navegação com painéis multi-coluna para submenus complexos.

**Docs PrimeVue:** [primevue.org/megamenu](https://primevue.org/megamenu/)

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `model` | `MegaMenuItem[]` | `null` | Itens do menu |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | Orientação |

**Slots:** `start`, `end`, `item`, `submenuicon`, `itemicon`

---

### PanelMenu

Menu vertical com itens expansíveis (estilo accordion).

**Docs PrimeVue:** [primevue.org/panelmenu](https://primevue.org/panelmenu/)

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `model` | `MenuItem[]` | `null` | Itens do menu |
| `multiple` | `boolean` | `false` | Permite múltiplos painéis abertos |
| `expandedKeys` | `object` | `null` | Painéis expandidos (v-model) |

---

### TieredMenu

Menu com submenus em cascata (popup ou inline).

**Docs PrimeVue:** [primevue.org/tieredmenu](https://primevue.org/tieredmenu/)

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `model` | `MenuItem[]` | `null` | Itens do menu |
| `popup` | `boolean` | `false` | Modo popup |

**Slots:** `item`, `itemicon`, `submenuicon`, `start`, `end`
**Eventos:** `show`, `hide`, `focus`, `blur`

---

## Outros

### Badge

Indicador visual de contagem ou status.

**Docs PrimeVue:** [primevue.org/badge](https://primevue.org/badge/)

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `value` | `string \| number` | `null` | Valor exibido |
| `severity` | `'secondary' \| 'success' \| 'info' \| 'warn' \| 'danger' \| 'contrast'` | `null` | Cor |
| `size` | `'small' \| 'large' \| 'xlarge'` | `null` | Tamanho |

---

### OverlayBadge

Badge posicionado como overlay sobre um elemento filho.

**Docs PrimeVue:** [primevue.org/badge](https://primevue.org/badge/)

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `value` | `string \| number` | `null` | Valor exibido |
| `severity` | `string` | `null` | Cor do badge |
| `size` | `string` | `null` | Tamanho |

---

### Message

Componente de mensagem inline com ícone, severidade e opção de fechar.

**Docs PrimeVue:** [primevue.org/message](https://primevue.org/message/)

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `severity` | `'success' \| 'info' \| 'warn' \| 'error' \| 'secondary' \| 'contrast'` | `'info'` | Tipo da mensagem |
| `closable` | `boolean` | `true` | Botão de fechar |
| `icon` | `string` | `null` | Ícone personalizado |
| `life` | `number` | `null` | Auto-fechar após N ms |

**Slots:** `default`, `icon`, `closeicon`
**Eventos:** `close`, `life-end`

---

### Carousel

Exibição de conteúdo em slides com navegação e auto-play.

**Docs PrimeVue:** [primevue.org/carousel](https://primevue.org/carousel/)

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `value` | `any[]` | `null` | Dados dos slides |
| `numVisible` | `number` | `1` | Itens visíveis |
| `numScroll` | `number` | `1` | Itens por scroll |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | Orientação |
| `circular` | `boolean` | `false` | Loop infinito |
| `autoplayInterval` | `number` | `null` | Intervalo de auto-play em ms |
| `responsiveOptions` | `object[]` | `null` | Breakpoints responsivos |
| `showIndicators` | `boolean` | `true` | Indicadores de posição |
| `showNavigators` | `boolean` | `true` | Botões de navegação |

**Slots:** `item`, `header`, `footer`, `previousicon`, `nexticon`

---

### Galleria

Galeria de imagens com thumbnails, slideshow e fullscreen.

**Docs PrimeVue:** [primevue.org/galleria](https://primevue.org/galleria/)

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `value` | `any[]` | `null` | Lista de imagens |
| `numVisible` | `number` | `3` | Thumbnails visíveis |
| `showThumbnails` | `boolean` | `true` | Exibe thumbnails |
| `showIndicators` | `boolean` | `false` | Indicadores de posição |
| `fullScreen` | `boolean` | `false` | Modo tela cheia |
| `circular` | `boolean` | `false` | Loop infinito |
| `autoPlay` | `boolean` | `false` | Auto-play |
| `transitionInterval` | `number` | `4000` | Intervalo do auto-play em ms |

**Slots:** `item`, `thumbnail`, `caption`, `header`, `footer`, `indicator`

---

### Image

Componente de imagem com preview (zoom em fullscreen ao clicar).

**Docs PrimeVue:** [primevue.org/image](https://primevue.org/image/)

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `src` | `string` | `null` | URL da imagem |
| `alt` | `string` | `null` | Texto alternativo |
| `preview` | `boolean` | `false` | Habilita preview fullscreen |
| `width` | `string` | `null` | Largura |
| `indicatorIcon` | `string` | `null` | Ícone do indicador de preview |

**Slots:** `indicator`, `image`, `preview`

---

### ImageCompare

Comparação lado a lado de duas imagens com slider.

**Docs PrimeVue:** [primevue.org/imagecompare](https://primevue.org/imagecompare/)

**Slots:** `default` (duas imagens como filhos)

---

### Avatar / AvatarGroup

Ícone de avatar (imagem, ícone ou iniciais) com suporte a agrupamento.

**Docs PrimeVue:** [primevue.org/avatar](https://primevue.org/avatar/)

**Avatar props:**

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `image` | `string` | `null` | URL da imagem |
| `icon` | `string` | `null` | Classe do ícone PrimeIcon |
| `label` | `string` | `null` | Texto (iniciais) |
| `size` | `'normal' \| 'large' \| 'xlarge'` | `'normal'` | Tamanho |
| `shape` | `'square' \| 'circle'` | `'square'` | Formato |

**AvatarGroup** — Wrapper para exibir múltiplos `Avatar` sobrepostos.

```vue
<AvatarGroup>
  <Avatar image="/foto1.jpg" shape="circle" />
  <Avatar image="/foto2.jpg" shape="circle" />
  <Avatar label="+3" shape="circle" />
</AvatarGroup>
```

---

### BlockUI

Bloqueia interação de um elemento ou da página inteira com overlay.

**Docs PrimeVue:** [primevue.org/blockui](https://primevue.org/blockui/)

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `blocked` | `boolean` | `false` | Ativa o bloqueio |
| `fullScreen` | `boolean` | `false` | Bloqueia toda a página |

---

### Chip

Badge compacto com texto, ícone e opção de remoção.

**Docs PrimeVue:** [primevue.org/chip](https://primevue.org/chip/)

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `label` | `string` | `null` | Texto do chip |
| `icon` | `string` | `null` | Ícone |
| `image` | `string` | `null` | URL da imagem |
| `removable` | `boolean` | `false` | Botão de remover |

**Slots:** `default`, `icon`, `removeicon`
**Eventos:** `remove`

---

### Chips

Campo de entrada que cria múltiplos chips (tags) a partir de texto digitado.

**Docs PrimeVue:** [primevue.org/chips](https://primevue.org/chips/)

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `modelValue` | `string[]` | `null` | Array de valores (v-model) |
| `separator` | `string` | `null` | Caractere separador (ex: `','`) |
| `addOnBlur` | `boolean` | `false` | Adiciona chip ao perder foco |
| `allowDuplicate` | `boolean` | `true` | Permite duplicatas |
| `max` | `number` | `null` | Máximo de chips |
| `disabled` | `boolean` | `false` | Desabilita |
| `placeholder` | `string` | `null` | Placeholder |

**Slots:** `chip`
**Eventos:** `add`, `remove`

---

### MeterGroup

Grupo de medidores visuais (barras de progresso agrupadas).

**Docs PrimeVue:** [primevue.org/metergroup](https://primevue.org/metergroup/)

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `value` | `MeterItem[]` | `null` | Itens (`{ label, value, color, icon }`) |
| `min` | `number` | `0` | Valor mínimo |
| `max` | `number` | `100` | Valor máximo |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | Orientação |
| `labelPosition` | `'start' \| 'end'` | `'end'` | Posição das labels |

**Slots:** `label`, `meter`, `start`, `end`

---

### ProgressBar

Barra de progresso determinada ou indeterminada.

**Docs PrimeVue:** [primevue.org/progressbar](https://primevue.org/progressbar/)

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `value` | `number` | `null` | Progresso (0-100). `null` para indeterminado |
| `mode` | `'determinate' \| 'indeterminate'` | `'determinate'` | Modo |
| `showValue` | `boolean` | `true` | Exibe percentual |

---

### ProgressSpinner

Indicador de carregamento circular (spinner).

**Docs PrimeVue:** [primevue.org/progressspinner](https://primevue.org/progressspinner/)

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `strokeWidth` | `string` | `'2'` | Largura do traço |
| `fill` | `string` | `null` | Cor de preenchimento |
| `animationDuration` | `string` | `'2s'` | Duração da animação |

---

### ScrollTop

Botão flutuante "voltar ao topo" que aparece ao rolar para baixo.

**Docs PrimeVue:** [primevue.org/scrolltop](https://primevue.org/scrolltop/)

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `target` | `'window' \| 'parent'` | `'window'` | Alvo do scroll |
| `threshold` | `number` | `400` | Scroll em px para exibir o botão |
| `behavior` | `'smooth' \| 'auto'` | `'smooth'` | Comportamento do scroll |
| `icon` | `string` | `null` | Ícone personalizado |

---

### Skeleton

Placeholder de carregamento que simula a forma do conteúdo.

**Docs PrimeVue:** [primevue.org/skeleton](https://primevue.org/skeleton/)

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `shape` | `'rectangle' \| 'circle'` | `'rectangle'` | Formato |
| `size` | `string` | `null` | Tamanho para círculos (ex: `'3rem'`) |
| `width` | `string` | `'100%'` | Largura |
| `height` | `string` | `'1rem'` | Altura |
| `animation` | `'wave' \| 'none'` | `'wave'` | Animação |
| `borderRadius` | `string` | `null` | Borda arredondada |

---

### Tag

Tag/etiqueta colorida com ícone opcional.

**Docs PrimeVue:** [primevue.org/tag](https://primevue.org/tag/)

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `value` | `string` | `null` | Texto da tag |
| `severity` | `'success' \| 'secondary' \| 'info' \| 'warn' \| 'danger' \| 'contrast'` | `null` | Cor |
| `icon` | `string` | `null` | Ícone |
| `rounded` | `boolean` | `false` | Bordas arredondadas |

---

### Terminal

Emulador de terminal com comandos personalizáveis.

**Docs PrimeVue:** [primevue.org/terminal](https://primevue.org/terminal/)

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `welcomeMessage` | `string` | `null` | Mensagem inicial |
| `prompt` | `string` | `null` | Texto do prompt |

**Eventos:** `command` (recebe o texto do comando digitado)

---

## Por que Re-exportar?

A re-exportação resolve dois problemas:

1. **Centralização** — O projeto consumidor não precisa instalar o PrimeVue como dependência direta
2. **Compatibilidade com auto-import** — O `MaxComponentsUiResolver` resolve automaticamente esses componentes via `@maxvue/max-components-ui/prime`, evitando conflitos de importação

---

## Referência Completa

Para a API completa de cada componente (todas as props, eventos e slots), consulte a [documentação oficial do PrimeVue 4](https://primevue.org/).
