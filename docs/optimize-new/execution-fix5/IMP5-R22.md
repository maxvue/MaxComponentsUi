# Relatório — IMP5-R22

## Escopo e manifesto

- Papel: `IMP5-R22` (E11-01).
- Agente: `/root/imp5_r22`; parent: `/root`.
- Início: `2026-09-15T15:27:00-03:00`; término: `2026-09-15T15:31:39-03:00`.
- HEAD auditado: `7668372d` (havia alterações paralelas não relacionadas na worktree).
- Ownership: `src/components/MaxInputTextList.vue`,
  `tests/browser/MaxInputTextList.browser.ts`, este relatório e a linha
  `IMP5-R22` da matriz.

## Reprodução e correção

O cenário Chromium com 10.000 linhas comparava `translateY` e o índice com a
mesma fórmula interna do componente; portanto não detectava desalinhamento
real. A medição DOM independente inicialmente revelou dois defeitos: o padding
do textarea era sobrescrito por `InputBase` e, ao fim do scroll, a calha tinha
uma altura diferente da viewport do textarea e sofria clamp de scroll.

- A calha agora recebe a altura observada do textarea e usa `box-sizing:
  border-box`, mantendo o intervalo de scroll idêntico.
- O textarea preserva explicitamente seu padding de 10 px contra a regra
  prioritária de `InputBase`.
- O teste cria uma régua DOM independente com uma linha para cada uma das
  10.000 linhas. Para início, meio e fim, em zoom 100% e 200%, compara o
  `getBoundingClientRect()` de **cada** número virtualizado ao da sua linha
  correspondente (topo e altura, tolerância de 1 px), sem ler `translateY`,
  `startIndex`, `offsetY` ou reproduzir fórmula de virtualização.
- O cenário também confirma cursor, Enter, Tab, setas e sincronização após
  `ResizeObserver`.

## Verificação

```text
$ npx eslint src/components/MaxInputTextList.vue tests/browser/MaxInputTextList.browser.ts
exit 0

$ npx vitest --config vitest.browser.config.ts run tests/browser/MaxInputTextList.browser.ts
Test Files  1 passed (1)
Tests       4 passed (4)
```

Não foi criado commit, conforme instrução do coordenador.
