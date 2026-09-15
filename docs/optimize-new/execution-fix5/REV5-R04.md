# REV5-R04 — Refutação independente de E03-02

## Revalidação nativa — 2026-09-15

- Papel: `REV5-R04` (somente leitura no código de produção).
- Agente: `/root/rev5_r04_retry`.
- Início: `2026-09-15T16:19:00-03:00`.
- Fim: `2026-09-15T16:21:00-03:00`.
- HEAD auditado: `bac90d8c85e146fc206405014bba88ce08c6ef1e`.
- Referência adversarial: `aac16bca`.

O retry introduziu proxies nativos em `MaxInputSelect`, `MaxTagSelect`, `MaxInputIconPicker`, `MaxInputOTP` e `MaxInputSwitch`. A matriz Chromium agora percorre nominalmente as 25 famílias e os comandos focais passam:

```text
$ npm exec vitest run tests/components/inputBaseAttributesSeparation.test.ts
Test Files  1 passed (1)
Tests  99 passed (99)

$ npx vitest run --config vitest.browser.config.ts tests/browser/InputBaseForms.browser.ts
Test Files  1 passed (1)
Tests  2 passed (2)
```

Ainda assim, a prova não satisfaz o contrato integral. Em `InputBaseForms.browser.ts`, para a montagem `disabled`, a matriz só verifica que o owner tem `disabled`; ela não cria `FormData(form)` nem prova a exclusão do campo desabilitado. Para `required`, ela primeiro escreve um valor no owner e só então verifica `form.checkValidity()`, sem provar a invalidez nativa do owner vazio. Portanto, uma mutação que remova a exclusão de `FormData` ou a constraint `required` continuaria sem detecção por este cenário.

Também não há autofill real de navegador: a matriz define `input.value` e dispara manualmente `Event('input')`. Isso é uma escrita programática, não o fluxo de autofill do Chromium. Nos compostos, o proxy oculto recebe o `label[for]`, mas a matriz não prova a interação de rótulo com o trigger visível nem uma política de autofill para cada proxy. O atributo `autocomplete="email"` é aplicado indistintamente, inclusive a owners que não representam e-mail.

**Veredito da revalidação: REJEITADO.** Há avanço estrutural e participação em formulário para os proxies, mas faltam as provas Chromium negativas por família de `required` vazio, exclusão de `disabled` em `FormData`, e um caso de autofill real/documentado que não seja somente `.value` + evento sintético. O aceite de R04 permanece aberto.

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
