# Plano de Migração: MaxTable (independência do PrimeVue)

> Documento de planejamento. NÃO executa a migração. Nível: **muito_alta** (maior bloqueador da migração da biblioteca).
> Objetivo: remover a dependência de `primevue/datatable` e `primevue/column`, preservando 100% da API pública, estilos e comportamento.
> Este é um plano **autossuficiente**: um agente executor deve conseguir realizar a migração lendo apenas este arquivo + os fontes referenciados.

---

## 1. Componente

- **Nome:** `MaxTable`
- **Arquivo:** `src/components/MaxTable.vue`
- **Exports/aliases (em `src/index.ts`, linha ~94):**
  ```ts
  export { default as MaxTable } from './components/MaxTable.vue';
  export { default as MaxTableFields } from './components/MaxTableFields.vue';
  ```
  (`MaxTableColumn.vue` NÃO é exportado em `src/index.ts` — é um resíduo, ver seção 3.)
- **Conjunto a migrar JUNTO (obrigatório):** `MaxTable`, `MaxTableColumn`, `MaxTableFields`. Ver ordem e justificativa na seção 10.

### O que MaxTable é hoje
`MaxTable` é um **wrapper passthrough fino** sobre o `DataTable` do PrimeVue. Ele NÃO define props próprias: repassa TUDO via `v-bind="attrs"` (`useAttrs`) para o `DataTable`, e repassa dinamicamente TODOS os slots recebidos (`useSlots`) para o `DataTable`. A única lógica própria é:
- injetar `stripedRows` fixo no `DataTable`;
- tratamento especial do slot `buttons`: quando existe um slot chamado `buttons`, cria uma `<Column>` extra e mede a largura do conteúdo dos botões via `useElementSize`, expondo `width`.

Consequência-chave para a migração: **a "API pública" de `MaxTable` é, na prática, a API pública do `DataTable` do PrimeVue** (props, slots nomeados de coluna, eventos), porque tudo passa por `v-bind="attrs"`. Isso torna a substituição a de nível muito_alta.

---

## 2. Dependências do PrimeVue (trechos reais)

### 2.1. `src/components/MaxTable.vue`
Imports (linhas 19-20):
```ts
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
```

Uso no template (linhas 2-15):
```vue
<div class="max-table-main-div" >
    <DataTable v-bind="attrs" stripedRows >
        <template v-for="name in slotNames" #[name]="slotProps" :key="name">
            <slot :name="name" v-bind="slotProps || {}" v-if="name !== 'buttons'"></slot>
            <Column header="" v-if="slotNames.includes('buttons')" :style="`width: ${width}px; max-width: ${width}px;`">
                <template #body="{ data, index }">
                    <div class="max-table-buttons" ref="el">
                        <slot name="buttons" v-bind="{ data, index }" ></slot>
                    </div>
                </template>
            </Column>
        </template>
    </DataTable>
</div>
```

Notas sobre o DataTable usado (via `v-bind="attrs"`, portanto qualquer prop do DataTable é potencialmente usada pelos consumidores):
- `value` (array de dados) — prop padrão do DataTable.
- `stripedRows` — fixo no wrapper. O CSS depende das classes `.p-row-even` / `.p-row-odd` que o DataTable aplica.
- Slots de coluna: os consumidores passam `<Column>` como slot default, OU usam slots nomeados repassados. O padrão de uso real é definir colunas como filhos `<Column>` no consumidor (repassados via slot default) — mas o wrapper também repassa slots nomeados arbitrários.
- Classes CSS do DataTable das quais o estilo depende (ver seção 7): `.p-datatable`, `.p-datatable-table-container`, `.p-datatable-column-header-content`, `.p-datatable-column-title`, `.p-row-even`, `.p-row-odd`.

### 2.2. `src/components/MaxTableColumn.vue`
Template vazio. Import residual (linhas 6-9):
```ts
import _Column from 'primevue/column';
```
(importado como `_Column` e nunca usado — é dependência morta do PrimeVue, mas ainda importa `primevue/column`, o que quebra a independência enquanto o arquivo existir.)

