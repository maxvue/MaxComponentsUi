# MaxListBox — Design

Data: 2026-08-10
Status: aprovado (aguardando plano de implementação)

## Objetivo

Criar `MaxListBox`, uma lista de seleção sempre visível, usada como **painel de navegação/seleção de registros** em layouts mestre-detalhe. O componente exibe itens ricos (ícone, label, sublabel, badge), oferece filtro, virtualização automática para listas grandes e carregamento paginado por scroll infinito quando alimentado por API.

Inspirado no `Listbox` do PrimeVue, mas **implementado de forma nativa**, sem dependência do PrimeVue — a biblioteca está em migração para se tornar independente dele (ver `status-primevue.migration.yaml`), e o comportamento de paginação + virtualização condicional já fugiria da API do componente original.

## Escopo

Incluído: seleção única, filtro local e server-side, virtual scroll, scroll infinito paginado, navegação por teclado, slots de customização, testes e demo no playground.

Fora de escopo: seleção múltipla com checkboxes, agrupamento de opções (`optionGroup`), drag-and-drop de reordenação. A API é desenhada para não impedir a adição futura de seleção múltipla, mas ela não faz parte desta entrega.

## Arquivos

| Arquivo | Papel |
|---------|-------|
| `src/components/MaxListBox.vue` | Componente |
| `src/composables/useVirtualList.ts` | Virtualização isolada e testável |
| `src/types` | `ListBoxOption`, `LoadOptionsResult` exportados |
| `src/index.ts` | Export + aliases `MaxListBox` / `ListBox` / `Listbox` |
| `src/components-manifest.json` | Regenerado via `npx tsx src/scripts/generateResolver.ts` |
| `tests/components/MaxListBox.test.ts` | Testes do componente |
| `tests/composables/useVirtualList.test.ts` | Testes da virtualização |
| playground | Demo: local, filtro, virtual scroll, API paginada |

O componente é **autônomo**: não é envolvido por `InputBase`. Como painel mestre-detalhe ele não é um campo de formulário — não precisa de `FloatLabel`, `IconField` nem linha de mensagem. A regra do `CLAUDE.md` que exige `InputBase` se aplica a inputs de formulário.

## Estrutura do template

```
<div class="max-listbox">
  [slot #header | título opcional via prop]
  [MaxInputSearch]                         ← quando :filter
  <ul class="max-listbox-list" role="listbox" tabindex="0" @scroll @keydown>
    <li role="option" v-for="item in itens visíveis">
      <slot name="option" :option :selected :index>
        ícone + label + (sublabel | badge)   ← default
      </slot>
    </li>
    [loader da próxima página | rodapé de erro com retry]
    [slot #empty | emptyMessage]
  </ul>
  [slot #footer]
</div>
```

Reutiliza `MaxInputSearch`, `MaxIcon` e `MaxBadgeComponent`. A virtualização vive no composable `useVirtualList(items, itemHeight, containerRef)`, que devolve `{ visibleItems, offsetY, totalHeight, onScroll }`, para manter o SFC pequeno e a lógica testável isoladamente.

## API pública

### Props

```ts
modelValue: any = null             // valor selecionado; null quando nada selecionado
selectedOption?: any               // objeto já resolvido pela app (ver "Seleção")
options?: any[]                    // lista local
loadOptions?: (ctx: { page: number; search: string })
    => Promise<{ items: any[]; hasMore?: boolean; total?: number }>
optionValue?: string = 'value'
optionLabel?: string = 'label'
optionSubLabel?: string = 'sub_label'
optionDisabled?: string = 'disabled'
filter?: boolean = false           // exibe MaxInputSearch
filterPlaceholder?: string = 'Buscar...'
filterFields?: string[]            // campos do filtro local (default: label + sublabel)
virtualScroll?: boolean            // undefined = automático acima do threshold
virtualScrollThreshold?: number = 500
itemHeight?: number = 44           // altura fixa da linha, exigida pela virtualização
pageSize?: number = 50             // enviado ao loadOptions
twoLines?: boolean = false         // sublabel abaixo do label em vez de à direita
emptyMessage?: string = 'Nenhum registro encontrado'
disabled?: boolean = false
loading?: boolean = false          // loading controlado externamente
title?: string
height?: string                    // ex.: '400px'; default 100% do container
```

### Emits

```ts
'update:modelValue'  // valor selecionado, ou null
'change'             // { value, option } — objeto completo, útil no mestre-detalhe
'filter'             // termo digitado (após debounce de 300ms)
'load-error'         // erro vindo do loadOptions
```

### Slots

`option` (`{ option, selected, index }`), `header`, `footer`, `empty`, `loader`.

