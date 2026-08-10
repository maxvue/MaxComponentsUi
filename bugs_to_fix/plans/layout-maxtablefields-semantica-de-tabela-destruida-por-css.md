# A semântica de tabela é destruída pelo display: grid/flex no CSS

- **Categoria:** acessibilidade
- **Severidade:** alta
- **Arquivo(s):** `src/components/MaxTableFields.vue:252-331`, `src/components/MaxTable.vue:62-131`
- **Domínio:** tabela-layout-exibicao

## Problema

Ambos os componentes de tabela sobrescrevem o `display` nativo dos elementos de tabela:

`MaxTableFields.vue`:
- `.max-table-fields { display: grid }` (linha 256) sobre o `<table>`
- `.max-table-fields-head { display: grid }` (linha 261) sobre o `<thead>`
- `.max-table-fields-head-row { display: flex }` (linha 268) sobre o `<tr>`
- `.max-table-fields-body { display: grid }` (linha 296) sobre o `<tbody>`
- `.max-table-fields-row { display: flex }` (linha 303) sobre o `<tr>`
- `.max-table-fields-th` / `.max-table-fields-td { display: grid }` (linhas 284/330)

`MaxTable.vue` faz o mesmo, com `!important`, sobre a `table`/`thead`/`tbody`/`tr`/`td` renderizadas pelo `DataTable` (linhas 66, 72, 80, 120, 127, 155).

Quando `display` deixa de ser `table`/`table-row`/`table-cell`, a maioria dos navegadores e leitores de tela **remove o mapeamento ARIA implícito** da tabela: os papéis `table`, `row`, `columnheader` e `cell` deixam de ser expostos na árvore de acessibilidade. O leitor de tela passa a anunciar um bloco de texto genérico, sem navegação por linha/coluna, sem associação célula↔cabeçalho e sem anúncio de posição ("linha 3 de 20, coluna Nome").

Além disso, os `<th>` não declaram `scope` (`MaxTableFields.vue:7`, `:13`), o que já enfraqueceria a associação mesmo com a semântica preservada.

## Impacto

- Tabelas de dados inutilizáveis por leitor de tela: sem navegação bidimensional e sem contexto de cabeçalho ao ler uma célula.
- Aplica-se aos dois componentes de tabela da biblioteca, ou seja, a toda exibição tabular do ecossistema.
- Violação de WCAG 1.3.1 (Info and Relationships).

## Plano de correção

1. Restaurar os papéis explicitamente, já que o layout depende de grid/flex — é o remédio padrão para tabelas com layout CSS moderno:
   - `<table role="table">`, `<thead role="rowgroup">`, `<tbody role="rowgroup">`, `<tr role="row">`, `<th role="columnheader">`, `<td role="cell">`.
2. Adicionar `scope="col"` aos `<th>` do cabeçalho (`MaxTableFields.vue:7` e `:13`).
3. Em `MaxTable.vue`, aplicar os mesmos papéis via `pt` (passthrough) do `DataTable` do PrimeVue, que permite injetar atributos nos elementos internos sem fork do componente.
4. Avaliar, na migração do PrimeVue já planejada, se o layout pode usar `display: table` com `table-layout: fixed` em vez de grid/flex — o que dispensaria os papéis explícitos.

## Verificação

- Teste asserindo a presença de `role` nos elementos de `MaxTableFields` e `scope="col"` nos `<th>`.
- Auditoria manual com leitor de tela (NVDA/VoiceOver) confirmando anúncio de "linha X, coluna Y".
- `npx vitest run tests/components/MaxTableFields.test.ts tests/components/MaxTable.test.ts`.