### 2.3. `src/components/MaxTableFields.vue`
**NÃO depende do PrimeVue.** Já é uma implementação `<table>` HTML nativa própria. Depende apenas de componentes Max internos e helpers. Incluído no conjunto por coesão de domínio e porque compartilha os mesmos tokens de estilo (ver seção 3). Serve de **referência de implementação** para a nova camada visual de `MaxTable`.

---

## 3. Dependências internas

### 3.1. `useElementSize` (de `@maxvue/max-use`)
- **Origem:** `../MaxUse/src/Helpers/VueUse/index.ts` (linha ~270):
  ```ts
  /** Re-export de vueUseCore.useElementSize do VueUse. */
  export const useElementSize = vueUseCore.useElementSize;
  ```
- É apenas um re-export de `useElementSize` do **VueUse** (`@vueuse/core`). Retorna `{ width, height }` reativos de um elemento. **Não é dependência do PrimeVue** e deve ser MANTIDO exatamente como está.
- Uso em `MaxTable.vue` (linhas 29-41): mede a largura do `<div class="max-table-buttons" ref="el">` para dimensionar a `<Column>` de botões e expõe `width` via `defineExpose`.

### 3.2. `MaxTableColumn.vue`
- Não exportado em `src/index.ts`, não referenciado em nenhum `.vue`/`.ts` de `src/` (grep confirmado: 0 usos além do próprio arquivo). Contém apenas um `<style>` duplicado do de `MaxTable.vue` e um import morto de `primevue/column`.
- **Decisão:** durante a migração, este arquivo deve ser **esvaziado de PrimeVue** (remover `import _Column from 'primevue/column'`). O `<style>` que ele contém pode ser removido (é duplicado) OU mantido apenas se algum CSS global ainda depender dele — verificar via grep por `max-table-main-div` fora de `MaxTable.vue`. Não recriar dependência de PrimeVue aqui.

### 3.3. Dependências de `MaxTableFields.vue` (já livres de PrimeVue)
Componentes Max internos (todos já wrappers próprios / a serem migrados no seu próprio plano):
`MaxInputText`, `MaxInputNumber`, `MaxInputSelect`, `MaxInputDatePicker`, `MaxInputCheckbox`, `MaxInputTextArea`, `MaxInputAutoComplete`, `MaxInputAutoCompleteApi`, `MaxPhoneField`, `MaxIconButton`.
Helpers: `getCssSize` (`src/helpers/getCssSize`), `ulid`, `size`, `refAutoReset` (de `@maxvue/max-use`).
Tipos: `MaxTableColumn`, `MaxButtonsType` (de `src/types`).

### 3.4. Tipos relevantes (`src/types/index.ts`)
- `MaxTableColumn` (linha ~118): interface de coluna usada por `MaxTableFields` — `header`, `field`, `slot?`, `width?`, `minWidth?`, `maxWidth?`, `size?`, `align?`, `input?`, `options?`, `route?`, `data?`, `placeholder?`, `title?`, `style?`, `class?`, `required?`, `tooltip?`, `action?`.
- `MaxButtonsType` (linha ~15): `extends Omit<PrimeButtonProps, 'size' | 'iconPos'>`. ATENÇÃO: `PrimeButtonProps` é um tipo do PrimeVue. Isso é escopo de outro plano (migração de tipos/MaxButton), mas registrar aqui como ponto de atenção — a migração de `MaxTableFields` não introduz novo uso, apenas consome o tipo existente.

---

## 4. API pública a preservar

Como `MaxTable` faz `v-bind="attrs"` para o `DataTable`, a superfície a preservar é a do `DataTable` do PrimeVue que os consumidores efetivamente usam. Preservar TODAS as capacidades abaixo com o MESMO nome de prop/evento/slot:

