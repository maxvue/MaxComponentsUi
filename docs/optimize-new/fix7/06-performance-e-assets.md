# Lote 06 — Performance, virtualização e assets

## Escopo

Blocos `R21` e `R22`.

- `R21`: build fresco, grafo transitivo de bandeiras, SVGO no CI e screenshot/snapshot visual com budgets bruto/gzip/Brotli.
- `R22`: medir no DOM número/linha no começo, meio e fim de 10 mil itens, em 100%/200%, preservando cursor, teclado e resize. Não espelhar a fórmula interna.

Os blocos podem ser auxiliares independentes. O líder coordena benchmark, artefatos e evidência visual.

```bash
npm run build
npm run optimize:svg:check
npx vitest run tests/assets/creditCardAssetsOptimization.test.ts tests/unit/svgPipeline.test.ts tests/unit/creditCardAssets.test.ts tests/architecture/MaxBaseVirtualScroller.deterministic.test.ts tests/components/base/MaxBaseVirtualScroller.test.ts tests/composables/useVirtualList.test.ts
npx vitest run --config vitest.browser.config.ts tests/browser/MaxInputTextList.browser.ts tests/browser/MaxCreditCard.browser.ts
npm run test:benchmark
```

Snapshots devem ser determinísticos; benchmark não pode atualizar rastreados como efeito colateral.
