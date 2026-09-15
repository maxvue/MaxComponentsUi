# FIX5-INPUTBASE-UNIT — correção focal

- Papel: correção das seis falhas de InputBase apontadas por `GATE5-UNIT-ASYNC`.
- Agente: `/root/fix5_tests_inputs`; início/fim: `2026-09-15T16:47:06-03:00` / `2026-09-15T16:48:05-03:00`.
- HEAD de partida: `dca2b145` com alterações paralelas não relacionadas preservadas.
- Manifesto: `tests/architecture/inputBaseAccessibility.test.ts`, `tests/components/InputBase.accessibility.test.ts`, `tests/components/InputBase.test.ts`.

## Diagnóstico e correção

`InputBase` passou a distinguir controles nativos de controles ARIA compostos. Para os últimos, `formAttrs` é aplicado a um `input.max-native-form-proxy`, que é o owner nativo de `label`, `FormData`, `required`, `disabled` e validade; `triggerAttrs` é aplicado ao gatilho visual com a semântica ARIA. As seis falhas ainda afirmavam o contrato anterior, no qual o gatilho recebia o ID do owner e todos os atributos de formulário.

Os testes foram atualizados para verificar o contrato público atual:

- a auditoria das 25 famílias aceita `inputAttrs` para controles nativos ou o par `formAttrs`/`triggerAttrs` para compostos;
- Select e Switch verificam que o `label[for]` aponta para o proxy nativo e que o gatilho mantém seus atributos ARIA;
- a prova de clique no label em happy-dom foi reduzida à associação semântica, pois esse ambiente não executa a ação padrão nativa de foco. A interação real pertence à cobertura Chromium;
- a expectativa de `inputAttrs` inclui `required: true`, que é necessário para a participação real em validade nativa.

## Validação focal

```text
$ npx vitest run tests/architecture/inputBaseAccessibility.test.ts tests/components/InputBase.accessibility.test.ts tests/components/InputBase.test.ts
Test Files  3 passed (3)
Tests  60 passed (60)

$ npx eslint tests/architecture/inputBaseAccessibility.test.ts tests/components/InputBase.accessibility.test.ts tests/components/InputBase.test.ts
(código 0)
```

`git diff --check` nos três arquivos também passou. Nenhum commit foi criado.
