# PRES5-R06 — preservação de fechamento cancelável/idempotente do modal

- Papel: auditoria somente leitura do bloco aceito R06/F08 (E04-03).
- Agente: `/root/pres5_r06`.
- Parent: `/root`.
- Início: `2026-09-15T17:48:03-03:00`.
- Fim: `2026-09-15T17:48:05-03:00`.
- HEAD auditado: `847202ef3d9383be660bda4dc9bbd2c9e77c314d`.

## Escopo exclusivo

Foram inspecionados exclusivamente `src/components/MaxModal.vue` e
`tests/components/MaxModal.test.ts`. O fluxo `requestClose()` cria uma
geração por tentativa e um estado local `settled`; `onDone()` e `onPrevent()`
retornam sem efeito quando a resolução já ocorreu ou quando a geração ficou
obsoleta. O fechamento efetivo centralizado em `forceClose()` emite uma vez
os dois updates de modelo, remove uma vez o modal da store e emite `hide`.

## Comando e saída

```text
$ npx vitest run tests/components/MaxModal.test.ts -t 'Proteção contra fechamento acidental e retenção' --reporter=verbose
Test Files  1 passed (1)
Tests  9 passed | 39 skipped (48)
Duration  1.61s

$ git diff --check
exit 0
```

Os nove testes focais cobrem backdrop bloqueado e permitido, interceptação
legada, callback síncrono, duas chamadas a `done()`, resoluções concorrentes,
reabertura antes de `done()` tardio, emissão do evento legado e scroll lock.
Em particular, os três cenários idempotentes confirmam exatamente um `hide`,
um update de modelo e um `pop` na store.

## Veredito

**ACEITO.** R06/F08 permanece preservado no HEAD auditado: o fechamento
cancelável e assíncrono não duplica efeitos laterais e uma conclusão tardia
não fecha modal reaberto.
