# Plano de Migração — MaxTableColumn

> Documento de PLANEJAMENTO. Não modifica código-fonte. Objetivo: tornar `MaxTableColumn`
> independente do PrimeVue preservando API pública, estilos e comportamento.
> Fonte real referenciada: `src/components/MaxTableColumn.vue`,
> `src/components/MaxTable.vue`, `src/components/MaxTableFields.vue`,
> `src/types/index.ts`.

---

## 1. Componente

- **Nome:** `MaxTableColumn`
- **Nível de dificuldade:** `muito_alta`
- **Arquivo:** `/home/johnattas/GitHub/MaxComponentsUi/src/components/MaxTableColumn.vue`
- **Papel atual:** Wrapper fino de `Column` do PrimeVue, fortemente acoplado ao
  `DataTable` (via `MaxTable.vue`). Serve como definição declarativa de coluna
  dentro do slot default de um `DataTable`.

**Observação crítica sobre o estado atual do arquivo.** O `<template>` de
`MaxTableColumn.vue` está **VAZIO** (linhas 1–4). O bloco `<script setup>`
apenas importa `Column` sem exportá-lo nem usá-lo:

```vue
<template>


</template>

<script setup lang="ts">
    import _Column from 'primevue/column';
</script>
```

Todo o `<style lang="scss">` do arquivo (linhas 12–139) é CSS **global** (não
`scoped`) que estiliza o `.p-datatable` renderizado pelo `MaxTable`/PrimeVue.
Ou seja, na prática, `MaxTableColumn.vue` hoje **não renderiza nada** — ele
existe como (a) ponto de importação de `Column` e (b) folha de estilo global
para a tabela PrimeVue. As colunas reais são criadas dentro de `MaxTable.vue`
(que importa `Column` diretamente) e via slots.

Consequência para a migração: **não há um contrato de props próprio a preservar
no arquivo `MaxTableColumn.vue`** — o "contrato de coluna" real do ecossistema
Max vive em duas frentes:
1. Os slots nomeados repassados ao `DataTable` em `MaxTable.vue` (API PrimeVue).
2. A interface `MaxTableColumn` de `src/types/index.ts`, consumida por
   `MaxTableFields.vue` (motor de tabela **já sem PrimeVue**, baseado em
   `<table>` nativo).

---

## 2. Dependências do PrimeVue (trechos reais)

### 2.1 Em `MaxTableColumn.vue`

```ts
// src/components/MaxTableColumn.vue, linha 7
import _Column from 'primevue/column';
```

Importação não utilizada (prefixo `_`), mas é a única dependência direta de
PrimeVue no arquivo. Precisa ser removida.

### 2.2 Em `MaxTable.vue` (acoplamento — o consumidor real de `Column`)

```ts
// src/components/MaxTable.vue, linhas 19–20
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
```

Uso de `Column` no template (coluna de botões gerada automaticamente):

```vue
<!-- src/components/MaxTable.vue, linhas 6–12 -->
<Column header="" v-if="slotNames.includes('buttons')"
        :style="`width: ${width}px; max-width: ${width}px;`">
    <template #body="{ data, index }">
        <div class="max-table-buttons" ref="el">
            <slot name="buttons" v-bind="{ data, index }" ></slot>
        </div>
    </template>
</Column>
```

`DataTable` também é PrimeVue (linha 3 de `MaxTable.vue`), com props implícitas
via `v-bind="attrs"` e `stripedRows`.

### 2.3 Superfície de API do PrimeVue `Column` efetivamente usada

Apesar de o `Column` do PrimeVue expor dezenas de props (`field`, `header`,
`sortable`, `filter`, `frozen`, `expander`, `selectionMode`, `bodyStyle`,
`headerStyle`, etc.), o uso REAL no código Max é **mínimo**:

| Recurso PrimeVue `Column` | Onde | Uso real no Max |
|---|---|---|
| prop `header` | `MaxTable.vue:6` | `header=""` (string) |
| prop `style` | `MaxTable.vue:6` | largura inline calculada |
| slot `#body="{ data, index }"` | `MaxTable.vue:7` | render da célula |

