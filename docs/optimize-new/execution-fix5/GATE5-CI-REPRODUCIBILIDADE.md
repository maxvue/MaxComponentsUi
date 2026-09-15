# GATE5-CI-REPRODUCIBILIDADE

- Papel: `/root/gate5_ci_repro`
- Parent: `/root`
- Início: `2026-09-15T17:22:00-03:00`
- Fim: `2026-09-15T17:36:00-03:00`
- HEAD auditado: `cabb5d710f452a8a27e34d92210a28261491f8ac`
- Escopo: somente leitura; nenhum arquivo de código, manifesto ou lockfile foi alterado.

## Evidências executadas

| Comando | Resultado |
|---|---|
| `npm run verify:reproducibility` | aprovado: dois checkouts temporários independentes, cada um com `npm ci --ignore-scripts --no-audit --no-fund`; 719 pacotes instalados em 12 s e 10 s. |
| `npm run check:lockfile` | aprovado: validação bidirecional de `package.json` e `package-lock.json`. |
| `npm ls --all` | código 0. As entradas `UNMET OPTIONAL DEPENDENCY` são opcionais de plataforma/integração (por exemplo, binários de outros SOs, bundlers e peers opcionais); não há dependência obrigatória ausente. |
| `npm audit --audit-level=high` | código 0; `found 0 vulnerabilities`. |
| `npm run test:verify-gate` | aprovado: o teste confirma que o pipeline percorre as 19 etapas mesmo quando uma delas falha. |
| `npm run verify` | aprovado, código 0. Execução integral em processo desacoplado com log e código de saída persistentes; alcançou build limpo, type-checks, lint, unitários, cobertura, browser/axe, playground, SVGO, benchmark, budgets, `npm ls`, audit, consumidores, CSS/temas e as duas instalações limpas finais. |

O último estágio do pipeline confirmou novamente `npm ci` em dois diretórios temporários sem uso de worktrees ou repositórios irmãos: 719 pacotes em 10 s e 9 s.

## Veredito

**ACEITO.** O lockfile, a árvore de dependências e a auditoria são reproduzíveis, e o pipeline canônico completo retornou código 0 no HEAD auditado.
