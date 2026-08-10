# `useFocusTrap()` não tem teste unitário

- **Categoria:** falta-de-teste
- **Severidade:** alta
- **Arquivo(s):** `src/helpers/useFocusTrap.ts:24-95`
- **Domínio:** helpers-composables

## Problema

Não existe `tests/helpers/useFocusTrap.test.ts`. O helper é o mecanismo de acessibilidade do `MaxDrawer` (`src/components/MaxDrawer.vue:113`) e concentra lógica não trivial, com pelo menos cinco ramos distintos sem cobertura direta:

- `activate()` (linhas 48-54) salva `document.activeElement` e foca o primeiro focável **dentro de um `nextTick` cujo retorno é descartado** — o chamador não tem como aguardar o foco, o que torna o comportamento dependente de timing.
- `deactivate()` (linhas 56-63) só devolve o foco se `previous?.isConnected` — o caso "elemento de origem removido do DOM" está documentado em comentário (linhas 57-59) mas não é exercitado.
- `onKeydown()` (linhas 65-92) tem quatro caminhos: alvo fora do trap (linhas 76-80), Shift+Tab no primeiro (82-85), Tab no último (88-91), e o caso de passagem livre.
- `isVisible()` (linhas 35-41) tem uma heurística explicitamente adaptada ao `happy-dom` — o comentário nas linhas 30-34 admite que `offsetParent`/`getBoundingClientRect` não são confiáveis no ambiente de teste. Essa decisão é exatamente o tipo de coisa que precisa de teste para não regredir.

O seletor `FOCUSABLE` (linhas 10-17) também tem lacunas verificáveis: não inclui `[contenteditable]`, nem `audio[controls]`/`video[controls]`, nem `details > summary`; e `input:not([disabled])` inclui `input[type="hidden"]`, que nunca é focável mas seria contado como primeiro/último item do trap.

## Impacto

Um `input[type="hidden"]` como primeiro filho do drawer faria `items[0]?.focus()` (linha 52) ser um no-op silencioso: o drawer abriria sem foco em nenhum lugar, e `Shift+Tab` no "primeiro" elemento saltaria para o elemento errado. Usuários de teclado e leitores de tela ficam presos ou perdidos, sem que nada falhe em CI.

## Plano de correção

1. Criar `tests/helpers/useFocusTrap.test.ts` montando um container com botões/inputs reais no `document.body` e um `ref` apontando para ele.
2. Cobrir: `activate()` focando o primeiro elemento (com `await nextTick()`); `deactivate()` restaurando o foco anterior; `deactivate()` com `previous` removido do DOM (não deve lançar); ciclo Tab do último para o primeiro; ciclo Shift+Tab do primeiro para o último; alvo fora do trap redirecionado; container vazio (`onKeydown` deve retornar cedo, linha 70).
3. Cobrir `isVisible()`: elemento com `hidden`, com `style.display:none`, com `aria-hidden="true"` — todos devem ser excluídos da lista.
4. Adicionar `input[type="hidden"]` à exclusão do seletor `FOCUSABLE` (`input:not([disabled]):not([type="hidden"])`) e um teste que o comprove.
5. Avaliar retornar a `Promise` do `nextTick` em `activate()` para que o chamador possa aguardar o foco.

## Verificação

- Testes a criar/ajustar: `tests/helpers/useFocusTrap.test.ts` (novo)
- Comandos: `npx vitest run tests/helpers/useFocusTrap.test.ts`, `npm run type-check`, `npm run lint`