Tudo o mais (ordenação, filtro, seleção, redimensionamento, frozen) **não é
consumido** pelo Max hoje. Isso reduz drasticamente o escopo de substituição.

### 2.4 Dependência indireta de estilo (classes PrimeVue)

O `<style>` de `MaxTableColumn.vue` e de `MaxTable.vue` referencia classes
geradas pelo PrimeVue DataTable. Estas SOMEM quando o motor deixar de ser
PrimeVue e precisam ser reescritas com as novas classes do motor escolhido:

```
.p-datatable
.p-datatable-table-container
.p-datatable-column-header-content
.p-datatable-column-title
.p-row-even / .p-row-odd
```

---

## 3. Dependências internas (acoplamento com MaxTable)

`MaxTableColumn` **não pode ser migrado isoladamente**. O acoplamento é total:

1. **`MaxTable.vue` é quem instancia `Column`.** `MaxTableColumn.vue` sozinho
   não renderiza colunas. Migrar apenas o arquivo `MaxTableColumn.vue`
   (removendo o import) não muda comportamento algum — a dependência de
   PrimeVue permanece em `MaxTable.vue`.
2. **CSS compartilhado.** Os blocos `<style>` de `MaxTableColumn.vue` e
   `MaxTable.vue` são quase idênticos e globais; ambos miram o mesmo DOM
   `.p-datatable`. Alterar um sem o outro gera regressão visual.
3. **Ponto de exportação.** `src/index.ts` exporta `MaxTable` (linha 94) e
   `MaxTableFields` (linha 95), mas **NÃO** exporta `MaxTable Column` como
   default utilizável — `MaxTableColumn` aparece apenas no
   `components-manifest.json` (linhas 59, 416–421) como alias de resolver.
4. **Existe um segundo motor de tabela JÁ SEM PrimeVue:** `MaxTableFields.vue`.
   Ele renderiza `<table>`/`<thead>`/`<tbody>` nativos e consome a interface
   `MaxTableColumn` de `src/types/index.ts` (ver Seção 4.2). Este componente é
   a referência arquitetural para o destino da migração.

> **Ordem obrigatória:** este plano é subordinado ao plano de `MaxTable`.
> `MaxTableColumn` deve ser migrado **junto** com `MaxTable` e, idealmente,
> convergindo para o modelo de `MaxTableFields`. Ver Seção 10.

---

## 4. API pública a preservar

### 4.1 API implícita via slots do `MaxTable` (PrimeVue Column hoje)

`MaxTable.vue` repassa dinamicamente todos os slots recebidos ao `DataTable`
(linhas 4–13). O consumidor externo escreve colunas assim (padrão PrimeVue):

```vue
<MaxTable :value="rows">
    <MaxTableColumn field="name" header="Nome" />
    <template #body-name="{ data }">{{ data.name }}</template>
    <template #buttons="{ data, index }"> ... </template>
</MaxTable>
```

Contrato a preservar:
- Slot `#buttons="{ data, index }"` → coluna de ações auto-gerada, com largura
  auto-calculada por `useElementSize` (ver 4.3).
- Repasse transparente de quaisquer slots nomeados ao motor de tabela.
- `defineExpose({ width })` em `MaxTable.vue` (linhas 39–41).

### 4.2 API declarativa de coluna — interface `MaxTableColumn` (destino)

Definida em `src/types/index.ts` (linhas 118+). **Esta é a API pública real que
deve ser preservada e para a qual `MaxTable` deve convergir.** Reproduzida
integralmente:

