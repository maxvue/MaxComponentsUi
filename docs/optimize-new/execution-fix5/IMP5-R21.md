# IMP5-R21 — E11-03: SVG, regressão visual e isolamento transitivo

## Escopo e reprodução

Owner: `src/helpers/creditCardAssets.ts`, `vite.config.ts`, os testes R21,
esta evidência e a linha R21 da matriz. `package.json`, CI e
`scripts/verify.mjs` não foram alterados: a
integração canônica de `npm run check:svgo` já é responsabilidade de IMP5-R01
e está presente no checkout.

O teste de distribuição anterior aceitava `dist` inexistente (`if
(fs.existsSync(...))`) e só inspecionava texto no chunk Visa. A referência
`aac16bca` contém essas duas condições (linhas 235 e 258 do teste), logo não
prova a ausência transitiva de importação das demais bandeiras nem falha sem
artefato de build.

## Reabertura após REV5-R21

O refutador identificou corretamente que, embora cada chunk `card-*.js` fosse
isolado, o chunk real `MaxCreditCard` mantinha nove `import()` dinâmicos no
registro de loaders. Portanto, seu grafo transitivo ainda alcançava todas as
bandeiras. A primeira evidência não era suficiente e foi substituída.

## Correção

- O gate focal agora exige `dist` criado por build limpo; não há retorno
  antecipado quando o artefato está ausente.
- Os SVGs são publicados em `dist/assets/credit-card` pelo build e carregados
  por `fetch` relativo ao módulo. Assim o componente transfere apenas o SVG
  solicitado e deixa de possuir imports ESM das nove bandeiras.
- O teste percorre as arestas ESM estáticas e dinâmicas a partir do chunk real
  `MaxCreditCard-*.js`, exige que não alcance chunks de bandeira e confirma a
  ausência dos imports dinâmicos. Isso prova o isolamento pelo grafo do
  componente consumidor, não por busca em um chunk de asset.
- O cenário Chromium de Visa ganhou `toMatchScreenshot` com referência raster
  e tolerância explícita de 0,1%. A imagem gerada é
  `tests/browser/__screenshots__/MaxCreditCard.browser.ts/max-credit-card-visa-chromium-linux.png`;
  como o diretório é ignorado globalmente, ela deve ser adicionada ao commit
  com `git add -f` pelo integrador para que a regressão exista em checkout
  limpo.

## Evidências executadas

```text
$ npm run build:clean && npx vitest run tests/assets/creditCardAssetsOptimization.test.ts tests/unit/creditCardAssets.test.ts
✓ built in 11.66s
Test Files  2 passed (2)
Tests  20 passed (20)

$ npx vitest run --config vitest.browser.config.ts tests/browser/MaxCreditCard.browser.ts --update
Test Files  1 passed (1)
Tests  6 passed (6)
```

O build publicou os onze SVGs em `dist/assets/credit-card`; o grafo de
`MaxCreditCard` não alcançou nenhum chunk de bandeira. O comando `npm run
check:svgo` é exposto em `package.json` e invocado como etapa `SVGO` em
`scripts/verify.mjs`; essa integração preexistia nesta worktree e não foi
modificada para respeitar a serialização de R01.

## Risco e rollback

Risco baixo: o servidor que hospeda o bundle deve servir o diretório
`assets/credit-card` publicado junto dele. Rollback: reverter o loader por
URL, a cópia de assets e os testes R21; não há alteração de package ou CI
neste papel.
