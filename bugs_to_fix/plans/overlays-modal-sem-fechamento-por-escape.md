# MaxModal não fecha com a tecla Escape

- **Categoria:** acessibilidade
- **Severidade:** média
- **Arquivo(s):** `src/components/MaxModal.vue:8-29`, `src/components/MaxModal.vue:230-248`
- **Domínio:** overlays-navegacao

## Problema

Não existe nenhum listener de `keydown` no `MaxModal`. As únicas vias de fechamento são:

- clique no fundo (`@click.stop="modal_store.hide"`, linha 9);
- clique no botão X (linha 18);
- chamada imperativa `close()` / `hide()` via `defineExpose` (linhas 250-257).

A tecla `Escape` não faz nada. O `MaxDrawer`, por contraste, implementa `onEscape` com `document.addEventListener('keydown', onEscape)` na abertura e `removeEventListener` no fechamento e no `onBeforeUnmount` (`src/components/MaxDrawer.vue:153-155,185,195,204`), inclusive com a prop `closeOnEscape` para controlar o comportamento.

## Impacto

Usuários de teclado ficam presos no modal (agravado pela ausência de focus trap): não há como fechá-lo sem localizar visualmente o botão X ou clicar na máscara com o mouse. O padrão WAI-ARIA `dialog` exige que Escape feche diálogos dispensáveis, e é a expectativa universal de UX.

## Plano de correção

1. Em `src/components/MaxModal.vue`, adicionar a prop `closeOnEscape?: boolean` com default `true` (espelhando `MaxDrawer`).
2. Criar `const onEscape = (event: KeyboardEvent) => { if (event.key === 'Escape' && props.closeOnEscape) close(); };`.
3. Registrar/desregistrar o listener no `watch(is_show, ...)`: `document.addEventListener('keydown', onEscape)` quando abrir, `removeEventListener` quando fechar.
4. Adicionar `onBeforeUnmount(() => document.removeEventListener('keydown', onEscape))` para não vazar o listener caso o modal seja desmontado aberto.
5. Usar `close()` (que respeita a animação de saída de 300ms) e não `modal_store.hide()` direto, para manter `intent` sincronizado.

## Verificação

- Teste em `tests/components/MaxModal.test.ts`: abrir o modal, disparar `document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))`, avançar os timers e afirmar que `modal_store.show_id` voltou a `null`.
- Teste negativo: com `closeOnEscape: false`, o Escape não deve fechar.
- Teste de vazamento: montar, abrir, desmontar o wrapper e afirmar que um Escape posterior não lança erro nem altera o store.
- `npx vitest run tests/components/MaxModal.test.ts`
