# Referência de Tipos TypeScript

Tipos e interfaces exportados por `@maxvue/max-components-ui`.

```typescript
import type {
  BaseComponentProps,
  ButtonProps,
  ComponentEmits,
  SelectItem,
  SelectOptions,
  SelectGroupOptions,
  SelectGroupOptionsElement,
  MaxTableColumn,
  MaxTableButtons
} from '@maxvue/max-components-ui'
```

---

## BaseComponentProps

Propriedades base compartilhadas por todos os componentes.

```typescript
interface BaseComponentProps {
  /** Classe CSS personalizada */
  class?: string
  /** Estilo CSS em linha ou objeto */
  style?: string | Record<string, any>
}
```

---

## ButtonProps

Propriedades do componente `MaxButton`. Estende `BaseComponentProps`.

```typescript
interface ButtonProps extends BaseComponentProps {
  /** Texto de exibição do botão */
  label?: string
  /** Ícone a ser exibido (ex: 'mdi:home') */
  icon?: string
  /** Estilo de severidade */
  severity?: 'secondary' | 'success' | 'info' | 'warning' | 'help' | 'danger' | 'contrast'
  /** Tamanho do botão */
  size?: 'small' | 'large'
  /** Desabilita o botão */
  disabled?: boolean
  /** Estado de carregamento */
  loading?: boolean
  /** Variante visual */
  variant?: 'outlined' | 'text' | 'link'
}
```

---

## ComponentEmits

Eventos comuns emitidos pelos componentes.

```typescript
interface ComponentEmits {
  /** Emitido quando o componente é clicado */
  click: [event: MouseEvent]
}
```

---

## SelectItem

Representa um item de uma lista de seleção (`MaxInputSelect`).

```typescript
interface SelectItem {
  /** Valor do item (usado como identificador) */
  value: string | number | null | boolean
  /** Nome exibido na opção */
  name?: string | null
  /** Label alternativo */
  label?: string | null
  /** Sub-label (exibido como texto secundário) */
  subLabel?: string | null
  /** Ícone Iconify (ex: 'mdi:star') */
  icon?: string | null
  /** Desabilita o item */
  disabled?: boolean
  /** Marca o item como selecionado */
  selected?: boolean
  /** Cor personalizada do item */
  color?: string | null
  /** Tamanho do ícone */
  size?: string | null
  /** Alinhamento do texto */
  text_align?: 'left' | 'center' | 'right'
  /** Código DDI (para itens de telefone) */
  ddi?: string | number | null
  /** Sigla do país */
  sigla?: string | null
  /** Valor mínimo */
  min?: string | number | null
  /** Valor máximo */
  max?: string | number | null
  /** Número de fases */
  fases?: string | number | null
}
```

---

## SelectOptions

Array de itens de seleção simples.

```typescript
interface SelectOptions extends Array<SelectItem> {}
```

### Exemplo de uso

```typescript
const opcoes: SelectOptions = [
  { value: 1, name: 'Opção A', icon: 'mdi:star' },
  { value: 2, name: 'Opção B', subLabel: 'Detalhe' },
  { value: 3, name: 'Opção C', disabled: true }
]
```

---

## SelectGroupOptionsElement

Um grupo de opções dentro do `SelectGroupOptions`.

```typescript
interface SelectGroupOptionsElement {
  /** Label do grupo */
  label: string
  /** Itens dentro do grupo */
  items: SelectItem[]
}
```

---

## SelectGroupOptions

Array de grupos de opções (para selects agrupados).

```typescript
interface SelectGroupOptions extends Array<SelectGroupOptionsElement> {}
```

### Exemplo de uso

```typescript
const grupos: SelectGroupOptions = [
  {
    label: 'Frutas',
    items: [
      { value: 'maca', name: 'Maçã' },
      { value: 'banana', name: 'Banana' }
    ]
  },
  {
    label: 'Legumes',
    items: [
      { value: 'cenoura', name: 'Cenoura' },
      { value: 'batata', name: 'Batata' }
    ]
  }
]
```

