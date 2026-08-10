# `gap()` ignora os prefixos `col`/`column` capturados pelo preset do UnoCSS

- **Categoria:** bug
- **Severidade:** alta
- **Arquivo(s):** `src/helpers/gap.ts:11-15`, `src/presetMaxUno.ts:35`
- **Domínio:** helpers-composables

## Problema

O shortcut do preset captura três alternativas de prefixo:

```ts
// src/presetMaxUno.ts:35
[/^(?:(row|col|column))?-gap-(.+)$/i, (params) => (hasContent(params[1]) ? gap(params) : { gap: getCssSize(params[2]) + ' !important' })]
```

Ou seja, `params[1]` pode valer `row`, `col` ou `column`. Mas `gap()` só reconhece dois valores, e nenhum deles é `col`/`column`:

```ts
// src/helpers/gap.ts:11-12
if (params[1] && String(params[1]).toLowerCase() === 'row') return { 'row-gap': getCssSize(gap_value) + ' !important' };
else if (params[1] && String(params[1]).toLowerCase() === 'gap') return { 'column-gap': getCssSize(gap_value) + ' !important' };
```

Dois defeitos concretos:

1. `col-gap-10` e `column-gap-10` caem no `return { gap: ... }` final (linha 15) e geram **`gap` nos dois eixos**, quando a intenção declarada pelo regex era `column-gap`.
2. O ramo que produz `column-gap` está condicionado a `params[1] === 'gap'` — uma string que o regex do preset **nunca** consegue produzir em `params[1]` (as únicas alternativas do grupo são `row|col|column`). É código morto pela via do preset; só é alcançável nos testes, que chamam `gap()` diretamente (`tests/helpers/gap.test.ts:26`, `:30`).

Há ainda uma inconsistência de saída: os ramos direcionais adicionam `' !important'` (linhas 11 e 12), mas o fallback da linha 15 (`{ gap: getCssSize(gap_value) }`) **não** adiciona — mesmo o fallback do próprio preset (`presetMaxUno.ts:35`) adicionando `!important`.

## Impacto

Para o consumidor da lib, `col-gap-8` / `column-gap-8` aplicam espaçamento também no eixo vertical (`gap` em vez de `column-gap`), quebrando layouts em grid/flex-wrap onde só se queria separar colunas. E o `gap` genérico produzido por `gap()` perde a especificidade `!important` que o mesmo utilitário tem quando escrito sem prefixo, gerando comportamento diferente entre `gap-8` e `other-gap-8`.

## Plano de correção

1. Em `src/helpers/gap.ts`, normalizar `params[1]` uma única vez (`const axis = String(params[1] ?? '').toLowerCase()`).
2. Tratar `axis === 'row'` → `row-gap`; `axis === 'col' || axis === 'column' || axis === 'gap'` → `column-gap`. Manter `'gap'` apenas por retrocompatibilidade com chamadas diretas já testadas.
3. Alinhar o fallback da linha 15 para também emitir `' !important'`, igualando o comportamento ao ramo `hasContent(params[1]) === false` do `presetMaxUno.ts:35`. Se a ausência de `!important` for intencional, documentar com comentário — hoje não há nenhum.
4. Rodar o build do preset e conferir o CSS gerado para `col-gap-*` numa app de teste (ou no playground).

## Verificação

- Testes a criar/ajustar: `tests/helpers/gap.test.ts` — adicionar casos `gap(['class','col','10'])` e `gap(['class','column','10'])` esperando `{ 'column-gap': '10px !important' }`, e ajustar o caso `retorna gap genérico para outros valores` conforme a decisão do passo 3.
- Comandos: `npx vitest run tests/helpers/gap.test.ts`, `npm run type-check`, `npm run lint`