### 4.1. Props (repassadas hoje via `attrs` ao DataTable)
Reimplementar suporte às props do DataTable comumente usadas. No mínimo:
- **Dados:** `value` (array de linhas).
- **Ordenação:** `sortMode` (`'single' | 'multiple'`), `sortField`, `sortOrder`, `defaultSortOrder`, `removableSort`, `multiSortMeta`. Colunas ordenáveis via `sortable` na coluna.
- **Paginação:** `paginator` (boolean), `rows`, `first`, `rowsPerPageOptions`, `totalRecords`, `lazy` (paginação/ordenação server-side), `paginatorPosition`.
- **Seleção:** `selection` (v-model), `selectionMode` (`'single' | 'multiple'`), `dataKey`, `metaKeySelection`. Colunas de seleção via `selectionMode` na coluna (checkbox/radio).
- **Scroll:** `scrollable`, `scrollHeight`, `frozenValue`/`frozen` de coluna, virtual scroll (`virtualScrollerOptions`) — ver seção 6 para escopo mínimo vs. completo.
- **Aparência:** `stripedRows` (fixo hoje), `rowClass`, `rowStyle`, `size`.
- **Estado vazio:** slot `empty`.

> IMPORTANTE: fazer um **levantamento real de uso** antes de implementar (seção 6, passo 0). Não é necessário reimplementar 100% do DataTable — apenas o subconjunto efetivamente consumido pelos apps `@maxvue`. Props não suportadas devem ser NO-OP graciosos, não erro.

### 4.2. Eventos
Preservar os eventos do DataTable usados: `@update:selection`, `@row-click`, `@row-select`, `@row-unselect`, `@sort`, `@page`, `@update:first`, `@update:rows`, `@update:sortField`, `@update:sortOrder`. Confirmar quais existem no levantamento (passo 0).

### 4.3. Slots (crítico)
- **Slots de coluna nomeados** repassados dinamicamente (`v-for="name in slotNames"`): preservar o comportamento de repassar qualquer slot nomeado.
- **Slot `body` de coluna** com `slotProps = { data, index }` (e demais props que o DataTable expõe: `field`, `frozenRow`, `column`, etc. — replicar os usados).
- **Slot `header` / `footer`** de coluna.
- **Slot especial `buttons`:** comportamento MANTIDO — cria coluna extra de ações, mede largura via `useElementSize` e usa `width` para dimensionar. `slotProps = { data, index }`.
- **Slot `empty`.**
- `defineExpose({ width })` — MANTER, pois consumidores podem referenciar.

### 4.4. Estrutura de definição de coluna
Hoje as colunas são passadas como `<Column>` (PrimeVue) no slot default do consumidor. Após a migração NÃO existirá mais `primevue/column`. **Decisão de design (seção 5):** substituir por `MaxTableColumn` próprio (reaproveitando o arquivo residual), com props equivalentes (`field`, `header`, `sortable`, `selectionMode`, `style`, `frozen`, slots `body`/`header`/`footer`). A camada `MaxTable` coleta essas definições de coluna e as entrega ao TanStack Table.

---

## 5. Estratégia de substituição

**Adotar `@tanstack/vue-table` (TanStack Table v8, headless) como motor de estado/lógica, e construir a camada visual (`<table>` HTML nativo) por cima**, reaproveitando o CSS e a estrutura já provada em `MaxTableFields.vue`.

Racional:
- TanStack Table é **headless**: fornece ordenação, paginação, seleção de linha e modelos de dados sem impor DOM/estilo. Isso permite manter 100% do CSS atual (classes remapeadas de `.p-*` para classes próprias).
- `MaxTableFields.vue` já é a prova de que uma `<table>` HTML nativa com o mesmo CSS produz o layout desejado — reutilizar essa base visual.
- `useElementSize` continua controlando a largura da coluna de botões.

### 5.1. Dependência a adicionar
`@tanstack/vue-table` (v8). Adicionar em `dependencies` do `package.json`. É leve, tree-shakeable e sem CSS próprio.

### 5.2. Mapeamento de colunas (PrimeVue `<Column>` → TanStack `ColumnDef` + `MaxTableColumn` slots)

