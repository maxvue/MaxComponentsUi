# REV5-R03 — refutação independente de E03-01

## Identidade

- Papel: `REV5-R03` — refutação somente leitura de R03/E03-01.
- Agente: `/root/rev5_r03`; parent: `/root`.
- Início: `2026-09-15T15:49:00-03:00`; fim: `2026-09-15T15:51:00-03:00`.
- HEAD auditado: `ba999e0b`.
- Referência adversarial: `aac16bca`.
- Manifesto próprio: este relatório e a linha `REV5-R03` em `MATRIZ_ORQUESTRACAO.md`. Nenhum arquivo de produção ou teste foi alterado.

## Caso adversarial e reprodução na referência

O diff `aac16bca..ba999e0b` mostra que a referência só controlava a tag do nó,
a classe canônica irmã e a cardinalidade. Ela não registrava `parentTag`,
classes do pai ou classes dos ancestrais. Portanto, a seguinte mutação
plausível preservava todos os predicados antigos: remover `p-datatable` de
`.max-table` e acrescentá-la à `div.max-table-container`, junto de
`.max-table`. A alias continuava numa `div`, com a classe irmã e a mesma
quantidade, mas fora da anatomia canônica.

No HEAD, a mutação é exercida pelo mesmo auditor AST em
`tableAnatomyConsistency.test.ts`, e exige a violação de localização
canônica. A nova regra de `p-datatable` exige pai imediato
`.max-table-main-div`; a `div.max-table-container` não o possui.

## Verificação independente no HEAD

```text
$ npx vitest run tests/architecture/tableAnatomyConsistency.test.ts
Test Files  1 passed (1)
Tests  15 passed (15)

$ npx vitest run tests/architecture/tableAnatomyConsistency.test.ts -t 'div plausível'
Test Files  1 passed (1)
Tests  1 passed | 14 skipped (15)
```

Também foi inspecionada a anatomia real de `src/components/MaxTable.vue`: o
alias `p-datatable` está na `div.max-table`, filha de
`.max-table-main-div`; `p-datatable-table-container` é filha de
`.max-table`; aliases de célula, coluna e linha exigem o caminho de tabela
correspondente. O auditor extrai pai e ancestrais a partir do AST de template,
não de busca textual.

## Veredito

**ACEITO.** E03-01 agora valida pai, caminho e localização canônicos, além de
tag, classe irmã e cardinalidade. A mutação de uma `div` plausível é detectada
pelo mesmo gate computado que audita a anatomia real.
