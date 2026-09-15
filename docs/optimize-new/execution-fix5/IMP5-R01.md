# IMP5-R01 — gate canônico, distribuição e reprodutibilidade

- Head auditado: `b44e6b74` (antes das alterações deste papel).
- Manifesto: `package.json`, `scripts/build-clean.mjs`, `scripts/verify.mjs`, `scripts/verify.test.mjs`, `scripts/verify-reproducibility.mjs`, `.github/workflows/quality.yml` (inspecionado; já executa `npm ci` seguido de `npm run verify`).
- Sem alterações em lockfile: o `check:lockfile` existente já valida manifest/lock nos dois sentidos.

## Reprodução do baseline

Antes de `npm ci`, `npm run verify` falhou no primeiro gate de tipos de teste com `TS2307: Cannot find module 'svgo'`. A falha foi causada pela ausência deliberada de `node_modules` no worktree, não pelo lockfile: após `npm ci`, foram instalados 718 pacotes, a auditoria informou 0 vulnerabilidades e o mesmo type-check encontrou o módulo.

O contrato anterior também foi inspecionado: `verify` encadeava comandos com `&&`, executava os testes antes de `build` e não chamava cobertura, browser, playground, SVGO, benchmark, budgets, `npm ls`, audit ou o segundo verificador de consumidores.

## Implementação

`npm run verify` agora chama `scripts/verify.mjs`, que registra o resultado de todas as 18 etapas e só retorna erro depois de terminar a lista. O primeiro build é `build:clean`, que remove `dist` antes de invocar a build; portanto testes de `dist` nunca observam artefato antigo. A sequência inclui type-check/lint, unitários, cobertura, browser, playground com budget, SVGO, benchmark, budgets de distribuição, `npm ls --all`, `npm audit --audit-level=high`, os dois conjuntos de consumidores e duas instalações `npm ci` isoladas.

O workflow de CI já consome exclusivamente `npm run verify` após `npm ci`, portanto herda o gate canônico sem duplicar uma lista divergente de comandos.

## Complemento: axe-core real

Após a constatação de R08, `axe-core@4.11.0` foi adicionado como dependência de desenvolvimento e ao lockfile. O novo comando `npm run test:axe` executa um cenário Chromium com o motor oficial, verifica zero violações WCAG 2 A/AA em um diálogo nomeado e prova a sensibilidade do gate ao remover o nome de um botão (violação `button-name`). O comando integra o `verify` como etapa separada de `test:browser`; os cenários de componentes de F14/R08 podem reutilizar esse motor sem mocks.

## Comandos e saída relevante

```text
$ npm ci
added 718 packages, and audited 719 packages
found 0 vulnerabilities

$ npm run verify:reproducibility
added 718 packages in 9s
✓ npm ci reprodutível 1/2 em checkout limpo.
added 718 packages in 9s
✓ npm ci reprodutível 2/2 em checkout limpo.

$ npm run test:verify-gate
✔ o gate canônico executa todas as etapas mesmo após uma falha
tests 1; pass 1; fail 0

$ git diff --check
saída vazia (sucesso)
```

Uma execução integral de `npm run verify` foi iniciada após o `npm ci`: o build limpo passou (`vite ... ✓ built in 12.08s`) e o executor percorreu até `verify:reproducibility`, sem retorno antecipado. A validação final do conjunto completo deve ser repetida na Etapa 15, depois das mudanças dos demais owners, conforme contrato.