| Conceito PrimeVue `<Column>` | Equivalente na nova arquitetura |
|---|---|
| `field="user.name"` | `ColumnDef.accessorKey` / `accessorFn` (suportar notação com ponto — reusar `getFieldValue` de `MaxTableFields`) |
| `header="Nome"` / slot `#header` | `ColumnDef.header` + slot `header-<field>` |
| slot `#body="{ data, index }"` | render de célula via slot nomeado do `MaxTableColumn`, passando `{ data, index, field, value }` |
| `sortable` | habilita `enableSorting` no `ColumnDef`; header clicável dispara `column.toggleSorting()` |
| `selectionMode="single|multiple"` | coluna especial de seleção usando `getIsSelected` / `toggleSelected` do TanStack; ou modelo `rowSelection` |
| `style` / `:style` largura | `ColumnDef.meta.style` aplicado ao `<th>`/`<td>` (reusar `getColumnStyle`/`getCssSize`) |
| slot especial `buttons` | coluna de ações extra, largura via `useElementSize` (comportamento atual mantido) |

Duas rotas possíveis para **coletar** as definições de coluna (escolher no passo 1 conforme o levantamento):
- **Rota A (compatível com o uso atual):** manter a API declarativa `<MaxTable><MaxTableColumn field=.. header=.. #body=.. /></MaxTable>`. `MaxTable` inspeciona os VNodes/slots filhos para montar os `ColumnDef`. Preserva melhor os consumidores existentes. Mais complexo (leitura de slot default e extração de props/slots dos filhos).
- **Rota B (prop `columns`):** aceitar `:columns="MaxTableColumn[]"` como `MaxTableFields` já faz. Mais simples, porém pode exigir refactor dos consumidores. Adotar apenas se o levantamento (passo 0) mostrar que o uso via prop é viável/predominante.

> Recomendação: **Rota A** para preservar API pública, com fallback à Rota B se algum consumidor já usar `columns`.

### 5.3. Estado gerenciado pelo TanStack
- `getCoreRowModel`, `getSortedRowModel`, `getPaginationRowModel` (se `paginator`), `getFilteredRowModel` (se filtros forem usados).
- Estado controlado/sincronizado com props (`sortField`/`sortOrder` ↔ `sorting`, `first`/`rows` ↔ `pagination`, `selection` ↔ `rowSelection`) via `v-model`/emits para preservar a API de eventos do DataTable.
- Modo `lazy`: quando ativo, desabilitar os row models client-side (`manualSorting`, `manualPagination`) e emitir `@sort`/`@page` para o consumidor tratar server-side.

---

## 6. Passos de implementação

**Passo 0 — Levantamento de uso real (OBRIGATÓRIO antes de codar).**
- Fazer grep nos apps consumidores (`@maxvue`) e no `playground/` por `<MaxTable`, `<Column`, `sortable`, `paginator`, `rows=`, `selection`, `scrollable`, `#buttons`, `#body`, `@row-`, `@sort`, `@page`.
- Produzir a lista EXATA de props/eventos/slots efetivamente usados. Só reimplementar esse subconjunto (mais os no-ops graciosos). Isso define o escopo e evita reimplementar o DataTable inteiro.

**Passo 1 — Definir a arquitetura de colunas.** Decidir Rota A vs. Rota B (seção 5.2) com base no passo 0. Especificar as props/slots de `MaxTableColumn` (novo componente próprio).

**Passo 2 — Adicionar dependência.** `@tanstack/vue-table` em `package.json` (`dependencies`). Rodar `npm install`.

**Passo 3 — Reimplementar `MaxTableColumn.vue`.**
- Remover `import _Column from 'primevue/column'`.
- Transformá-lo num componente de definição de coluna próprio (`<script setup lang="ts">`, props tipadas: `field`, `header`, `sortable?`, `selectionMode?`, `style?`, `frozen?`, `align?`, `width?`; slots `body`, `header`, `footer`). Se for Rota A, ele funciona como marcador declarativo cujos props/slots `MaxTable` lê; se Rota B, pode ser dispensado.
- Remover o `<style>` duplicado (verificar antes se algum CSS global depende dele).

