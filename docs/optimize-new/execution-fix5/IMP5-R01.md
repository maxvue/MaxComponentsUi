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

## Integração R23: benchmark pelo runner Vite/Vitest

Foi revisada a alteração de R23 em `test:benchmark`: o comando deixa de usar `tsx` diretamente e passa a executar `vitest run tests/benchmarks/run-benchmarks.test.ts`. Assim o Vite aplica a transformação de SFC Vue antes de carregar `MaxBaseVirtualScroller.vue`, eliminando `ERR_UNKNOWN_FILE_EXTENSION`. A etapa `benchmarks` do gate canônico já chama esse script, portanto não houve lista paralela a alterar. A execução produziu o artefato ignorado `tests/benchmarks/benchmark-results.json` com componente `MaxBaseVirtualScroller` e 12 métricas.

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

## Remediação transversal do gate lint/type-check

No HEAD `515c3d17`, o gate `GATE5-LINT-TSC` apontou falhas independentes de lint e de tipos que impediam a validação final. A resolução de `@maxvue/max-components-ui` no `tsconfig.test.json` agora aponta para `src/index.ts`, como já faz o alias do Vite do playground. Isso faz com que os cenários importados pelo smoke sejam type-checkados contra a API local após o build, sem depender de pacote irmão ou de um `dist` previamente publicado.

Foram eliminados os 11 erros `curly`, os dois avisos de variável não usada, o uso SCSS obsoleto de `clip`, o espaçamento obrigatório antes de comentário SCSS e os quatro erros TypeScript dos testes recentes. Em especial, o teardown da matriz de formulários passa por uma função tipada — evitando o estreitamento incorreto para `never` dentro do loop assíncrono — e o handler de `modelValue` aceita o contrato público `string | number | undefined`.

Comandos de aceite executados nesta rodada:

```text
$ npm run lint:check
eslint . && stylelint "src/**/*.{scss,vue}"
exit 0

$ npm run type-check:test
vue-tsc -p tsconfig.test.json --noEmit
exit 0

$ npm run type-check
vue-tsc --noEmit
exit 0

$ git diff --check
saída vazia (sucesso)
```
