# Baseline Congelado — Etapa 1 (instructions_to_implementation_fix4.md)

- Data de Coleta: 2026-09-15T07:47:00Z
- Commit Base: ea9c6869 merge: integra quarta auditoria do Antigravity
- Worktree Isolada: .worktrees/wt-fix4 (Branch fix/instructions-fix4)

## Tabela de Gates Iniciais

| Gate | Resultado | Observações / Detalhes |
|---|---|---|
| `npm ci` | APROVADO | 718 pacotes adicionados, 719 auditados, 0 vulnerabilidades |
| `check:filenames` | APROVADO | 957 arquivos rastreados com nomes válidos |
| `check:lockfile` | APROVADO | package-lock.json consistente |
| `npm run verify` | APROVADO | 229 arquivos, 3.294 testes unitários/integração passando |
| Cobertura Total | Statements: 86,21% \| Branches: 77,22% \| Functions: 86,95% \| Lines: 89,56% | Cumpre os thresholds mínimos exigidos |
| Build da Biblioteca | APROVADO | `dist/index.es.js`: 334.20 kB, gzip: 44.22 kB; CSS: 317.92 kB |
| Build do Playground | **FALHOU** | Rolldown não resolve import de `@maxvue/max-components-ui` em cenários |
| `scripts/verify-consumers.mjs` | PARCIAL | Node ESM, TS e Vite passaram localmente; SSR requer garantia em ambiente limpo |
| `git diff --check b6cedac7..86f43f74` | **FALHOU** | 4 ocorrências de trailing whitespace em `docs/THEME.md` e `scripts/verify-consumers.mjs` |

## Teto de Budgets Congelados

- MaxButton grafo transitivo minificado: Teto estrito de 238.886 bytes (Baseline de 477.773 bytes).
- Zero novos erros assíncronos no teardown da suíte de testes.
- Cobertura mínima obrigatória: Statements >= 85%, Branches >= 76%, Functions >= 84%, Lines >= 89%.
