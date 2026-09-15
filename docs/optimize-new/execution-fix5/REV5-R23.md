# REV5-R23 — E11-02: benchmark Vue em checkout limpo

## Escopo e referência

Refutação independente, somente leitura, pelo agente `/root/rev5_r23`, parent
`/root`, no HEAD `3547bbdb1b562efc7ce78add1ec84cb3d5f4d6e5`, confrontado com
`aac16bca`. O contrato exige que `npm run test:benchmark` tenha um loader Vue
compatível, produza artefato comparável em checkout limpo e não emita
`ERR_UNKNOWN_FILE_EXTENSION`.

## Caso adversarial

Em um worktree descartável do commit `aac16bca`, após `npm ci`, o comando
`npm run test:benchmark` ainda invoca `npx tsx tests/benchmarks/run-benchmarks.ts`.
Ao importar `MaxBaseVirtualScroller.vue`, termina com código não zero e:

```text
TypeError [ERR_UNKNOWN_FILE_EXTENSION]: Unknown file extension ".vue"
```

Portanto o caso adversarial falha na referência exigida, sem depender de
artefatos ou dependências pré-instaladas no checkout auditado.

## Evidência independente no HEAD

Em outro worktree novo, destacado no HEAD auditado, foram executados:

```text
$ npm ci
added 719 packages, and audited 720 packages in 11s
found 0 vulnerabilities

$ npm run test:benchmark
RUN  v4.1.11
Test Files  1 passed (1)
Tests       1 passed (1)
Duration    1.20s
```

O script atual chama `vitest run tests/benchmarks/run-benchmarks.test.ts`.
Assim, o transformador Vite/Vue do Vitest processa o SFC importado pelo
benchmark, eliminando o caminho `tsx` que falhava na referência. A saída não
contém `ERR_UNKNOWN_FILE_EXTENSION`.

Após a execução, a validação independente do JSON gerado em
`tests/benchmarks/benchmark-results.json` confirmou:

```json
{
  "component": "MaxBaseVirtualScroller",
  "metrics": 12,
  "node": "v24.18.0",
  "phases": ["mount", "input", "scroll", "cleanup"],
  "cardinalities": [100, 1000, 10000]
}
```

Cada métrica possui `durationMs`, `avgMs` finitos e `iterations > 0`. O
artefato tem esquema estável para comparação entre execuções, preservando
timestamp, versão do Node e versão do Vitest como metadados de contexto.

## Veredito

**ACEITO.** A referência reproduz a extensão desconhecida em checkout limpo,
enquanto o HEAD usa o pipeline Vue do Vitest, passa de forma independente e
gera o artefato comparável obrigatório.
