# 09 — MaxTable: coluna de botões renderizada uma vez por slot (duplicação)

**Severidade:** Alta
**Categoria:** Bug
**Arquivos:** `src/components/MaxTable.vue:4-13`

## Problema

O `<Column>` de botões está **dentro do `v-for="name in slotNames"`** com `v-if="slotNames.includes('buttons')"` — condição independente da iteração. Com slots `default` + `buttons`, a coluna de botões é renderizada **uma vez por slot existente** (2+ colunas duplicadas).

Problemas secundários no mesmo arquivo:
- `ref="el"` dentro de `#body` (v-for de linhas) captura só um elemento.
- O watch de `width` tem ramo morto: `if (width.value > 1) return; else if (width.value === 1 ...)` — o `else if` é a única via viva.

## Correção sugerida

Mover o `<Column>` de botões para fora do `v-for` e simplificar o watch. Atenção: MaxTable está na fila da migração PrimeVue (itens 31–33) — se a migração estiver próxima, corrigir na reescrita.
