# REV5-R21 — E11-03: SVGO, regressão visual e grafo transitivo

## Escopo e referência

Revalidação independente (retry do mesmo papel), somente leitura, pelo agente
`/root/rev5_r21_retry`, parent `/root`, na worktree `wt-optimize-fix5`, HEAD
`f38c9b70546a7a472ee71afb524a5c61a8b7a508`. A refutação anterior foi
reproduzida no commit de referência `aac16bca`: o componente tinha nove
`import()` para os chunks de bandeira. O critério de R21 exige `optimize-svgs
--check` integrado ao verify/CI, regressão visual e a prova de que o grafo ESM
transitivo de `MaxCreditCard` não importa todas as bandeiras.

## Evidência independente executada

```text
$ npm run check:svgo
✅ Verificação SVGO: todos os SVGs de bandeiras estão otimizados e idempotentes.

$ npm run build:clean
✓ built in 11.34s

$ npx vitest run tests/assets/creditCardAssetsOptimization.test.ts tests/unit/creditCardAssets.test.ts
Test Files  2 passed (2)
Tests  20 passed (20)

$ npx vitest run --config vitest.browser.config.ts tests/browser/MaxCreditCard.browser.ts
Test Files  1 passed (1)
Tests  6 passed (6)
```

O build limpo publicou exatamente os 11 SVGs em
`dist/assets/credit-card/`, incluindo as nove bandeiras. O chunk real emitido
para o componente foi `dist/MaxCreditCard-Cnwk8Du_.js`. A travessia de todas
as suas arestas ESM estáticas e dinâmicas não encontrou nenhum chunk
`card-*.js`; de fato, o build já não emite chunks JavaScript de bandeiras.
Inspeção direta desse chunk também não encontrou nenhum `import(`, nem
`import("./card-...")`. A seleção de arquivo permanece um mapa de nomes e usa
`fetch(new URL(...))`, portanto somente o SVG solicitado é transferido em
runtime, sem aresta ESM para as outras oito bandeiras.

`package.json` expõe `check:svgo`, e `scripts/verify.mjs` o executa na etapa
`SVGO`. A referência raster está versionada em
`tests/browser/__screenshots__/MaxCreditCard.browser.ts/max-credit-card-visa-chromium-linux.png`;
o cenário Visa de Chromium, com `toMatchScreenshot` e tolerância explícita de
0,1%, passou na reexecução.

## Caso adversarial e veredito

O caso que rejeitou a primeira implementação — partir do chunk
`MaxCreditCard` e procurar as nove arestas dinâmicas de bandeira — não se
reproduz neste HEAD: as arestas foram removidas, os assets são publicados e o
teste focal agora inicia a travessia no próprio chunk do componente. A leitura
da versão de referência `aac16bca` confirma as duas condições adversariais:
ela aceitava `dist` ausente e mantinha os loaders como `import()` dos SVGs,
enquanto o HEAD exige build limpo e assets publicados.

**ACEITO.** SVGO, publicação dos assets, regressão visual Chromium e
isolamento do grafo ESM transitivo de `MaxCreditCard` foram verificados
independentemente no HEAD indicado.
