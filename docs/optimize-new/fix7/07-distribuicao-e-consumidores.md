# Lote 07 — Distribuição e consumidores

## Escopo

Blocos `R24` e `R25`. Execute somente após os lotes 01 a 06 estarem integrados; 01, 05 e 06 são dependências técnicas diretas.

- `R24`: mapa explícito de exports, sem wildcard; CSS global opt-in; build/dist fresco obrigatório; budget transitivo real de MaxButton abaixo de 238.886 bytes.
- `R25`: diretório/tarball exclusivo e `finally` efetivo; duas execuções concorrentes; cleanup após falha forçada; Node, TS, Vite, SSR, CSS/temas e peers com/sem opcionais.

Auxiliares sugeridos: exports/tree-shaking e consumidores concorrentes. O líder é o único dono de `package*.json`, scripts de distribuição e configuração de build neste lote.

Crie `tests/integration/verifyConsumersConcurrency.test.ts` se ainda não existir. O teste deve iniciar dois verificadores simultâneos com diretórios distintos e depois forçar uma falha, comprovando que ambos os caminhos temporários foram removidos.

```bash
npm run build
npx vitest run tests/architecture/package-exports.test.ts tests/architecture/runtimeDependencies.test.ts tests/architecture/treeshaking-maxbutton.test.ts
npm run check:playground:bundle
npm run verify:consumers
npx vitest run tests/integration/verifyConsumersConcurrency.test.ts
npm run check:npm-tree
```

Não permita teste que aprove com `dist` antigo nem valide tema apenas lendo a existência física do arquivo.
