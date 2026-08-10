# Falta de teste: nenhum overlay (exceto MaxDrawer) tem teste de unmount, de teclado ou de limpeza de listeners

- **Categoria:** falta-de-teste
- **Severidade:** alta
- **Arquivo(s):** `tests/components/MaxModal.test.ts`, `tests/components/MaxPopover.test.ts`, `tests/components/MaxPopoverConfirm.test.ts`, `tests/components/MaxToast.test.ts`, `tests/components/MaxTogglePopover.test.ts`
- **Domínio:** overlays-navegacao

## Problema

A suíte de `MaxDrawer` (`tests/components/MaxDrawer.test.ts`) é exemplar: cobre focus trap (linhas 7-187), Escape (256, 263, 270), clique na máscara (240, 248), scroll lock cumulativo (319, 376, 392, 405) e o caso de `blockScroll` alternado com o drawer aberto (405).

**Nenhum outro overlay do escopo tem equivalente.** Levantamento das lacunas por arquivo de teste:

**`tests/components/MaxModal.test.ts` (15 casos, linhas 40-260):** cobre render, `toggle`, `open`/`close`/`show`/`hide`, idempotência e a sequência rápida open→close→open. **Não cobre:**
- desmontar o modal enquanto aberto (`show_id` fica preso — ver `overlays-modal-nao-desmonta-nem-restaura-estado-global-no-unmount.md`);
- timers pendentes após o unmount;
- qualquer interação de teclado (não há Escape implementado — ver `overlays-modal-sem-fechamento-por-escape.md`);
- foco (não há trap implementado);
- scroll lock (não implementado);
- dois modais simultâneos.

**`tests/components/MaxPopover.test.ts` (7 casos, linhas 53-176):** cobre render, métodos expostos, slots, posicionamento nos limites da tela, fechamento por clique no fundo e exclusão mútua entre popovers. **Não cobre:** unmount com o popover aberto, teclado (Escape/Enter no gatilho), foco, e o wrapper `.popover-item` renderizado com o popover fechado.

**`tests/components/MaxPopoverConfirm.test.ts` (7 casos, linhas 45-160):** cobre render condicional, `accept`/`reject`, `hide` e reposicionamento. **Não cobre:** Escape, foco nos botões, e recálculo de posição em scroll.

**`tests/components/MaxToast.test.ts` (9 casos, linhas 35-131):** cobre render, severidades, remoção por clique, múltiplos toasts e pause/resume por hover. **Não cobre:** `aria-live`, pausa por foco de teclado, e limpeza da fila no unmount.

**`tests/components/MaxTogglePopover.test.ts` (5 casos):** cobre a escrita no `confirm_store` e o não-vazamento de `messageIcon`. **Não cobre:** que o botão está de fato **visível** no DOM (os testes usam `findComponent`, que passa mesmo com o botão dentro de um painel fechado — ver `overlays-toggle-popover-envolve-maxpopover-sem-usar-o-overlay.md`).

Padrão comum a todos: **nenhum teste chama `wrapper.unmount()` para verificar limpeza de estado global ou de listeners.** Como todos os overlays escrevem em stores singleton (`useModalStore`, `usePopoverStore`, `useConfirmStore`, `useToastStore`), estado residual entre montagens é o modo de falha mais provável e é justamente o não testado.

## Impacto

As correções propostas nos demais achados deste domínio (focus trap, Escape, scroll lock, limpeza no unmount) não têm hoje nenhuma rede de testes que garanta que permaneçam corretas. Sem esses testes, cada correção é uma regressão em potencial.

## Plano de correção

Criar um bloco de testes de ciclo de vida para cada overlay, espelhando o que `MaxDrawer.test.ts` já faz. Para **cada um** de `MaxModal`, `MaxPopover`, `MaxPopoverConfirm` e `MaxToast`:

1. **Unmount limpo:** abrir o overlay, `wrapper.unmount()`, afirmar que a store correspondente voltou ao estado fechado e que nenhum nó sobrou em `document.body`.
2. **Timers órfãos:** abrir/fechar, desmontar imediatamente, `vi.advanceTimersByTime(1000)` e afirmar que nenhum erro foi lançado e que a store não foi mutada após o unmount (espiar os métodos da store).
3. **Listeners removidos:** `vi.spyOn(document, 'addEventListener')` e `removeEventListener`; afirmar que todo handler adicionado na abertura tem remoção correspondente no fechamento e no unmount.
4. **Teclado:** Escape fecha (após implementar os achados correspondentes); Tab cicla dentro do painel; foco inicial no primeiro focável; foco restaurado ao gatilho no fechamento.
5. **Múltiplas instâncias:** dois overlays do mesmo tipo montados simultaneamente não interferem no estado um do outro (ou interferem de forma documentada, ver `overlays-modal-e-popover-singleton-impede-overlays-simultaneos.md`).
6. **Isolamento entre testes:** garantir que cada `describe` faça `setActivePinia(createPinia())` no `beforeEach` e limpe `document.body` no `afterEach`, evitando que teleports de um teste vazem para o seguinte.

Escrever esses testes **antes** de aplicar as correções dos demais achados, para que sirvam de verificação executável de cada uma.

## Verificação

- `npx vitest run tests/components/MaxModal.test.ts tests/components/MaxPopover.test.ts tests/components/MaxPopoverConfirm.test.ts tests/components/MaxToast.test.ts tests/components/MaxTogglePopover.test.ts`
- `npm run test:coverage` conferindo que os arquivos de overlay sobem nas métricas de branches e functions.
- `npm run test` completo, para garantir que a limpeza adicionada nos `afterEach` não quebrou testes de outros domínios que dependiam de estado residual.
