# PRES5-R10 — preservação do contrato remoto do autocomplete API

- Papel: auditoria somente leitura do bloco aceito R10/F13 (E05-07).
- Agente: `/root/pres5_r10`.
- Parent: `/root`.
- Início: `2026-09-15T17:49:53-03:00`.
- Fim: `2026-09-15T17:50:11-03:00`.
- HEAD auditado: `f16437fd4f4ef74d05ca4c536c3aa359ee454fe3`.

## Escopo exclusivo

Foram inspecionados exclusivamente `src/components/MaxInputAutoCompleteApi.vue` e
os três casos do contrato remoto em `tests/components/MaxInputAutoCompleteApi.test.ts`.
Todas as origens de busca — montagem e alterações de `route`, `data`, `minLength`
ou digitação — passam por `scheduleFetch()`. O gate de tamanho mínimo ocorre antes
de agendar a chamada, o debounce é centralizado e uma nova geração aborta a
requisição anterior; `applyIfCurrent()` descarta qualquer resposta obsoleta.

## Comando e saída

```text
$ npx vitest run tests/components/MaxInputAutoCompleteApi.test.ts -t 'Contrato Remoto com minLength, delay e debounce' --reporter=verbose
Test Files  1 passed (1)
Tests  3 passed | 26 skipped (29)
Duration  1.48s

$ git diff --check
exit 0
```

Os três casos verificam: zero requisições abaixo de `minLength`, exatamente uma
requisição para uma rajada após o `delay`, e abort/descarto da resposta de geração
anterior. A inspeção do watcher imediato confirma que montagem, mudança de rota e
mudança de dados não contornam o mesmo gate.

## Veredito

**ACEITO.** R10/F13 permanece preservado no HEAD auditado: não há caminho remoto
fora do gate `minLength`/debounce e respostas antigas não sobrescrevem o resultado
mais recente.
