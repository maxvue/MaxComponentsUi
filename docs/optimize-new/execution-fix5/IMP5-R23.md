# IMP5-R23 — runner Vue para benchmarks

- Papel: `IMP5-R23`
- Agente: `/root/imp5_r23`
- Parent: `/root`
- Início: `2026-09-15T15:32:00-03:00`
- Fim: `2026-09-15T15:34:16-03:00`
- HEAD auditado: `f38c9b70`
- Manifesto: `.gitignore`, `package.json`, `tests/benchmarks/run-benchmarks.ts`, `tests/benchmarks/run-benchmarks.test.ts`, este relatório e a matriz.

## Reprodução

Comando:

```sh
npm run test:benchmark
```

Saída antes da correção:

```text
TypeError [ERR_UNKNOWN_FILE_EXTENSION]: Unknown file extension ".vue"
for .../src/components/base/MaxBaseVirtualScroller.vue
```

O `tsx` executava TypeScript, mas não aplicava a transformação SFC do Vue.

## Red/green

Foi adicionado primeiro `tests/benchmarks/run-benchmarks.test.ts`, que exige a API de execução e valida o artefato com componente esperado e 12 métricas. Antes da implementação, o teste falhou com:

```text
TypeError: executarEGravarBenchmarks is not a function
```

Depois, `test:benchmark` passou a usar o runner Vitest (Vite + `@vitejs/plugin-vue` do `vitest.config.ts`) e o runner exporta a operação de geração, sem efeito colateral no import.

## Validação

```sh
npm run test:benchmark
test -f tests/benchmarks/benchmark-results.json
node -e "const r=require('./tests/benchmarks/benchmark-results.json'); if(r.component!=='MaxBaseVirtualScroller'||r.metrics.length!==12) process.exit(1); console.log('artefato validado:',r.metrics.length,'métricas')"
```

Saída relevante:

```text
Test Files  1 passed (1)
Tests       1 passed (1)
artefato validado: 12 métricas
```

O artefato é regenerado em `tests/benchmarks/benchmark-results.json` e é deliberadamente não versionado.
