# Lote 05 — Design system, motion e playground

## Escopo

Blocos `R17`, `R16`, `R18` e `R19`.

- `R17`: CSS computado de variantes, severidades e estados; mutação de token-fonte deve quebrar o mesmo gate.
- `R16`: consumidores reais montados; foco/contraste computados em claro, escuro, forced-colors, zoom e Tab; classificar/eliminar `--background-650`.
- `R18`: inventário derivado do código; `reduce`/`no-preference`, transform, duração, iteração e lifecycle por classe.
- `R19`: playground sem warnings de imports, loaders/estados reais e maior chunk estritamente abaixo dos baselines auditados de 2.507.440 bytes brutos e 823.120 bytes gzip, medido pelo script canônico.

Auxiliares sugeridos: contraste/foco e motion/playground. O líder controla tokens, inventários e integração visual. Crie um browser dedicado de contraste/tokens computados se a prova real ainda não existir; happy-dom ou leitura de SCSS não substitui CSS computado.

```bash
npx vitest run tests/themes/tokensMutationReal.test.ts tests/themes/textColorValidation.test.ts tests/components/MaxDarkModeContrast.test.ts tests/architecture/focusVisibleInventory.test.ts tests/architecture/motionStandardsValidation.test.ts tests/architecture/playgroundCoverage.test.ts
npx vitest run --config vitest.browser.config.ts tests/browser/FocusVisibleInventory.browser.ts tests/browser/motionStandardsReducedMotion.browser.ts
npm run check:playground:bundle
```

Não aceite DOM artificial, regex genérica ou classe ausente pulada condicionalmente.