---

## MaxTableColumn

Definição de coluna para os componentes `MaxTableFields` e `MaxTableColumn`.

```typescript
interface MaxTableColumn {
  /** Texto do cabeçalho da coluna */
  header: string
  /** Campo do objeto a ser exibido na célula (suporta notação com ponto: 'user.name') */
  field: string
  /** Nome do slot customizado para renderizar o conteúdo */
  slot?: string
  /** Largura da coluna (ex: '100px', '20%') */
  width?: string
  /** Largura mínima */
  minWidth?: string
  /** Largura máxima */
  maxWidth?: string
  /** Tamanho da coluna (alias para width) */
  size?: string
  /** Alinhamento do conteúdo */
  align?: 'left' | 'center' | 'right'
  /** Tipo de input editável na célula */
  input?:
    | 'text'
    | 'input'
    | 'checkbox'
    | 'select'
    | 'date'
    | 'number'
    | 'increment'
    | 'textarea'
    | 'phone-number'
    | 'auto-complete'
    | 'auto-complete-api'
  /** Opções para input do tipo 'select' */
  options?: any[]
  /** Rota para navegação ao clicar (auto-complete-api) */
  route?: string
  /** Dados extras resolvidos da linha atual */
  data?: string | Record<string, any>
  /** Texto do placeholder */
  placeholder?: string
  /** Título alternativo para o cabeçalho */
  title?: string
  /** Estilo CSS do cabeçalho */
  style?: object
  /** Classe CSS do cabeçalho */
  class?: string | object
  /** Campo obrigatório */
  required?: boolean
  /** Exibir tooltip no hover */
  tooltip?: boolean
  /** Callback executado quando o valor do campo mudar */
  action?: (data: { row: any; field: string; value: any }) => void
}
```

### Exemplo: tabela editável com MaxTableFields

```vue
<template>
  <MaxTableFields :list="produtos" :columns="colunas" :buttons="botoes" />
</template>

<script setup lang="ts">
import type { MaxTableColumn, MaxTableButtons } from '@maxvue/max-components-ui'

const colunas: MaxTableColumn[] = [
  { header: 'Nome', field: 'name', input: 'text', size: '200px' },
  { header: 'Qtd', field: 'quantity', input: 'increment', size: '150px' },
  { header: 'Categoria', field: 'category', input: 'select', options: [...] },
  { header: 'Preço', field: 'price', align: 'right' }
]

const botoes: MaxTableButtons[] = [
  { icon: 'mdi:pencil', tooltip: 'Editar', action: (data) => editar(data) },
  { icon: 'mdi:delete', tooltip: 'Excluir', action: (data) => excluir(data) }
]
</script>
```

---

## MaxTableButtons

Definição de botão de ação para a coluna de botões do `MaxTableFields`.

```typescript
interface MaxTableButtons {
  /** Identificador único do botão */
  id?: string | number
  /** Tamanho do ícone */
  size?: number | string
  /** Ícone principal */
  icon?: string
  /** Alias para o ícone */
  i?: string
  /** Ícone à esquerda */
  iconLeft?: string
  /** Ícone à direita */
  iconRight?: string
  /** Tamanho do ícone (alias) */
  sizeIcon?: number | string
  /** Tamanho do ícone (alias) */
  iconSize?: number | string
  /** Rota para navegação */
  route?: string | null
  /** Parâmetros de rota */
  params?: any
  /** Dados extras passados ao callback ou rota */
  data?: any
  /** Query params */
  query?: any
  /** Ícone escuro */
  dark?: boolean | string | number
  /** Ícone claro */
  light?: boolean | string | number
  /** Label textual do botão */
  label?: string
  /** Tooltip exibido no hover */
  tooltip?: string | null
  /** Callback executado ao clicar */
  action?: (data?: any) => void
}
```