```ts
export interface MaxTableColumn {
    /** Texto do cabeçalho da coluna */
    header: string;
    /** Campo do objeto a ser exibido na célula */
    field: string;
    /** Nome do slot customizado para renderizar o conteúdo da célula */
    slot?: string;
    /** Largura da coluna (ex: '100px', '20%') */
    width?: string;
    /** Largura mínima da coluna */
    minWidth?: string;
    /** Largura máxima da coluna */
    maxWidth?: string;
    /** Largura máxima da coluna */
    size?: string;
    /** Alinhamento do conteúdo da célula */
    align?: 'left' | 'center' | 'right';
    /** Tipo de input a ser renderizado na célula */
    input?: 'text' | 'input' | 'checkbox' | 'select' | 'date' | 'number'
        | 'increment' | 'textarea' | 'phone-number' | 'auto-complete'
        | 'auto-complete-api';
    /** Lista de opções para o select */
    options?: any[];
    /** Rota para navegação ao clicar */
    route?: string;
    /** Dados extras: string com caminho ou objeto com caminhos */
    data?: string | Record<string, any>;
    /** Texto do placeholder */
    placeholder?: string;
    /** Título no cabeçalho */
    title?: string;
    /** Estilo no cabeçalho */
    style?: object;
    /** Classe no cabeçalho */
    class?: string | object;
    /** Indica se o campo é obrigatório */
    required?: boolean;
    /** Tooltip ao passar o mouse */
    tooltip?: boolean;
    /** Função executada quando o valor do campo mudar */
    action?: (data: { row: any; field: string; value: any }) => void;
}
```

Esta interface **não depende de PrimeVue** e já é consumida por
`MaxTableFields.vue`. Deve ser mantida sem alterações (backward compatible).

### 4.3 Comportamento de largura auto-calculada (a preservar em MaxTable)

```ts
// src/components/MaxTable.vue, linhas 29–41
const el = useTemplateRef('el');
const width = ref(1);
const { width: calculated_width } = useElementSize(el as any); // @maxvue/max-use
watch(calculated_width, () => {
    if (calculated_width.value === 0) return;
    if (width.value > 1) return;
    else if (width.value === 1 && calculated_width.value > 0)
        width.value = calculated_width.value + 10;
}, { immediate: true });
defineExpose({ width });
```

`useElementSize` vem de `@maxvue/max-use` (re-export de VueUse —
`../MaxUse/src/Helpers/VueUse/index.ts:270`). **Não é PrimeVue**, pode ser
mantido tal como está.

---

## 5. Estratégia de substituição

O motor de tabela definitivo (TanStack Table `@tanstack/vue-table` vs. `<table>`
nativo à la `MaxTableFields`) é **decisão do plano de `MaxTable`**. Este plano
**difere** essa escolha e descreve o mapeamento para AMBOS os alvos plausíveis.

### 5.1 Alvo A — Convergir para o modelo `MaxTableFields` (`<table>` nativo)

Recomendado como caminho de menor risco: `MaxTableFields.vue` **já implementa**,
sem PrimeVue, tudo que o par `MaxTable`+`MaxTableColumn` faz e mais (inputs
inline, botões, estado vazio, larguras via `getCssSize`). A migração vira uma
consolidação:

- `MaxTableColumn.vue` deixa de existir como wrapper de `Column`; a definição de
  coluna passa a ser 100% a interface `MaxTableColumn` (tipo), já usada.
- `MaxTable.vue` passa a renderizar `<table>` nativo dirigido por um array
  `columns: MaxTableColumn[]` (padrão de `MaxTableFields.vue:7,27`), com slots
  `#header-${field}` e `#${col.slot}`/`#buttons`.
- A coluna de botões auto-gerada (`MaxTable.vue:6–12`) é substituída pela
  coluna extra de botões de `MaxTableFields.vue:13,75–79`.

Mapeamento PrimeVue `Column` → `<th>/<td>` nativos:

| PrimeVue `Column` | Equivalente nativo (MaxTableFields) |
|---|---|
| `<Column header="X">` | `<th>{{ col.header }}</th>` (`MaxTableFields.vue:7-11`) |
| `#body="{ data, index }"` | `<td>` com `<slot :data :index>` (`:27-72`) |
| `:style="width:..."` | `getColumnStyle(col)` (`:218-233`) |
| coluna de botões | `<th>`/`<td>` de botões (`:13,75-79`) |

### 5.2 Alvo B — TanStack Table (`@tanstack/vue-table`)

Se o plano de `MaxTable` optar por TanStack, mapear a interface `MaxTableColumn`
para `ColumnDef<TRow>`:

| `MaxTableColumn` (Max) | `ColumnDef` (TanStack) |
|---|---|
| `field` | `accessorKey: col.field` (suportar dot-path via `accessorFn`) |
| `header` | `header: () => col.header` (ou render de slot `header-${field}`) |
| `slot` / render de célula | `cell: (ctx) => h(slotRenderer, { data: ctx.row.original, index: ctx.row.index, value: ctx.getValue() })` |
| `width` / `size` | `size: parseInt(getCssSize(col.width))` + estilo inline |
| `minWidth` / `maxWidth` | `minSize` / `maxSize` |
| `align` | metadado em `meta: { align }`, aplicado no CSS da célula |
| coluna de botões | `columnDef` extra com `id: 'buttons'` e `cell` renderizando slot `buttons` |

Notas para o Alvo B:
- Acesso a campo com notação de ponto (`user.name`) já existe em
  `MaxTableFields.getFieldValue` (`:158-163`); reusar como `accessorFn`.
- Definições de colunas TanStack devem ser envolvidas com `markRaw`/`shallowRef`
  para evitar reatividade profunda (ver Skill de dynamic components, Seção 9).
- TanStack é headless: a renderização de `<thead>/<tbody>` continua sendo o
  `<table>` nativo do estilo de `MaxTableFields` — logo o CSS da Seção 7 vale
  para ambos os alvos.

### 5.3 Decisão sobre o arquivo `MaxTableColumn.vue`

Como o `<template>` já é vazio e o único código é `import _Column`, o resultado
final para o arquivo é um destes (a ser confirmado pelo plano de `MaxTable`):
1. **Remoção do arquivo** e do alias no `components-manifest.json`
   (linhas 59, 416–421), OU
2. **Reaproveitamento** como componente marcador declarativo puro (props =
   subconjunto da interface `MaxTableColumn`), lido por `MaxTable` via
   `useSlots`/VNode inspection — mantendo o alias público. Preferir (1) se o uso
   externo real for via array `columns` (modelo `MaxTableFields`).

De qualquer forma, **o `import 'primevue/column'` deve sair** (é o objetivo de
independência) e o `<style>` global precisa migrar junto (Seção 7).

---

## 6. Passos de implementação

> Executar **somente** dentro do lote de migração de `MaxTable` (ver Seção 10).

1. **Confirmar o motor** no plano de `MaxTable` (Alvo A nativo ou Alvo B
   TanStack). Não prosseguir sem essa definição.
2. **Preservar** integralmente a interface `MaxTableColumn` em
   `src/types/index.ts` (não editar; é a API pública). Se TanStack, adicionar um
   adaptador `toColumnDef(cols: MaxTableColumn[]): ColumnDef[]` em
   `src/helpers/` (novo arquivo), reusando `getCssSize` e o dot-path de
   `getFieldValue`.
3. **Remover** de `MaxTableColumn.vue`:
   - `import _Column from 'primevue/column';` (linha 7).
4. **Definir o destino do arquivo** `MaxTableColumn.vue` conforme Seção 5.3.
   - Se **remover**: apagar o arquivo e retirar as entradas
     `MaxTableColumn`/aliases de `components-manifest.json` (linhas 59,
     416–421), depois rodar `npx tsx src/scripts/generateResolver.ts` para
     regenerar o manifesto.
   - Se **manter como marcador**: reescrever com `<script setup lang="ts">` +
     `defineProps<Pick<MaxTableColumn, 'field'|'header'|'width'|'size'|'minWidth'|'maxWidth'|'align'|'slot'|'style'|'class'>>()`,
     `<template>` vazio, e documentar que é consumido por `MaxTable`.
5. **Migrar `MaxTable.vue`** (parte central, detalhada no plano de `MaxTable`):
   remover `import DataTable`/`import Column`, trocar por `<table>` nativo (Alvo
   A) ou `useVueTable` + `<table>` (Alvo B); preservar slot `#buttons` e a
   largura auto-calculada por `useElementSize` (Seção 4.3).
6. **Migrar o CSS** conforme Seção 7 (reescrever seletores `.p-datatable*` /
   `.p-row-*` para as classes do novo motor). Fazer nos DOIS arquivos de estilo
   se ambos forem mantidos, ou consolidar em um só.
7. **Rodar** `npm run type-check`, `npm run lint`, `npm run test` e o
   `dev:playground` para validação visual (Seção 8).

**Convenções obrigatórias** (CLAUDE.md): `<script setup lang="ts">`, indentação
de 4 espaços, aspas simples, ponto e vírgula, sem trailing comma, ordem
Template → Script → Style.