## Comportamento

### Modos de dados

`options` e `loadOptions` são mutuamente exclusivos: se `loadOptions` está definido, ele manda e `options` é ignorado. A lista de trabalho é uma única ref interna — no modo local espelha `options` filtrado; no modo API acumula as páginas recebidas.

### Scroll infinito (modo API)

No `@scroll` do `<ul>`, quando faltar menos de ~2 alturas de viewport para o fim, `hasMore !== false` e não houver requisição em voo, dispara `loadOptions({ page: page + 1, search })` e concatena os itens.

`hasMore` vem da resposta. Se a API devolve apenas `total`, é derivado como `carregados < total`. Página vazia encerra o carregamento. Em caso de erro: emite `load-error`, interrompe o auto-load e exibe rodapé de erro com retry — o clique refaz a **mesma** página.

### Filtro

Debounce de 300ms, alinhado ao `MaxInputSearch`.

- **Modo API**: zera a lista, `page = 1`, `hasMore = true` e refaz a busca com `ctx.search`. Respostas fora de ordem são descartadas por um contador de requisição.
- **Modo local**: filtragem em memória, case- e acento-insensível, sobre `filterFields` (default: label + sublabel).

### Virtual scroll

Ativo quando `virtualScroll === true`, ou quando é `undefined` e a lista ultrapassa `virtualScrollThreshold` (500 itens). A janela é calculada por `itemHeight`, com overscan de 5 itens acima e abaixo; deslocamento por `translateY` e altura total aplicada ao container de rolagem.

Exige altura de linha fixa — daí `itemHeight`. Com `twoLines`, o consumidor ajusta o valor.

### Seleção

Clique seleciona, emite `update:modelValue` e `change`. Nada selecionado é representado por `null`, tanto no default do prop quanto ao limpar a seleção.

Itens com `disabled: true` (campo configurável por `optionDisabled`) são renderizados esmaecidos, não recebem seleção e não emitem eventos.

`selectedOption` cobre a lacuna do modo API: quando o `modelValue` inicial aponta para um registro ainda não carregado, o objeto passado pela app é usado para exibir a seleção imediatamente. Quando o registro real chega em alguma página, ele passa a ser a fonte. Serve também como fallback no modo local quando o valor não está entre as opções.

### Teclado e acessibilidade

Setas ↑/↓ movem o item em foco, rolando a lista para mantê-lo visível; Enter e Espaço selecionam; Home/End vão aos extremos. O `<ul>` tem `role="listbox"` e recebe o foco (tabindex roving — os `<li>` não são focáveis individualmente); cada `<li>` tem `role="option"`, `aria-selected` e `aria-disabled`.

### Estados

- **Loading inicial**: loader no lugar da lista.
- **Loading incremental**: loader no rodapé da lista.
- **Vazio**: slot `empty` ou `emptyMessage`.
- **Disabled**: painel inteiro não interativo.

## Estilo

SCSS com escopo em `.max-listbox`, usando variáveis do tema Max e reaproveitando a estética de `.label_div` do `MaxInputSelect`:

- item selecionado: `--blue-600` (hover `--blue-700`), texto `--background-0`
- hover neutro: `--background-300`
- sublabel: `--background-600`; label: `--background-750`
- scrollbar fina de 3px

Convenções: indentação de 4 espaços, aspas simples, ponto e vírgula obrigatório, ordem Template → Script → Style.

## Testes

`tests/components/MaxListBox.test.ts`:

- renderiza `options` locais e respeita `optionLabel` / `optionValue` / `optionSubLabel`
- clique emite `update:modelValue` e `change` com o objeto; item `disabled` não emite
- `modelValue` marca `aria-selected`; sem seleção o valor é `null`
- `selectedOption` exibe seleção com valor ausente da lista
- filtro local: debounce, case/acento-insensível, `emptyMessage` quando nada casa
- filtro API: reseta página, envia `search`, descarta resposta fora de ordem
- scroll infinito: dispara próxima página perto do fim, para com `hasMore: false`, não duplica requisição em voo
- `load-error` em falha; retry refaz a mesma página
- teclado: ↑/↓ movem foco, Enter seleciona, Home/End
- slots `option`, `header`, `footer`, `empty`

`tests/composables/useVirtualList.test.ts`: janela correta por `scrollTop`, overscan, altura total, e lista menor que o viewport.

## Execução

Conforme o `CLAUDE.md`, a implementação deve ocorrer em um **git worktree separado** (`git worktree add ../MaxComponentsUi-wt-max-listbox -b max-listbox`), validada isoladamente e só então integrada.
