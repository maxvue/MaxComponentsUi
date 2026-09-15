# REV5-R01 — auditoria adversarial de reprodutibilidade e gate canônico

- Papel: `/root/rev5_r01` (refutação independente, somente leitura de produto)
- Início: `2026-09-15T17:53:00-03:00`
- Fim: `2026-09-15T17:57:00-03:00`
- Referência adversarial: `aac16bca`
- HEAD auditado: `f6b506641b6834d1d609b1441be75647802c7a8f`

## Escopo e comparação

Foram revisados `package.json`, `package-lock.json`, `.npmrc`,
`scripts/check-lockfile.mjs`, `scripts/verify.mjs`,
`scripts/verify-reproducibility.mjs`, validadores de consumidores e o workflow
de qualidade. Em relação a `aac16bca`, o HEAD introduz o executor canônico, o
build limpo, a instalação isolada em duplicidade e os validadores de consumo.
Não foi modificado arquivo de produto nesta auditoria.

## Tentativas de refutação e evidências

| Tentativa | Evidência atual | Resultado |
|---|---|---|
| Dependência local, link, worktree ou `legacy-peer-deps` oculto | Varredura de manifesto, lock, `.npmrc`, scripts e workflow não encontrou especificação ativa proibida. `check-lockfile` rejeita protocolos/caminhos locais, `link`/`symlink` e chaves fora de `node_modules/`. | Refutada |
| Divergência unilateral manifesto/lock | O comparador cobre `dependencies`, `devDependencies`, `peerDependencies`, `optionalDependencies` e `peerDependenciesMeta` nos dois sentidos; a raiz do lock coincide em todas as cinco seções (23/44/5/0/2 entradas). | Refutada |
| Pipeline que retorna cedo ou testa `dist` obsoleto | `scripts/verify.mjs` lista 19 etapas e acumula falhas; `scripts/verify.test.mjs` provou a execução integral mesmo quando a segunda etapa falha. O build `build:clean` precede testes e ambos os validadores de consumidores o repetem antes de `npm pack`. | Refutada |
| Instalação dependente de repositório irmão | `npm run verify:reproducibility` copiou somente manifesto, lock e `.npmrc` para dois diretórios temporários independentes e ambos executaram `npm ci` com sucesso (719 pacotes; 11 s e 9 s). | Refutada |
| Árvore/audit não verificadas | `npm ls --all` retornou 0 e `npm audit --audit-level=high` reportou `found 0 vulnerabilities`. | Refutada |

## Comandos executados

```text
npm run check:lockfile                                      # passou
node --test scripts/verify.test.mjs                         # 1/1 passou
npx vitest run tests/architecture/lockfileValidation.test.ts # 17/17 passou
npm run verify:reproducibility                              # 2/2 npm ci passaram
npm ls --all                                                # código 0
npm audit --audit-level=high                                # 0 vulnerabilidades
npm run check:filenames                                     # 1083 arquivos válidos
```

O workflow `.github/workflows/quality.yml` executa `npm ci` seguido somente de
`npm run verify`, portanto não mantém uma lista divergente de gates. O executor
inclui lock, build limpo, type-checks, lint, testes/cobertura/browser/axe,
playground, SVGO, benchmark, budgets, árvore, audit, ambos os consumidores e
reprodutibilidade.

## Veredito

**ACEITO.** R01/E01-02, E01-03 e E01-05 está protegido contra os atalhos
locais e retornos antecipados identificados em `aac16bca`; lock, instalação
limpa, árvore, audit, consumidores e gate canônico possuem evidência executável
no HEAD auditado.
