# Relatório de preservação — R15 / F22

- **Papel:** `PRES5-R15`
- **Agente:** `/root/pres5_r15`
- **Parent ID:** `/root`
- **Início:** `2026-09-15T17:51:00-03:00`
- **Término:** `2026-09-15T17:52:15-03:00`
- **HEAD auditado:** `33e69a23db34796ed3f0d09dcde16ef012eccb41`
- **Modo:** somente leitura; não houve alteração de código de produção.
- **Veredito:** **ACEITO**

## Escopo exclusivo

Preservação de R15/F22: `useLoadingStore` mantém handles individuais para operações concorrentes sob a mesma chave lógica; `end`, `retry` e `dismiss` por handle não afetam instâncias vizinhas; a operação por chave lógica encerra deterministicamente o grupo; timers, `reset()` e descarte do escopo limpam o estado.

## Evidência inspecionada

- `start()` gera chave interna sequencial e retorna o handle individual, enquanto registra a chave lógica separadamente.
- `resolveItems()` prioriza um handle registrado e só então expande uma chave lógica para todas as instâncias correspondentes.
- `end()`, `retry()` e `dismiss()` cancelam o timer da instância pertinente antes de alterar/remover seu estado; `reset()` e `onScopeDispose()` limpam todos os timers.

## Execuções independentes

```bash
npx vitest run tests/stores/useLoading.Store.test.ts tests/components/MaxLoadScreen.test.ts tests/components/MaxLoadScreenTarget.test.ts tests/ux/asyncStatesRecovery.test.ts --reporter=verbose
```

Saída relevante:

```text
Test Files  4 passed (4)
     Tests  63 passed (63)
```

O arquivo focal do store aprovou, em particular, start/error/retry/end com a mesma chave, múltiplos targets, reset e descarte de escopo, handles concorrentes, encerramento individual e por chave lógica, timers com durações distintas, retry seletivo, dismiss seletivo e ciclos concorrentes sem resíduo.

```bash
npm run type-check -- --pretty false
npx eslint src/stores/useLoading.Store.ts src/types/app.ts tests/stores/useLoading.Store.test.ts
```

Ambos retornaram código de saída `0`.

## Conclusão

As verificações focais, tipagem e lint preservam o comportamento aceito de R15/F22 no HEAD auditado. Não foi encontrada regressão no escopo exclusivo deste papel.
