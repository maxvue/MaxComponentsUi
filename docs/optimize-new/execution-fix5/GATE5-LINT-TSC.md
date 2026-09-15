# GATE5-LINT-TSC — relatório de execução

- Papel: `GATE5-LINT-TSC` (somente leitura de código).
- Agente: `/root/gate5_lint_tsc`; parent: `/root`.
- Início: `2026-09-15T16:33:00-03:00`; fim: `2026-09-15T16:34:51-03:00`.
- HEAD auditado: `1a4a6f432c195d29d4daa792604693f858810559` (`fixes/optimize-fix5`).
- Manifest: somente este relatório e a linha correspondente da matriz; nenhum arquivo de código alterado.

## Ordem canônica e resultados

1. `npm run build:clean` — **PASSOU** (código 0, 17,9 s). O script executou `vue-tsc && vite build` a partir de `dist` limpo. Vite transformou 382 módulos; `dist/style.css` ficou em 336,10 kB (gzip 39,44 kB) e `dist/index.es.js` em 15,43 kB (gzip 5,44 kB). Não houve warnings ou erros.
2. `npm run type-check` — **PASSOU** (código 0). Executou `vue-tsc --noEmit` sem diagnóstico.
3. `npm run type-check:test` — **FALHOU** (código 2). A execução posterior de `npm run lint:check` foi feita isoladamente para não ocultar este gate.
4. `npm run lint:check` — **FALHOU** (código 1): 11 erros e 2 avisos ESLint; por causa de `eslint . && stylelint ...`, Stylelint não chegou a executar.

## Diagnósticos que reprovam

### Type-check dos testes

`vue-tsc -p tsconfig.test.json --noEmit` não resolve `@maxvue/max-components-ui` em 67 imports de cenários de `playground/src/scenarios/` (de `buttons-badges.vue` a `trans-motion.vue`). Além disso, há quatro erros próprios de testes:

- `tests/browser/InputBaseForms.browser.ts:223-224`: `unmount` e `remove` inexistentes em tipo `never`;
- `tests/browser/MaxFocusStack.browser.ts:72`: `"file"` não é atribuível a `MarkdownToolbarTool`;
- `tests/browser/r04Autofill.fixture.ts:11`: callback de `string` não aceita `string | number | undefined`.

### Lint

ESLint reportou os seguintes problemas, todos no HEAD auditado:

- `src/components/base/MaxBaseVirtualScroller.vue:172,176,181,184,191,197`: 6 erros `curly` (chaves desnecessárias);
- `tests/assets/creditCardAssetsOptimization.test.ts:47,274`: 2 erros `curly`; `:272`: 1 aviso de `distFiles` não usado;
- `tests/browser/motionReduced.browser.ts:83`: 1 erro `curly`; `:90`: 1 aviso de `components` não usado;
- `tests/themes/tokensMutationReal.test.ts:167,194`: 2 erros `curly`.

Saída final: `✖ 13 problems (11 errors, 2 warnings)`; 11 erros são marcados pelo ESLint como potencialmente corrigíveis por `--fix`.

## Veredito

**REJEITADO.** A biblioteca compila e seu type-check passa após build limpo, mas o type-check dos testes e o lint falham. Não se executou correção, pois este papel é de gate somente leitura.
