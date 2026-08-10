# MaxPopover / MaxPopoverConfirm: posição não é recalculada em scroll, popover "descola" do gatilho

- **Categoria:** bug
- **Severidade:** média
- **Arquivo(s):** `src/components/MaxPopover.vue:103-131`, `src/components/MaxPopoverConfirm.vue:46-62`, `src/components/MaxButtonConfirm.vue:63`, `src/components/MaxIconConfirm.vue:67`, `src/components/MaxTogglePopover.vue:91`
- **Domínio:** overlays-navegacao

## Problema

**MaxPopover** posiciona o painel via `useElementBounding(btn_el)` (linha 103) e um `computed` `position` (linhas 111-131) que usa `x`, `y`, `width_btn`, `height_btn`. O painel é `position: fixed` (linha 183), ou seja, suas coordenadas são relativas à viewport. Se `useElementBounding` do `@maxvue/max-use` não estiver observando `scroll`/`resize` de forma contínua enquanto o popover está aberto, o painel permanece nas coordenadas do momento da abertura e se descola do gatilho quando a página rola.

**MaxPopoverConfirm** é pior por construção: a posição vem de valores **congelados no store** (`confirm_store.x`, `.y`, `.width`, `.height` — `src/components/MaxPopoverConfirm.vue:48-49`), capturados uma única vez no clique do gatilho:
- `src/components/MaxButtonConfirm.vue:63,71-74`
- `src/components/MaxIconConfirm.vue:67,75-78`
- `src/components/MaxTogglePopover.vue:91,99-102`
- `src/components/MaxUserAvatar.vue:45-49` (via `getBoundingClientRect()` direto)

Depois disso não existe nenhum mecanismo de atualização: nem listener de `scroll`, nem de `resize`, nem reavaliação do bounding do gatilho. O único recálculo é o do `computed` `position` (linha 46), que só reage a `width`/`height` do próprio diálogo e ao tamanho da janela — não à posição do gatilho.

Nenhum dos dois componentes fecha automaticamente ao rolar, que é a estratégia alternativa comum.

## Impacto

Rolar a página com um popover ou uma confirmação aberta faz o balão flutuar sobre conteúdo não relacionado, com a "setinha" (`::before`, `MaxPopover.vue:198`) apontando para o vazio. Em telas com listas roláveis (o caso típico do `MaxIconConfirm` numa linha de tabela), a confirmação aparece visualmente ancorada em outra linha, criando risco real de o usuário confirmar a ação achando que é de outro item.

## Plano de correção

1. **MaxPopoverConfirm:** em vez de coordenadas congeladas, guardar no `useConfirmStore` uma referência ao elemento gatilho (`trigger_el: HTMLElement | null`) e derivar as coordenadas com `useElementBounding` reativo dentro do `MaxPopoverConfirm`, ou registrar `window.addEventListener('scroll', recalc, { capture: true, passive: true })` + `resize` enquanto `confirm_store.show` for verdadeiro, removendo-os no fechamento e em `onBeforeUnmount`.
2. **Alternativa mais simples e segura:** fechar o overlay ao detectar scroll no ancestral rolável (`confirm_store.hide()`), evitando qualquer estado desancorado. Decidir com o time qual das duas estratégias adotar.
3. **MaxPopover:** confirmar no `@maxvue/max-use` se `useElementBounding` já registra listeners de `scroll`/`resize` contínuos. Se não registrar (ou se registrar apenas no mount), adicionar recálculo explícito enquanto `isOpen` for verdadeiro, e remover os listeners no fechamento e no unmount para não vazar.
4. Em ambos os casos, usar `{ passive: true }` nos listeners de scroll e limpá-los em `onBeforeUnmount`.

## Verificação

- Teste em `tests/components/MaxPopoverConfirm.test.ts`: abrir a confirmação com `confirm_store.confirm({ ..., y: 100 })`, alterar a posição simulada do gatilho, disparar `window.dispatchEvent(new Event('scroll'))` e afirmar que o `style.top` do `.max-icon-confirm-dialog` mudou (ou que o overlay fechou, conforme a estratégia escolhida).
- Teste de limpeza: abrir, desmontar e afirmar que `window.removeEventListener` foi chamado para os mesmos handlers (espiar com `vi.spyOn(window, 'removeEventListener')`).
- `npx vitest run tests/components/MaxPopoverConfirm.test.ts tests/components/MaxPopover.test.ts`
