# IMP5-F07 — E04-02

Agente: `/root/imp5_f07`  
Início: `2026-09-15T14:21:00-03:00`  
Fim: `2026-09-15T14:24:00-03:00`  
HEAD auditado: `31bbd8514e98f3ad83221828e192cdbaffd6d90a`

## Manifesto

- `src/helpers/useOutsidePointer.ts`
- `tests/helpers/useOutsidePointer.test.ts`
- `docs/optimize-new/execution-fix5/IMP5-F07.md`
- `docs/optimize-new/execution-fix5/MATRIZ_ORQUESTRACAO.md`

## Reprodução e correção

O dispatcher global chamava `onClose` sem retirar a entrada do topo. Como o
consumidor atualiza `isOpen` no próximo tick Vue, dois pares
`pointerdown`/`click` consecutivos podiam solicitar o mesmo fechamento duas
vezes. `requestClose` agora remove a entrada, desativa-a e, caso a pilha fique
vazia, remove os listeners antes de notificar o callback. A restauração de
foco foi preservada na mesma remoção atômica.

O teste novo emite dois cliques externos no mesmo tick e comprova callback
único, pilha vazia e zero listeners antes de aguardar a atualização reativa.
Os testes existentes também cobrem pointer real, clique-through, trigger
desconectado, retorno de foco e desmontagem. A contagem compartilhada foi
tornada exata: cinco listeners sem `visualViewport` e zero após fechamento ou
unmount.

## Comando e saída

```text
$ npm test -- --run tests/helpers/useOutsidePointer.test.ts

Test Files  1 passed (1)
Tests  14 passed (14)
Duration  797ms
```

## Veredito

`APROVADO` para implementação focal de F07/E04-02. Sem commit, conforme
orientação. A aceitação integral depende da refutação independente e dos gates
da orquestração.
