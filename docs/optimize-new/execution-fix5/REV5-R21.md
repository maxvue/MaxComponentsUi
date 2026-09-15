# REV5-R21 — E11-03: SVGO, regressão visual e grafo transitivo

## Escopo e referência

Refutação independente, somente leitura, no HEAD `7668372d9efc92f9c0cf4659df98634a03f89268` da worktree
`wt-optimize-fix5`. O critério de R21 exige `optimize-svgs --check` integrado ao
verify/CI, regressão visual e prova por grafo transitivo de que importar uma
bandeira **ou componente** não referencia todas as demais bandeiras.

## Evidência executada

```text
$ npm run check:svgo
✅ Verificação SVGO: todos os SVGs de bandeiras estão otimizados e idempotentes.

$ npm run build:clean
✓ built in 17.35s

$ npx vitest run tests/assets/creditCardAssetsOptimization.test.ts
Test Files  1 passed (1)
Tests  14 passed (14)

$ npx vitest run --config vitest.browser.config.ts tests/browser/MaxCreditCard.browser.ts
Test Files  1 passed (1)
Tests  6 passed (6)
```

`package.json` expõe `check:svgo` e `scripts/verify.mjs` o chama na etapa
`SVGO`. A referência visual versionada
`tests/browser/__screenshots__/MaxCreditCard.browser.ts/max-credit-card-visa-chromium-linux.png`
está rastreada e o cenário Chromium passou.

## Caso adversarial e achado

Após o build limpo, o chunk de componente emitido é
`dist/MaxCreditCard-DNkl4BcB.js`. Ele contém o mapa `g` com as nove arestas
dinâmicas:

```text
amex:()=>import("./card-amex-D00fLrEj.js")
...
visa:()=>import("./card-visa-PmbfG7AT.js")
```

Logo, importar `MaxCreditCard` referencia transitivamente todas as nove
bandeiras, embora cada chunk de bandeira isolado não referencie os demais. O
teste adicionado só inicia a travessia em cada `card-*.js`; não inicia em
`MaxCreditCard-*.js`, e por isso não captura a parte “bandeira/componente” do
contrato. A referência `aac16bca` falha o novo caso de ausência de `dist`, mas
o HEAD atual ainda falha este caso adversarial de componente.

## Veredito

**REJEITADO.** SVGO, regressão visual e isolamento de chunk individual foram
confirmados; a prova/implementação para importação de componente não foi
entregue. O implementador deve separar a seleção de loader para que o chunk de
`MaxCreditCard` não tenha referências a todas as bandeiras, ou ajustar a
arquitetura de exports/consumo conforme o contrato, e adicionar um teste de
grafo cujo ponto de entrada seja o componente.
