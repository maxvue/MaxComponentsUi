# Plano 33 — `MaxTable` + `MaxTableColumn` (substitui `DataTable` + `Column`)

| | |
|---|---|
| **ids** | 33 (`MaxTable`), 34 (`MaxTableColumn`) |
| **Arquivos** | `src/components/MaxTable.vue`, `src/components/MaxTableColumn.vue` |
| **Primitivas eliminadas** | `DataTable`, `Column` |
| **Depende de** | 16 (`MaxButton`) |
| **Testes existentes** | `MaxTable.test.ts`, `MaxTableColumn.test.ts`, `MaxTableFields.test.ts` |

> **Conjunto indivisível.** `MaxTableColumn.vue` faz `import _Column from 'primevue/column'`
> e o `MaxTable` consome colunas. Migrar um sem o outro deixa o build quebrado.
> **`MaxTableFields.vue` já é PrimeVue-free** — leia-o, ele mostra o padrão da casa.

⚠️ **O maior item da migração.** O `DataTable` do PrimeVue tem milhares de linhas.
Reimplementá-lo inteiro não é o objetivo — o objetivo é cobrir o que este repositório usa.

---

## 1. Levantamento obrigatório (não pule)

```bash
sed -n '1,120p' src/components/MaxTable.vue
cat src/components/MaxTableColumn.vue
grep -rn "MaxTable\b" src/ playground/ tests/
```

Preencha esta tabela em `notas` antes de codificar:

| Recurso do DataTable | Usado? | Observação |
|---|---|---|
| paginação (`paginator`, `rows`, `rowsPerPageOptions`) | | |
| ordenação (`sortField`, `sortOrder`, `sortable`, multi-sort) | | |
| filtros (`filters`, `filterDisplay`, `globalFilterFields`) | | |
| seleção (`selection`, `selectionMode`, checkbox de linha) | | |
| expansão de linha (`expandedRows`) | | |
| agrupamento (`rowGroupMode`) | | |
| edição (`editMode`, `editingRows`) | | |
| `scrollable` / `virtualScrollerOptions` | | |
| `resizableColumns` / `reorderableColumns` | | |
| `lazy` (dados sob demanda) | | |
| `frozen` (colunas/linhas fixas) | | |
| `rowClass` / `rowStyle` | | |
| slots (`header`, `footer`, `empty`, `loading`, `expansion`, `groupheader`) | | |

**Implemente apenas o que estiver marcado.** Declare o restante como fora de escopo em
`notas` — isso é honesto e verificável, ao contrário de uma reimplementação incompleta
que finge ser completa.

---

## 2. API do `Column`

| Prop | Tipo | Efeito |
|---|---|---|
| `field` | `string` | caminho do dado (suporta `'a.b.c'`) |
| `header` | `string` | rótulo do cabeçalho |
| `sortable` | `boolean` | habilita ordenação |
| `sortField` | `string` | campo alternativo de ordenação |
| `style` / `class` | | estilo da célula |
| `headerStyle` / `headerClass` | | estilo do cabeçalho |
| `bodyStyle` / `bodyClass` | | estilo do corpo |
| `frozen` | `boolean` | coluna fixa |
| `hidden` | `boolean` | oculta |
| `exportable` | `boolean` | inclui na exportação |
| `rowspan` / `colspan` | `number` | mesclagem |
| `selectionMode` | `'single'\|'multiple'` | coluna de seleção |
| `expander` | `boolean` | coluna de expansão |

Slots: `header`, `body` (`{ data, field, index }`), `footer`, `editor`, `filter`,
`sorticon`.

### Como o `Column` funciona por dentro (essencial de entender)

O `Column` do PrimeVue **não renderiza nada sozinho**. Ele é um componente "declarativo":
o `DataTable` lê `$slots.default` (ou os children do VNode), inspeciona as props de cada
`Column` e renderiza `<th>`/`<td>` ele mesmo.

Sua reimplementação precisa fazer o mesmo. Duas abordagens:

- **(a) inspeção de VNodes** — o `MaxTable` lê `slots.default()` e extrai `vnode.props`
  e `vnode.children` de cada coluna. Fiel ao PrimeVue, porém frágil (fragmentos, `v-if`,
  `v-for` complicam a árvore).
- **(b) registro via `provide`/`inject`** — cada `MaxTableColumn` se registra no
  `MaxTable` no `onMounted` e se remove no `onUnmounted`. Mais robusto e idiomático em
  Vue 3.

> **Recomendação: (b).** Mas atenção: a ordem de registro precisa refletir a ordem no
> template. Use o índice do `vnode` ou ordene por posição no DOM — registro por
> `onMounted` puro pode embaralhar colunas com `v-if`.
>
> Registre a abordagem escolhida em `notas`.

---

## 3. Implementação

### Estrutura mínima

