# PRES5-F12 — preservação de loading/retry do select

- Papel: auditoria de preservação exclusivamente de F12 (`E05-06` e `E05-07`).
- Agente: `/root/pres5_f12`.
- Parent: `/root`.
- Início: `2026-09-15T16:55:00-03:00`.
- Fim: `2026-09-15T16:55:27-03:00`.
- HEAD auditado: `aa27fc7a`.
- Escopo somente leitura: `src/components/MaxInputSelect.vue` e os seis casos do grupo `Carga coordenada e reentrante de loadOptions (E05-06 / F12)` em `tests/components/MaxInputSelect.test.ts`.

## Comando e saída

```text
npx vitest run tests/components/MaxInputSelect.test.ts -t 'Carga coordenada e reentrante de loadOptions' --reporter=verbose

Test Files  1 passed (1)
Tests  6 passed | 39 skipped (45)
Duration  1.51s
```

Também foi executado `git diff --check`, com código de saída `0`.

## Cobertura confirmada

1. A primeira ativação abre o Teleport e mostra `Carregando...` antes de a promessa controlada resolver.
2. Duas ativações enquanto há carga em curso chamam `loadOptions` uma vez e mantêm o dropdown aberto.
3. O `AbortSignal` só é abortado no fechamento/desmontagem explícitos.
4. Desabilitar durante a carga cancela abertura e impede publicação do resultado.
5. Rejeição deixa o erro e o botão de retry visíveis; retry inicia uma única nova carga e publica o sucesso.
6. Duas gerações resolvidas em ordem inversa preservam o resultado mais recente, sem atualização obsoleta.

## Veredito

**ACEITO.** F12 permanece preservado no HEAD auditado. Nenhum arquivo de produção ou teste foi alterado por esta auditoria.