---

## 7. Estilos

Todo o `<style lang="scss">` de `MaxTableColumn.vue` (linhas 12–139) e de
`MaxTable.vue` (linhas 46–183) é **global** e depende de classes PrimeVue.
Precisa ser reescrito. O mapeamento de referência já existe pronto e testado em
`MaxTableFields.vue` (linhas 239–388), que reproduz o MESMO visual sem PrimeVue:

| Estilo PrimeVue atual | Equivalente sem PrimeVue (MaxTableFields) |
|---|---|
| `.max-table-main-div` (wrapper) | `.max-table-fields-wrapper` (`:240-250`) |
| `.p-datatable table` (grid rows) | `.max-table-fields` (`:252-258`) |
| `.p-datatable thead tr` (barra azul) | `.max-table-fields-head-row` (`:267-273`) |
| `th` + `.p-datatable-column-header-content` | `.max-table-fields-th` (`:275-287`) |
| `tbody` | `.max-table-fields-body` (`:296-301`) |
| `tr.p-row-even` | `.max-table-fields-row-even` (`:318-320`) |
| `tr.p-row-odd` | `.max-table-fields-row-odd` (`:322-324`) |
| `td` | `.max-table-fields-td` (`:327-344`) |
| `.max-table-buttons` | `.max-table-fields-buttons` (`:357-365`) |

Valores visuais a preservar exatamente (todos são CSS vars do MaxStyle, não
PrimeVue):
- Borda do wrapper: `1px solid var(--background-300)`, `border-radius: 1rem`.
- Cabeçalho: fundo `var(--blue-800)`, texto `var(--blue-200)`, altura `40px`,
  fonte `Jost, sans-serif`.
- Zebra: `var(--primary-25)` (par) / `var(--primary-100)` (ímpar).
- Regra que oculta mensagens dos inputs dentro de células:
  `.max-input-main-div .message-spacer, .input-message { display: none }`
  (`MaxTable.vue:114-120`, replicada em `MaxTableFields.vue:337-343`).

**Recomendação:** ao migrar, remover os `!important` herdados da luta com o CSS
do PrimeVue — no motor nativo eles deixam de ser necessários (compare
`MaxTable.vue` cheio de `!important` vs. `MaxTableFields.vue` sem nenhum).

---

## 8. Testes / verificação

Não há teste dedicado a `MaxTableColumn` (arquivo sem lógica). A verificação é
via `MaxTable`. Setup: Vitest + `@vue/test-utils` + `happy-dom`
(`tests/setup.ts`).

1. **Independência do PrimeVue (objetivo primário):**
   ```bash
   grep -rn "primevue/column\|primevue/datatable" src/components/MaxTable*.vue
   ```
   Deve retornar **vazio** ao final.
2. **Type-check e lint:**
   ```bash
   npm run type-check
   npm run lint
   ```
3. **Testes unitários** (montar `MaxTable` com dados + slot `#buttons` +
   coluna via interface `MaxTableColumn`; assertar linhas, cabeçalhos, zebra e
   render do slot de botões):
   ```bash
   npx vitest run tests/components/MaxTable.test.ts
   npm run test
   ```
   Se o arquivo de teste não existir, criá-lo cobrindo: render de N linhas,
   `header`, largura auto-calculada (`defineExpose({ width })`), slot `#buttons`.
4. **Resolver** (se `MaxTableColumn.vue` for removido):
   ```bash
   npx tsx src/scripts/generateResolver.ts
   ```
   e conferir que `components-manifest.json` não referencia mais o componente
   removido / continua consistente.
5. **Validação visual manual:** `npm run dev:playground` — comparar tabela antes
   e depois (barra de cabeçalho azul, zebra, coluna de botões, inputs inline).

---

## 9. Skills necessárias

Selecionadas do diretório `.claude/skills/` (preferência por `vue-`):