```vue
<template>
    <div class="p-datatable p-component">
        <div class="p-datatable-header" v-if="$slots.header"><slot name="header" /></div>

        <div class="p-datatable-table-container">
            <table class="p-datatable-table" role="table">
                <thead class="p-datatable-thead">
                    <tr>
                        <th
                            v-for="col in visibleColumns"
                            :key="col.key"
                            :class="headerClass(col)"
                            :style="col.headerStyle"
                            scope="col"
                            :aria-sort="ariaSort(col)"
                            @click="col.sortable && toggleSort(col)"
                        >
                            <component :is="col.headerSlot" v-if="col.headerSlot" />
                            <span v-else>{{ col.header }}</span>
                            <MaxIcon v-if="col.sortable" :icon="sortIcon(col)" />
                        </th>
                    </tr>
                </thead>

                <tbody class="p-datatable-tbody">
                    <tr
                        v-for="(row, i) in pagedRows"
                        :key="rowKey(row, i)"
                        :class="rowClass(row)"
                        @click="onRowClick(row, i, $event)"
                    >
                        <td v-for="col in visibleColumns" :key="col.key" :class="col.bodyClass" :style="col.bodyStyle">
                            <component :is="col.bodySlot" v-if="col.bodySlot" :data="row" :field="col.field" :index="i" />
                            <span v-else>{{ resolveField(row, col.field) }}</span>
                        </td>
                    </tr>
                    <tr v-if="!pagedRows.length">
                        <td :colspan="visibleColumns.length"><slot name="empty">Nenhum registro encontrado</slot></td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div class="p-datatable-footer" v-if="$slots.footer"><slot name="footer" /></div>
        <MaxTablePaginator v-if="props.paginator" ... />
    </div>
</template>
```

### Resolução de campo aninhado

```ts
// 'endereco.cidade' precisa funcionar — o DataTable suporta isso
const resolveField = (row: any, field?: string) => {
    if (!field || !row) return '';
    return field.split('.').reduce((acc: any, key) => acc?.[key], row) ?? '';
};
```

### Ordenação

```ts
const sortedRows = computed(() => {
    if (!sortField.value) return props.value ?? [];

    return [...(props.value ?? [])].sort((a, b) => {   // cópia — não mute a prop
        const av = resolveField(a, sortField.value);
        const bv = resolveField(b, sortField.value);

        if (av === bv) return 0;
        if (av === null || av === undefined) return 1;   // nulos por último
        if (bv === null || bv === undefined) return -1;

        const result = typeof av === 'string' && typeof bv === 'string'
            ? av.localeCompare(bv, 'pt-BR', { numeric: true, sensitivity: 'base' })
            : (av < bv ? -1 : 1);

        return result * sortOrder.value;
    });
});
```

> **`localeCompare` com `pt-BR`** é obrigatório: sem ele, "Á" ordena depois de "Z" e a
> tabela fica visivelmente errada para usuários brasileiros. `numeric: true` faz
> "item 10" vir depois de "item 9".
>
> **Nunca use `props.value.sort()`** — `sort` muta o array e você estaria alterando o
> estado do componente pai.

### Acessibilidade de tabela

- `<table>` real com `<thead>`/`<tbody>` (não divs com `role`) — semântica nativa é mais
  confiável;
- `scope="col"` nos `<th>`;
- **`aria-sort`** no `<th>` ordenado (`'ascending'` / `'descending'` / `'none'`) — é o que
  informa o estado de ordenação;
- cabeçalho ordenável deve ser um `<button>` dentro do `<th>` (ou o `<th>` com
  `tabindex="0"` e handler de `Enter`/`Space`) — clique-em-`<th>` puro é inacessível;
- paginação com `aria-label` nos botões e anúncio da página atual.

---

## 4. Estratégia de execução

Este item é grande. Divida-o e comite entre as etapas:

1. `MaxTableColumn` como componente de registro (sem render próprio);
2. `MaxTable` com renderização básica de linhas/colunas + slot `body`;
3. Ordenação;
4. Paginação;
5. Seleção (se usada);
6. O resto marcado no levantamento;
7. SCSS de `.p-datatable*`.

Rode os três arquivos de teste após cada etapa.

---

## 5. Teste

Baseline dos três primeiro. Depois:

1. renderiza cabeçalhos a partir das colunas;
2. renderiza linhas a partir de `value`;
3. `field` aninhado (`'a.b.c'`) resolve corretamente;
4. slot `#body` recebe `{ data, field, index }`;
5. slot `#header` da coluna sobrescreve o `header`;
6. clicar em cabeçalho ordenável ordena asc → desc → (nenhum, se aplicável);
7. **ordenação não muta a prop `value`** (compare a referência e o conteúdo);
8. ordenação de strings respeita acentos pt-BR ("Á" antes de "B");
9. ordenação numérica não usa ordem lexicográfica (10 depois de 9);
10. nulos vão para o fim;
11. `aria-sort` reflete o estado do cabeçalho;
12. paginação divide as linhas corretamente; mudar de página muda o conteúdo;
13. slot `#empty` aparece com lista vazia;
14. coluna `hidden` não renderiza;
15. seleção emite o evento correto (se usada);
16. `MaxTableFields` continua funcionando integrado ao `MaxTable`;
17. teclado: cabeçalho ordenável ativável por `Enter`.

---

## 6. Checklist de conclusão

- [ ] Levantamento da seção 1 preenchido em `notas`, com escopo excluído declarado
- [ ] Abordagem de registro de colunas (a/b) registrada
- [ ] **Ambos** os arquivos sem PrimeVue
- [ ] `MaxTable.test.ts`, `MaxTableColumn.test.ts` e `MaxTableFields.test.ts` passam
- [ ] Prop `value` nunca mutada (teste 7)
- [ ] Ordenação com `localeCompare` pt-BR (testes 8 e 9)
- [ ] `<table>` semântica + `aria-sort` + `scope`
- [ ] Validado no playground com dados reais
- [ ] ids 33 e 34 marcados Concluído **juntos**
- [ ] `type-check`, `lint`, `test` OK
