# MaxTable mede a largura dos botões com um template ref dentro de v-for

- **Categoria:** bug
- **Severidade:** média
- **Arquivo(s):** `src/components/MaxTable.vue:8`, `src/components/MaxTable.vue:29-37`
- **Domínio:** tabela-layout-exibicao

## Problema

O `ref="el"` está no `<div class="max-table-buttons">` que é renderizado **dentro do slot `#body` de uma `Column`**, ou seja, uma vez por linha da tabela. Quando um template ref aparece dentro de um `v-for` (ou de um slot repetido por linha), o Vue transforma `useTemplateRef('el')` em um **array** de elementos, não em um único `HTMLElement`.

O `useElementSize(el as any)` (linha 31) recebe então um array. O `as any` mascara o erro de tipo. Dependendo do número de linhas, `calculated_width` pode nunca sair de `0`, deixando `width` permanentemente em `1`, o que gera `style="width: 1px; max-width: 1px"` na coluna de ações (linha 6).

Além disso, o `watch` (linhas 33-37) implementa um *latch* de uma única medição: uma vez que `width.value > 1`, ele nunca mais recalcula. Se o conteúdo dos botões mudar (ex.: um botão condicional aparece), a coluna mantém a largura antiga.

## Impacto

- Coluna de ações colapsada a 1px, cortando os botões, em cenários com múltiplas linhas.
- Largura nunca reagida a mudanças no conteúdo dos botões.
- O `as any` esconde justamente o descasamento de tipo que causa o defeito.

## Plano de correção

1. Mover a medição para um elemento único e estável: renderizar um medidor oculto fora do loop de linhas, ou medir o `th` da coluna de ações, e apontar o `ref` para ele.
2. Alternativamente, se o ref precisar permanecer por linha, tratar explicitamente o array: `const first = computed(() => Array.isArray(el.value) ? el.value[0] : el.value)` e passar `first` ao `useElementSize`, removendo o `as any`.
3. Rever o latch: permitir recomputar quando `calculated_width` variar significativamente (ex.: só travar depois do primeiro frame estável, ou usar `Math.max`).

## Verificação

- Teste montando a tabela com um stub de `DataTable`/`Column` que renderize **múltiplas** linhas, asserindo que `vm.width` converge para o valor medido + 10.
- `npx vitest run tests/components/MaxTable.test.ts`.
- Conferir no playground que a coluna de botões acomoda 1, 2 e 3 botões.
