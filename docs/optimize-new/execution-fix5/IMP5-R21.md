# IMP5-R21 — E11-03: SVG, regressão visual e isolamento transitivo

## Escopo e reprodução

Owner: `tests/assets/creditCardAssetsOptimization.test.ts`,
`tests/browser/MaxCreditCard.browser.ts`, esta evidência e a linha R21 da
matriz. `package.json`, CI e `scripts/verify.mjs` não foram alterados: a
integração canônica de `npm run check:svgo` já é responsabilidade de IMP5-R01
e está presente no checkout.

O teste de distribuição anterior aceitava `dist` inexistente (`if
(fs.existsSync(...))`) e só inspecionava texto no chunk Visa. A referência
`aac16bca` contém essas duas condições (linhas 235 e 258 do teste), logo não
prova a ausência transitiva de importação das demais bandeiras nem falha sem
artefato de build.

## Correção

- O gate focal agora exige `dist` criado por build limpo; não há retorno
  antecipado quando o artefato está ausente.
- Para cada um dos nove chunks de bandeira, percorre as arestas ESM estáticas
  e dinâmicas emitidas pelo Rollup. O conjunto alcançável precisa conter
  somente o próprio chunk de bandeira. Isso prova o isolamento por grafo
  transitivo, não por busca textual superficial.
- O cenário Chromium de Visa ganhou `toMatchScreenshot` com referência raster
  e tolerância explícita de 0,1%. A imagem gerada é
  `tests/browser/__screenshots__/MaxCreditCard.browser.ts/max-credit-card-visa-chromium-linux.png`;
  como o diretório é ignorado globalmente, ela deve ser adicionada ao commit
  com `git add -f` pelo integrador para que a regressão exista em checkout
  limpo.

## Evidências executadas

```text
$ npm run build:clean && npx vitest run tests/assets/creditCardAssetsOptimization.test.ts
✓ built in 13.45s
Test Files  1 passed (1)
Tests  14 passed (14)

$ npx vitest run --config vitest.browser.config.ts tests/browser/MaxCreditCard.browser.ts --update
Test Files  1 passed (1)
Tests  6 passed (6)
```

O build também emitiu os nove chunks `card-*.js`, e a travessia transitiva
aprovou cada um. O comando `npm run check:svgo` é exposto em `package.json` e
invocado como etapa `SVGO` em `scripts/verify.mjs`; essa integração preexistia
nesta worktree e não foi modificada para respeitar a serialização de R01.

## Risco e rollback

Risco baixo: os testes passam a exigir build real antes da auditoria de
distribuição e podem revelar artefato inexistente que antes era ocultado.
Rollback: reverter apenas os dois testes e remover a referência visual; não
há alteração de produção, package ou CI neste papel.
