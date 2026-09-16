# Lote 01 — Infraestrutura, console e gates

## Escopo

Blocos `R01`, `R02` e `R23`. Torne o pipeline confiável antes do aceite dos demais lotes.

- `R01`: verify/CI com audit, instalações limpas, lock bidirecional e coerência importação↔declaração com consumidores/peers reais.
- `R02`: remover allowlist global de `AbortError`/`ERR_CANCELED`, eliminar a origem e detectar warning/erro tardio após teardown em unitário, cobertura e browser.
- `R23`: runner Vue funcional; remover caminho `tsx` incapaz de importar SFC; separar benchmark temporal da suíte determinística e não alterar arquivo rastreado.

## Ownership e aceite

Ownership: `package*.json`, CI, `scripts/check-lockfile.mjs`, configurações Vitest, política de console e benchmark. Reserve arquivos compartilhados na matriz. Auxiliares sugeridos: diagnóstico de console e diagnóstico de benchmark; o líder mantém package/CI.

```bash
npm run check:lockfile
npm ls --all
npm audit --omit=dev --audit-level=high
npx vitest run tests/architecture/lockfileValidation.test.ts tests/core/warningTrap.test.ts
npm run type-check:test
npm run test:benchmark
npm run check:npm-tree
npm run verify:consumers
```

Aceite exige erro tardio realmente reprovado, benchmark sem sujar Git, `npm ls --all` e audit de severidade alta integrados ao verify/CI, sem remoção de gates. Falha de rede no audit é bloqueio externo; vulnerabilidade é falha técnica. As instalações limpas pertencem ao aceite final.