**Passo 4 — Reimplementar `MaxTable.vue` (núcleo).**
- Remover imports `primevue/datatable` e `primevue/column`.
- Manter `useAttrs`, `useSlots`, `useElementSize` e o padrão de repassar slots nomeados.
- Criar tabela TanStack via `useVueTable({ data, columns, getCoreRowModel, ... })`.
- Renderizar `<table>` HTML nativo (base visual copiada de `MaxTableFields.vue`), com `<thead>`/`<tbody>` iterando `table.getHeaderGroups()` / `table.getRowModel().rows`.
- **Ordenação:** `<th>` de coluna `sortable` clicável chamando `header.column.getToggleSortingHandler()`; indicar direção com ícone (reusar `MaxIconButton` ou ícone existente).
- **Seleção:** coluna de seleção com checkbox/radio ligados a `row.getToggleSelectedHandler()` / `table.getToggleAllRowsSelectedHandler()`; sincronizar `rowSelection` ↔ prop `selection` via emit `update:selection`.
- **Paginação:** se `paginator`, renderizar controles (reusar componentes Max de botão) chamando `table.setPageIndex`, `nextPage`, `previousPage`; sincronizar `first`/`rows`. Considerar um `MaxPaginator` interno pequeno.
- **Scroll:** `scrollable` + `scrollHeight` → container com `overflow: auto` e `max-height` (o CSS atual já usa `overflow: hidden` + grid; adaptar). Cabeçalho sticky já existe no CSS (`position: sticky`).
- **Slot `buttons`:** replicar o bloco atual — coluna extra de ações, `ref="el"` no wrapper `.max-table-buttons`, `useElementSize` → `width`, `defineExpose({ width })`.
- **Slot `empty`:** renderizar quando `getRowModel().rows.length === 0` (espelhar `MaxTableFields`).
- Notação com ponto em `field`: reusar/portar `getFieldValue` de `MaxTableFields`.

**Passo 5 — Virtual scroll (condicional).** Só se o passo 0 mostrar uso de `virtualScrollerOptions`/grandes datasets. Nesse caso integrar `@tanstack/vue-virtual` OU `vue-virtual-scroller` (ver skill de virtual scroller na seção 9) com os composables headless para preservar a `<table>` semântica. Se não houver uso, deixar como no-op documentado.

**Passo 6 — Remapear classes CSS.** Substituir seletores `.p-datatable*`, `.p-row-even`, `.p-row-odd`, `.p-datatable-column-header-content`, `.p-datatable-column-title` por classes próprias equivalentes, aplicadas no novo template (ver seção 7). Manter TODOS os tokens de cor/espaçamento idênticos.

**Passo 7 — Atualizar exports/manifest.** Se `MaxTableColumn` passar a ser público, exportá-lo em `src/index.ts` e rodar:
```bash
npx tsx src/scripts/generateResolver.ts
```
para regenerar `src/components-manifest.json`.

**Passo 8 — Remover PrimeVue residual.** Confirmar por grep que `primevue/datatable` e `primevue/column` não são mais importados em `src/`.

---

## 7. Estilos

Estratégia: **preservar 100% dos tokens visuais**; apenas trocar os seletores acoplados ao PrimeVue por classes próprias no novo `<table>`.

