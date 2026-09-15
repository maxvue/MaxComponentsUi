# PRES5-F03 — preservação de `useMirroredModel`

- Papel: auditoria somente leitura do bloco aceito F03 (E02-02).
- Agente: `/root/pres5_f03`.
- Início: `2026-09-15T16:54:00-03:00`.
- Fim: `2026-09-15T16:55:00-03:00`.
- HEAD auditado: `aa27fc7aa307d58a7fe143a95a5126db94b1c51c`.

## Escopo exclusivo

Foram inspecionados exclusivamente `src/helpers/useMirroredModel.ts` e
`tests/helpers/useMirroredModel.test.ts`. O helper mantém presença e valor
separados: `hasLastCanonical` distingue a ausência de histórico de um valor
canônico legítimo `undefined`.

## Comandos e saída

```text
$ npx vitest run tests/helpers/useMirroredModel.test.ts
Test Files  1 passed (1)
Tests  15 passed (15)
Duration  732ms

$ npm run type-check:test
vue-tsc -p tsconfig.test.json --noEmit
exit 0

$ git diff --exit-code aa27fc7a -- src/helpers/useMirroredModel.ts tests/helpers/useMirroredModel.test.ts
exit 0
```

O caso focal cobre `T = string | undefined`: emissão local de `undefined`,
eco equivalente do pai sem reemissão, alteração externa posterior definida e
nova transição local para `undefined`.

## Veredito

**ACEITO.** F03 permanece preservado no HEAD auditado, com 15 testes focais e
type-check de testes aprovados.
