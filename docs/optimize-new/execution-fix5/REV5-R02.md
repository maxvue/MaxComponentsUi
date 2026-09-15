# REV5-R02 — refutação independente

- Agente real: `/root/rev5_r02`
- Parent ID: `/root`
- Início: `2026-09-15T15:49:00-03:00`
- Fim: `2026-09-15T15:51:18-03:00`
- HEAD auditado: `ba999e0bc18437c8ead745b57b77600290918fe7`
- Referência adversarial: `aac16bca`
- Modo: somente leitura (exceto este relatório). A matriz estava modificada por outro owner e não foi tocada.

## Escopo

R02 requer eliminar a **origem** de `DOMException [AbortError]` do happy-dom, fazer warnings/errors tardios falharem mesmo com `vi.spyOn`, e provar duas suítes completas e cobertura sem `AbortError`, `EPROTO`, `DOMException` ou saída inesperada.

## Comparação com `aac16bca`

O diff mostra somente duas medidas relevantes:

1. `tests/components/dialogAccessibleNames.test.ts` passou a fazer mock de `useListMenusStore`, impedindo que o componente exercite a requisição real. Em `aac16bca` esse mock não existe.
2. `verifyConsoleClean()` deixou de chamar `vi.unstubAllGlobals()` antes da validação. Foram adicionados dois testes que aguardam um `setTimeout(0)` e chamam manualmente `verifyConsoleClean()` ainda dentro do próprio teste.

Portanto, o caso de referência é alcançado por isolamento da suíte que manifestava o abortamento, não por uma correção do ciclo de vida/cancelamento da origem (`MaxSideMenuMobile`/store de menus). Isso não satisfaz “elimine a origem do AbortError”.

## Execução independente

```text
npm exec vitest -- run tests/core/warningTrap.test.ts tests/components/dialogAccessibleNames.test.ts

Test Files  2 passed (2)
Tests  26 passed (26)
Duration  1.70s
```

O foco passou sem imprimir `AbortError`.

```text
npm run test

Test Files  10 failed | 230 passed (240)
Tests  13 failed | 3689 passed (3702)
Duration  27.96s
```

A execução completa não imprimiu `AbortError`, mas falhou em 13 testes, entre eles distribuição, InputBase, contraste, accessible name e TagSelect. Não há segunda suíte completa nem execução de cobertura neste HEAD; logo a evidência obrigatória de E12-02 não existe.

## Caso adversarial e lacuna

Os testes tardios não representam aviso emitido *depois do teardown*: eles esperam o timer resolver antes de verificar. Um callback que ocorra após o `afterEach` pode ser apagado pelo `beforeEach` seguinte (que zera `unhandledWarnings`, `unhandledErrors` e `unhandledAsyncErrors`), sem ser associado ao teste que o causou. Assim, o mecanismo não prova a política de erro tardio exigida para a suíte real, embora cubra uma chamada adicional após uma asserção no mesmo teste.

## Veredito

**REJEITADO.** O mock remove o sintoma de uma única suíte, sem corrigir a origem do abortamento; a prova de warning/error tardio não cobre pós-teardown; e faltam duas suítes completas e duas coberturas limpas. O implementador deve corrigir/aguardar a operação real, adicionar caso que atravesse o teardown e produzir as quatro execuções globais limpas antes da revalidação deste mesmo papel.
