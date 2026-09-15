# IMP5-R04 — E03-02

## Identidade e escopo

- Papel: `IMP5-R04`.
- Agente: `/root/imp5_r04`.
- Início: `2026-09-15T15:41:00-03:00`.
- Fim: `2026-09-15T15:45:00-03:00`.
- HEAD auditado: `4e5bf7852e6b45b07ded33b332f372826d91340a` com alterações locais paralelas de outros papéis preservadas.
- Ownership: `InputBase`, `MaxInputToggle`, matriz de atributos e cenário Chromium de formulário; esta linha da matriz e este relatório.

## Correção

- `InputBase` agora repassa `required` nativo junto de `aria-required` ao owner do slot. Antes, o estado era apenas ARIA e um `<input required>` real não recebia a restrição HTML.
- Foram removidos os handlers `onLabelClick` de `InputBase` e `MaxInputToggle`. O rótulo usa exclusivamente a associação nativa `label[for]`/`id`; nenhum wrapper chama `.focus()`.
- A matriz unitária cobre exatamente 25 famílias e, para cada uma, valida owner, ausência de atributos de formulário no wrapper, `disabled`, `required`, associação `for`/`id` e `autocomplete` quando aplicável. O submit nativo é verificado por `FormData`.
- O cenário Chromium monta `MaxInputText` num formulário real e confirma clique nativo no rótulo, owner, required/disabled, preenchimento estilo autofill sem foco, `FormData` e `requestSubmit()`.

## Verificação

```text
$ npm exec vitest run tests/components/inputBaseAttributesSeparation.test.ts
Test Files  1 passed (1)
Tests  99 passed (99)

$ npx vitest run --config vitest.browser.config.ts tests/browser/InputBaseForms.browser.ts
Test Files  1 passed (1)
Tests  1 passed (1)
```

`npm run type-check:test -- --pretty false` foi também executado. Não apresentou diagnóstico em arquivos deste papel; falhou nos imports preexistentes do playground para `@maxvue/max-components-ui`, fora do ownership de R04.

## Veredito

**IMPLEMENTADO — E03-02 está pronto para refutação independente (`REV5-R04`).**