1. **`/home/johnattas/GitHub/MaxComponentsUi/.claude/skills/vue-3-dynamic-components-and-keep-alive-caching-best-practices/SKILL.md`**
   — Justificativa: a renderização de colunas do PrimeVue é declarativa/dinâmica
   (slots por VNode). Ao migrar para TanStack (Alvo B), as `ColumnDef` e os
   renderizadores de célula/cabeçalho passam por `<component :is>` /
   funções `cell`/`header`. A skill orienta o uso de `shallowRef`/`markRaw`
   nessas definições para evitar reatividade profunda e warnings — crítico para
   performance de tabela.

2. **`/home/johnattas/GitHub/MaxComponentsUi/.claude/skills/vue-virtual-scroller-best-practices/SKILL.md`**
   — Justificativa: `MaxTable`/`DataTable` PrimeVue trazia virtualização/scroll
   de linhas. Se o volume de linhas for grande, a paridade de performance exige
   virtualização (`RecycleScroller`/`DynamicScroller`) no motor nativo. Consultar
   ao decidir o `tbody` do novo motor. **Opcional** — aplicar apenas se listas
   grandes forem requisito; para listas pequenas, o `<table>` nativo de
   `MaxTableFields` já basta.

3. **`/home/johnattas/GitHub/MaxComponentsUi/.claude/skills/vue-max-components-ui-development-best-practices/SKILL.md`**
   — Justificativa: garante aderência às convenções internas da lib (InputBase,
   estrutura de `.vue`, aliases em `src/index.ts`, regeneração do resolver) ao
   reescrever `MaxTable`/`MaxTableColumn`.

Skills descartadas: as `adonisjs-*`, `laravel-*`, `python-*` (backend, fora de
escopo) e demais `vue-*` sem relação com tabelas/render dinâmico.

---

## 10. Riscos e pontos de atenção

1. **Migração acoplada obrigatória — ORDEM.** `MaxTableColumn` **NÃO** pode ser
   migrado sozinho. Deve ir **junto com `MaxTable`** e, preferencialmente, com
   `MaxTableFields` (que já é o alvo arquitetural). Sequência recomendada:
   (a) fechar plano/decisão de motor em `MaxTable`; (b) migrar `MaxTable`;
   (c) resolver `MaxTableColumn` (remover ou marcador); (d) consolidar CSS.
   **Este plano DIFERE a escolha do motor ao plano de `MaxTable`.**
2. **Arquivo praticamente vazio ilude o escopo.** O real trabalho de PrimeVue
   está em `MaxTable.vue` (`DataTable` + `Column`), não em `MaxTableColumn.vue`.
   Não declarar "migrado" só por remover o `import _Column`.
3. **CSS global e duplicado.** Estilos não `scoped` mirando `.p-datatable`
   desaparecem com o PrimeVue. Reescrever nos dois arquivos (ou consolidar) — a
   referência pronta e testada é `MaxTableFields.vue`.
4. **Interface `MaxTableColumn` é API pública.** Consumida por
   `MaxTableFields.vue` e por apps externos. Não alterar assinatura; qualquer
   adaptador para TanStack deve ser aditivo.
5. **Alias no resolver.** `components-manifest.json` (linhas 59, 416–421) expõe
   `MaxTableColumn`/`TableColumn`/kebab/snake. Se remover o arquivo, atualizar o
   manifesto via `generateResolver.ts` para não quebrar imports de consumidores.
6. **Largura auto-calculada frágil.** O `watch` de `useElementSize`
   (`MaxTable.vue:33-37`) só ajusta `width` uma vez (`if (width.value > 1)
   return`). Replicar exatamente esse comportamento no novo motor para não
   regredir o dimensionamento da coluna de botões.
7. **Virtualização.** Se PrimeVue fornecia scroll virtual e o novo motor não,
   pode haver regressão de performance com muitas linhas — endereçar via skill
   de virtual scroller (Seção 9, item 2).
8. **`!important` legado.** Vieram da briga com o CSS do PrimeVue; ao migrar,
   remover progressivamente para não mascarar problemas de especificidade no
   motor nativo.
9. **TanStack como dependência nova.** O Alvo B troca dependência de PrimeVue por
   dependência de `@tanstack/vue-table`. Confirmar no plano de `MaxTable` se o
   objetivo "independente" tolera essa nova dep ou se prefere o `<table>` nativo
   (Alvo A, zero dependências de terceiros) — este último é o mais alinhado ao
   espírito da migração.
