# `useVirtualList()` divide por `itemHeight` sem guard, produzindo `Infinity`/`NaN`

- **Categoria:** bug
- **Severidade:** média
- **Arquivo(s):** `src/composables/useVirtualList.ts:39`, `:47-48`, `:58`
- **Domínio:** helpers-composables

## Problema

`options.itemHeight` é usado como divisor em três pontos, sem nenhuma validação:

```ts
// src/composables/useVirtualList.ts:39
const first = Math.floor(scrollTop.value / options.itemHeight.value);

// :47-48
const visibleCount = Math.ceil(viewportHeight.value / options.itemHeight.value);
const last = Math.floor(scrollTop.value / options.itemHeight.value) + visibleCount + overscan;
```

Com `itemHeight = 0` (plausível: altura vinda de uma medição de DOM ainda não realizada, ou de uma variável CSS não resolvida no primeiro frame):

- `scrollTop / 0` → `0/0 = NaN` quando `scrollTop` é 0, ou `Infinity` quando é positivo.
- `Math.floor(NaN)` → `NaN`. Em `startIndex` (linha 41), `Math.min(maxIndex, Math.max(0, NaN - overscan))` → `NaN`.
- `items.slice(NaN, ...)` trata `NaN` como `0`, então `visibleItems` até se recupera — mas `index: startIndex.value + offset` (linha 55) devolve `NaN` como índice de cada item, e `offsetY` (linha 58) vira `NaH * 0 = NaN`, que aplicado a um `transform: translateY(NaNpx)` é ignorado pelo browser.

Com `itemHeight` negativo, `startIndex` e `endIndex` invertem e `slice` devolve lista vazia — a lista some sem erro.

Um segundo problema, independente: `totalHeight` (linha 34) **não** respeita `enabled`. Quando `enabled === false`, todos os índices são desabilitados (linhas 37 e 45) e `offsetY` vira 0 (linha 58), mas `totalHeight` continua devolvendo `items.length * itemHeight`. Se o consumidor aplicar `totalHeight` como altura de um spacer enquanto renderiza a lista completa não virtualizada, o container fica com o dobro da altura.

O teste `'lida com lista vazia'` (`tests/composables/useVirtualList.test.ts:74`) cobre `items` vazio, mas nenhum caso cobre `itemHeight` igual a 0 ou negativo, nem a interação entre `enabled: false` e `totalHeight`.

## Impacto

Na app consumidora (o `MaxListBox`/listas longas), um primeiro frame com `itemHeight` ainda não medido produz uma lista posicionada em `NaN` — visualmente a lista aparece colada no topo ou não aparece, e o scroll não corrige até um novo recompute. Sem erro no console, o diagnóstico é caro.

## Plano de correção

1. Normalizar a altura no topo dos computeds: `const height = Math.max(1, options.itemHeight.value || 1)` e usá-la nos três pontos de divisão.
2. Decidir e documentar o contrato de `totalHeight` quando `enabled === false`: ou devolver 0 (o consumidor renderiza a lista real e não precisa de spacer), ou manter e documentar no JSDoc que o valor é independente de `enabled`.
3. Guardar contra `overscan` negativo (`options.overscan ?? 5`, linha 25) com `Math.max(0, ...)`.

## Verificação

- Testes a criar/ajustar: `tests/composables/useVirtualList.test.ts` — casos `itemHeight = 0`, `itemHeight` negativo, `overscan` negativo, e `enabled: false` assertando o valor esperado de `totalHeight`.
- Comandos: `npx vitest run tests/composables/useVirtualList.test.ts`, `npm run type-check`, `npm run lint`