Tokens/estruturas a manter idênticos (de `MaxTable.vue` e `MaxTableFields.vue`):
- Wrapper: `border-radius: 1rem`, `border: 1px solid var(--background-300)`, `overflow: hidden`, grid `grid-template-rows: 40px 1fr` (header 40px + corpo).
- Cabeçalho (`<thead>`/`<tr>`/`<th>`): `background-color: var(--blue-800)`, texto `var(--blue-200)`, `font-family: Jost, sans-serif`, `font-weight: 400`, células `flex-grow: 1`, `place-items: center`, altura 40px, sticky.
- Corpo listrado: linha par `var(--primary-25)`, linha ímpar `var(--primary-100)`. Hoje via `.p-row-even`/`.p-row-odd`. **Substituir** por classes próprias `max-table-row-even`/`max-table-row-odd` (como `MaxTableFields` já faz: `max-table-fields-row-even`/`-odd`), aplicadas por `:class` com base no índice.
- Células (`td`): `flex-grow: 1`, `padding: 0`, `display: grid; place-items: center`, `border: none`. Regra especial para inputs dentro da célula: `.max-input-main-div { grid-template-rows: 1fr; .message-spacer, .input-message { display: none } }` — MANTER.
- `.max-table-buttons`: `display: flex; flex-direction: row; gap: 8px; padding: 0 6px`.

Tabela de remapeamento de seletores:

| Seletor atual (PrimeVue) | Novo seletor próprio |
|---|---|
| `.p-datatable` | `.max-table` |
| `.p-datatable-table-container` | `.max-table-container` |
| `.p-datatable-column-header-content` | `.max-table-th-content` |
| `.p-datatable-column-title` | `.max-table-th-title` |
| `.p-row-even` | `.max-table-row-even` |
| `.p-row-odd` | `.max-table-row-odd` |

Notas:
- Remover os `!important` que existiam apenas para vencer a especificidade do CSS do PrimeVue — com DOM próprio eles deixam de ser necessários (limpeza recomendada, mas validar visualmente).
- Manter `<style lang="scss">` (não scoped, como hoje, pois há dependência de estrutura interna), 4 espaços de indentação, aspas simples.
- Reutilizar `getColumnStyle` + `getCssSize` (de `MaxTableFields`/`src/helpers/getCssSize`) para largura/alinhamento de coluna.

---

## 8. Testes / verificação

- **Novos testes** em `tests/components/MaxTable.test.ts` (Vitest + `@vue/test-utils` + `happy-dom`; setup global em `tests/setup.ts` já provê PrimeVue+Pinia e stubs — manter). Cobrir:
  - Renderiza cabeçalhos a partir das colunas.
  - Renderiza linhas a partir de `value`, com classes `max-table-row-even`/`-odd` alternadas.
  - Slot `body` recebe `{ data, index }` corretos; notação com ponto em `field` resolve valores aninhados.
  - Ordenação: clique no `<th>` sortable alterna direção e reordena; emite `@sort` (quando `lazy`).
  - Paginação: `paginator` limita linhas por `rows`; navegação atualiza `first`; emite `@page`.
  - Seleção: `selectionMode` single/multiple atualiza `selection` e emite `@update:selection`.
  - Slot `buttons`: cria coluna extra e `defineExpose({ width })` fica reativo (mockar `useElementSize`).
  - Slot `empty` aparece quando `value` vazio.
- **Snapshot/estrutura:** garantir que as classes de estilo esperadas estão presentes (proteção do CSS).
- **Comandos:**
  ```bash
  npx vitest run tests/components/MaxTable.test.ts
  npm run type-check   # vue-tsc — garantir tipos sem PrimeVue
  npm run test         # suíte completa
  npm run build        # confirmar build multi-entry OK
  ```
- **Verificação manual:** `npm run dev:playground` — comparar visualmente ordenação, paginação, seleção, scroll sticky, coluna de botões e listras antes/depois.
- **Confirmação de independência:** `grep -rn "primevue/datatable\|primevue/column" src/` deve retornar vazio.

---

## 9. Skills necessárias

Selecionadas de `.claude/skills/` (apenas as relevantes; prefixo `vue-`):

1. **`.claude/skills/vue-max-components-ui-development-best-practices/SKILL.md`**
   Justificativa: convenções OBRIGATÓRIAS da biblioteca — `<script setup lang="ts">`, 4 espaços, aspas simples, ordem Template→Script→Style, uso de `<style lang="scss">`, regeneração do resolver (`generateResolver.ts`) e padrões de teste. Governa como escrever os 3 componentes.

