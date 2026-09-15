# IMP5-R09 — E04-06/E04-07

## Identidade e manifesto

- Papel: `IMP5-R09` (viewport de overlays).
- Agente: `/root/imp5_r09`.
- Início: `2026-09-15T14:45:00-03:00`.
- Fim: `2026-09-15T14:53:00-03:00`.
- HEAD auditado: worktree em `fixes/optimize-fix5` (alterações ainda não commitadas, por orientação do coordenador).
- Arquivos sob ownership: `src/components/base/MaxBaseOverlay.vue`, `src/composables/useActiveOverlayPosition.ts`, seus testes, este relatório e a linha correspondente da matriz.
- Fora do ownership: `package.json`, lockfile, CI e scripts de gate.

## Reprodução (red)

O cálculo anterior tratava a origem da viewport visual como `(0, 0)`. Com uma `VisualViewport` de 280×200, `offsetLeft=40`, `offsetTop=300`, zoom 200% e safe-area, ele produzia limites relativos à janela inteira; o painel podia ficar atrás da borda deslocada e sem área de toque. Também usava a altura/largura integral de conteúdo mesmo quando maior que a janela móvel.

Os novos cenários foram deliberadamente construídos para falhar nessa implementação: exigem `left=120` e `top=318`/`338`, derivados dos limites visuais deslocados, em vez do clamp anterior sem offsets.

## Correção

- `useActiveOverlayPosition` inclui `visualViewport.offsetLeft` e `offsetTop` nos quatro limites, somando os tokens `--safe-area-*` e a margem mínima de 8 px.
- `MaxBaseOverlay` usa o mesmo espaço de coordenadas, tokens de safe-area e limites em `position: fixed`.
- Quando o conteúdo excede a área segura, ambos os cálculos usam a área efetivamente visível; o componente aplica `maxWidth`, `maxHeight` e `overflow: auto`, preservando uma região rolável e atingível.
- A cobertura unitária exerce zoom 200%, deslocamento de viewport visual, scroll, safe-area e viewport de 280 px. A cobertura Chromium verifica margem, scroll interno e hit-test real do `MaxBaseOverlay` em 280 px; o cenário existente cobre 320 px em landscape e zoom 200%.

## Verificação executada

```text
$ npm test -- --run tests/composables/useActiveOverlayPosition.test.ts tests/components/base/MaxBaseOverlay.test.ts
Test Files  2 passed (2)
Tests  32 passed (32)

$ npm run test:browser -- --run tests/browser/layersMobileClamp.browser.ts
Test Files  1 passed (1)
Tests  6 passed (6)

$ npx eslint src/components/base/MaxBaseOverlay.vue src/composables/useActiveOverlayPosition.ts tests/components/base/MaxBaseOverlay.test.ts tests/composables/useActiveOverlayPosition.test.ts tests/browser/layersMobileClamp.browser.ts
exit 0

$ git diff --check
exit 0
```

O cenário Chromium ainda emite avisos preexistentes de `Failed to resolve directive: tooltip` de `MaxPopover`; eles não são produzidos por `MaxBaseOverlay` e permanecem bloqueio para o gate global de browser.

## Veredito

**IMPLEMENTADO — E04-06/E04-07 pronto para refutação independente (`REV5-R09`).**
