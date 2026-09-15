# IMP5-R03 — E03-01

## Escopo e reprodução

Owner: arquitetura de `InputBase` / testes de anatomia. O achado E03-01
exigia que a auditoria de anatomia não aceitasse um alias somente por estar em
uma tag permitida e ter uma classe canônica irmã. A implementação anterior em
`tests/architecture/tableAnatomyConsistency.test.ts` só verificava esses dois
atributos, portanto um alias poderia ser deslocado para uma `div` interna
plausível sem violação de localização.

## Correção

O extrator da AST do template passou a registrar `parentTag`, classes do pai
DOM materializado e classes ancestrais. Os agrupadores Vue `<template>` são
ignorados como pais estruturais por não gerarem nó DOM. Cada regra allowlisted
agora define pai permitido e, quando necessário, a classe canônica exigida no
pai e/ou no caminho ancestral.

Foi acrescentada uma mutação que remove `p-datatable` da sua `div`
canônica e o injeta na `div` de container, preservando `div`, o alias e
`max-table` no mesmo nó. O gate falha explicitamente por localização
canônica, em vez de depender de tag/classe irmã.

## Evidência executada

```text
$ npx eslint tests/architecture/tableAnatomyConsistency.test.ts
(sem erros nem warnings)

$ npx vitest run tests/architecture/tableAnatomyConsistency.test.ts
Test Files  1 passed (1)
Tests       15 passed (15)
```

## Resultado

E03-01 corrigido no teste arquitetural focal. Alterações permanecem sem
commit, conforme solicitado, para integração do coordenador e refutação
independente `REV5-R03`.