2. **`.claude/skills/vue-3-dynamic-components-and-keep-alive-caching-best-practices/SKILL.md`**
   Justificativa: `MaxTable` repassa slots dinâmicos e (na Rota A) precisa inspecionar/renderizar VNodes de coluna dinamicamente; orienta `<component :is>`, `shallowRef`/`markRaw` para performance e tipagem forte de mapeamentos — útil para o renderer de células/colunas.

3. **`.claude/skills/vue-virtual-scroller-best-practices/SKILL.md`** (condicional — só no Passo 5)
   Justificativa: se houver `virtualScrollerOptions`/datasets grandes, orienta virtualização preservando `<table>` semântica via composables headless (`useRecycleScroller`/`useDynamicScroller`), compatível com a camada visual própria sobre TanStack.

4. **`frontend-design:frontend-design` (Skill)** (opcional)
   Justificativa: apoio à camada visual (paginador/indicadores de ordenação) quando novos controles de UI precisarem de acabamento consistente com o tema Max.

---

## 10. Riscos e pontos de atenção

- **ORDEM E ACOPLAMENTO (crítico):** `MaxTable`, `MaxTableColumn` e `MaxTableFields` formam UM CONJUNTO e devem ser migrados/entregues JUNTOS, num único PR:
  1. `MaxTableColumn.vue` — remover `import _Column from 'primevue/column'` (mata a dependência morta) e transformá-lo no componente de coluna próprio.
  2. `MaxTable.vue` — reimplementar sobre TanStack + `<table>` própria.
  3. `MaxTableFields.vue` — já livre de PrimeVue; revisar apenas para compartilhar `getFieldValue`/`getColumnStyle`/classes com a nova `MaxTable` e evitar divergência de estilo.
  Migrar isoladamente quebra consumidores (colunas `<Column>` deixam de existir sem substituto).

- **API implícita via `v-bind="attrs"`:** o maior risco é regressão silenciosa — props/eventos do DataTable que algum app usa e que não forem reimplementados. Mitigação: Passo 0 (levantamento real) é obrigatório; props não suportadas devem ser no-op gracioso, nunca erro.

- **`MaxButtonsType extends Omit<PrimeButtonProps, ...>`** (`src/types`) ainda referencia tipo do PrimeVue. Fora do escopo direto deste plano (é do plano de `MaxButton`/tipos), mas a independência TOTAL da biblioteca só se completa quando esse tipo também for desacoplado. Registrar como dependência cruzada.

- **CSS acoplado a classes `.p-*`:** o estilo depende de classes internas do DataTable (`.p-row-even`, `.p-datatable-column-*`). Ao trocar o DOM, TODAS precisam ser remapeadas (seção 7); esquecer alguma quebra listras/cabeçalho silenciosamente. Cobrir com testes de estrutura.

- **`!important` legado:** existe para vencer o CSS do PrimeVue; com DOM próprio deve ser removido, mas fazê-lo sem validação visual pode alterar layout. Remover incrementalmente e validar no playground.

- **Seleção/ordenação/paginação server-side (`lazy`):** se apps usam modo lazy, o TanStack deve rodar em modo manual (`manualSorting`/`manualPagination`) e apenas emitir eventos — não reordenar/paginar client-side. Confundir os modos causa dupla ordenação ou dados errados.

- **`useElementSize` + timing:** o cálculo de `width` da coluna de botões depende de o elemento estar montado e visível (watch com guarda `width.value > 1`). Manter a lógica de guarda atual para evitar recalculo/oscilação. Em testes, mockar `useElementSize`.

- **Regenerar o manifest:** se `MaxTableColumn` virar público, esquecer de rodar `generateResolver.ts` quebra o auto-import nos apps consumidores.

- **Peso/bundle:** `@tanstack/vue-table` é headless e leve, mas confirmar que entra apenas no entry `index.es.js` e é tree-shakeable; não deve vazar para `preset`/`resolver`/`prime`.
