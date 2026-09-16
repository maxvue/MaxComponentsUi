# Lote 02 — Overlays, foco e viewport

## Escopo

Blocos `F07`, `R07`, `R09` e `F15`, nesta ordem.

- `F07`: fechamento síncrono; dois eventos antes de `nextTick`, clique-through, trigger desconectado e zero listeners em Chromium.
- `R07`: unificar gestão de overlay/foco/pointer/Escape/Tab; provar IconPicker, Markdown e Popover na pilha A→B→A→gatilho.
- `R09`: aplicar offsets de `visualViewport` e safe-area; validar seta, margem, hit-test, scroll, 280/320 px, landscape e zoom 200%, sem z-index literal.
- `F15`: nome contextual obrigatório e inventário de consumidores; TagSelect `isButton` com Tab/Enter/Espaço/disabled/emissão única.

Auxiliares sugeridos: um para stack/listeners e outro para viewport/browser. O líder controla helpers compartilhados e integra ambos.

```bash
npx vitest run tests/helpers/useOutsidePointer.test.ts tests/helpers/useFocusTrap.test.ts tests/composables/useActiveOverlayPosition.test.ts tests/components/base/MaxBaseOverlay.test.ts tests/components/modalSpecializedStack.test.ts tests/components/MaxPopover.test.ts tests/components/MaxInputSelectOverlay.test.ts tests/components/MaxIconButton.test.ts tests/unit/MaxIconButton.spec.ts tests/components/MaxTagSelect.test.ts tests/unit/MaxTagSelect.spec.ts
npx vitest run --config vitest.browser.config.ts tests/browser/MaxFocusStack.browser.ts tests/browser/layersMobileClamp.browser.ts tests/browser/MaxTagSelect.browser.ts tests/browser/MaxTagSelect.adversarial.browser.ts
```

Não aceite fixture que substitua o componente real nem coalescência no lugar da remoção síncrona.
