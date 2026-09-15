# REV5-R04 — Refutação independente de E03-02

## Identidade

- Papel: `REV5-R04` (somente leitura).
- Agente: `/root/rev5_r04`.
- Início: `2026-09-15T15:49:00-03:00`.
- Fim: `2026-09-15T15:52:00-03:00`.
- HEAD auditado: `ba999e0b`.
- Referência adversarial: `aac16bca`.

## Escopo e caso adversarial

O contrato de E03-02 exige que **as 25 famílias** executem `submit`, autofill,
`required`, `disabled`, `label` e owner de forma nativa, incluindo browser e
autofill real, sem chamar foco manual no wrapper.

O caso adversarial é montar cada família em um `<form>` no Chromium e, para
cada controle que participa de formulário, verificar `checkValidity()`,
`FormData`, exclusão de controles disabled, associação nativa `label.htmlFor`
para o owner e alteração de valor sem foco manual. Para famílias compostas, o
teste deve demonstrar o owner de formulário documentado ou declarar e testar a
semântica alternativa. Esse caso falharia em `aac16bca`: `InputBase.vue`
mantinha `@click.stop="onLabelClick"` e `inputAttrs` só emitia
`aria-required`, sem o atributo HTML `required`.

## Evidência executada no HEAD

```text
$ npm exec vitest run tests/components/inputBaseAttributesSeparation.test.ts
Test Files  1 passed (1)
Tests  99 passed (99)

$ npx vitest run --config vitest.browser.config.ts tests/browser/InputBaseForms.browser.ts
Test Files  1 passed (1)
Tests  1 passed (1)
```

O primeiro arquivo contém uma matriz de 25 componentes, mas não executa a
semântica nativa requerida para todos eles:

- `submit`/`FormData` é exercitado somente para `MaxInputText`;
- o único cenário Chromium monta somente `MaxInputText`;
- o trecho de autofill também só é Chromium para `MaxInputText` e é uma escrita
  programática seguida de `input`, não uma matriz de autofill real das famílias;
- a matriz aceita `aria-required` e `aria-disabled` como substitutos de
  `required`/`disabled` HTML (`required || aria-required` e
  `disabled || aria-disabled`). Isso não demonstra restrição/exclusão nativa;
- vários owners listados são `div` com `role` (`MaxInputSelect`,
  `MaxInputIconPicker`, `MaxInputSwitch`) e nenhum teste prova a política de
  submissão/owner nativo desses casos.

Consequentemente, o teste existente pode passar mesmo que 24 das 25 famílias
nunca sejam submetidas, autofilladas ou validadas pelo navegador.

## Veredito

**REJEITADO.** A correção removeu os handlers manuais e melhora `InputBase`,
mas não há evidência do contrato integral das 25 famílias em browser/formulário
nativo. O implementador deve adicionar uma matriz Chromium por família, com
assertivas de `FormData`/`checkValidity`/disabled/label/owner e um cenário de
autofill sem foco manual, antes de nova refutação.
