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
- A matriz Chromium agora monta as 25 famílias reais, uma a uma, e verifica owner, `label[for]`, `required`, `disabled`, ausência de vazamento no wrapper e clique nativo em cada owner labelable. As 18 famílias de texto ainda fazem autofill sem foco e validam `FormData`/`checkValidity`; o cenário de `MaxInputText` também faz `requestSubmit()`.

## Verificação

```text
$ npm exec vitest run tests/components/inputBaseAttributesSeparation.test.ts
Test Files  1 passed (1)
Tests  99 passed (99)

$ npx vitest run --config vitest.browser.config.ts tests/browser/InputBaseForms.browser.ts
Test Files  1 passed (1)
Tests  2 passed (2)
```

`npm run type-check:test -- --pretty false` foi também executado. Não apresentou diagnóstico em arquivos deste papel; falhou nos imports preexistentes do playground para `@maxvue/max-components-ui`, fora do ownership de R04.

## Veredito

## Retry nativo — 2026-09-15

Os cinco owners compostos que eram `div[role]` receberam proxy nativo de formulário sincronizado ao `modelValue`: `MaxInputSelect`, `MaxTagSelect`, `MaxInputIconPicker`, `MaxInputOTP` e `MaxInputSwitch`. `InputBase` agora oferece `formAttrs` e `triggerAttrs`: o primeiro dá ao input proxy o `id` apontado pelo `label`, `name`, `required`, `disabled` e `form`; o segundo mantém ARIA no trigger visual sem duplicar atributos de formulário em uma `div`.

O proxy é visualmente recortado e `tabindex=-1`: não cria segundo ponto de tabulação, mas continua um elemento form-associated real. O modelo continua sendo a fonte do valor (renderização reativa para `value`/`checked`).

Verificação adicional:

```text
$ npm exec vitest run tests/components/inputBaseAttributesSeparation.test.ts
Test Files  1 passed (1)
Tests  99 passed (99)

$ npx vitest run --config vitest.browser.config.ts tests/browser/InputBaseForms.browser.ts
Test Files  1 passed (1)
Tests  2 passed (2)

$ npx vue-tsc --noEmit --pretty false --project tsconfig.json
exit 0
```

O cenário Chromium cobre as 25 famílias e, nos cinco compostos, verifica especificamente que o owner nativo recebe o `label[for]`, participa de `FormData` e determina `form.checkValidity()`; no Switch a semântica é `checkbox` nativo.

**IMPLEMENTADO — aguarda refutação independente pelo mesmo REV5-R04.**

## Retry de evidência negativa — 2026-09-15

A matriz de Chromium foi reforçada para que uma implementação ARIA-only não passe:

- antes de preencher, cada família validável prova `form.checkValidity() === false` e `owner.validity.valid === false`; `input[type=color]` é documentado como a exceção do HTML, pois sempre tem valor;
- após montar com `disabled`, cada família prova que sua chave está ausente de `new FormData(form)`;
- o clique é feito com `userEvent.click(label)`, e `document.activeElement` deve ser o owner nativo. Nos compostos o owner é o proxy, e o `:focus-within` de `InputBase` mantém o indicador visual sem foco manual no wrapper;
- campos textuais usam `userEvent.fill` no Chromium, que realiza interação de usuário/eventos do navegador, sem atribuição `.value` ou `dispatchEvent` manual. Controles compostos declaram `autocomplete="off"`, pois não representam e-mail/texto de perfil.

Também foi corrigida a inicialização das coordenadas decimais: valor vazio não pode se converter em `NaN` (que satisfaria `required`), e ambas têm `pattern` nativo para que uma máscara parcial não seja aceita como coordenada completa.

```text
$ npx vitest run --config vitest.browser.config.ts tests/browser/InputBaseForms.browser.ts
Test Files  1 passed (1)
Tests  2 passed (2)

$ npm exec vitest run tests/components/inputBaseAttributesSeparation.test.ts tests/components/MaxInputCoordinates.test.ts
Test Files  2 passed (2)
Tests  112 passed (112)

$ npx vue-tsc --noEmit --pretty false --project tsconfig.json
exit 0
```

**IMPLEMENTADO — aguarda nova revalidação independente do REV5-R04.**

## Retry de autofill por CDP e submit especializado — 2026-09-15

O teste de integração `tests/integration/r04ChromiumAutofill.test.ts` monta um
`MaxInputText` real em um servidor Vite e tenta o caminho oficial do Chrome
DevTools Protocol: `Autofill.enable` seguido de `Autofill.trigger`. O runtime
fornecido é `HeadlessChrome/153.0.8010.12`; ele responde
`Protocol error (Autofill.enable): 'Autofill.enable' wasn't found`. Embora as
declarações do Playwright instalado contenham `Autofill.enable`,
`Autofill.setAddresses` e `Autofill.trigger`, esse domínio não é exposto pelo
Chromium headless disponível. O teste registra essa capacidade ausente de modo
assertivo; ele **não** a contabiliza como cobertura de autofill.

Assim, não é possível obter neste ambiente a evidência exigida de um perfil
salvo/preenchimento real de Chromium, e `userEvent.fill` continua corretamente
classificado somente como interação de digitação. A pendência de autofill real
permanece aberta até haver Chromium com o domínio Autofill habilitado (ou uma
política de produto que forneça um perfil real controlável).

Também foram preenchidas as duas lacunas independentes da matriz Chromium:

- `MaxColorPicker` agora prova o valor `#000000` presente em `FormData` e
  `checkValidity() === true`, por meio do seu `input[type=color]` nativo;
- `MaxInputToggle` é marcado com clique real no checkbox visível, depois prova
  `FormData` positivo e validade nativa, sem escrever `.checked`.

```text
$ npx vitest run tests/integration/r04ChromiumAutofill.test.ts
Test Files  1 passed (1)
Tests  1 passed (1)

$ npx vitest run --config vitest.browser.config.ts tests/browser/InputBaseForms.browser.ts
Test Files  1 passed (1)
Tests  2 passed (2)
```

**BLOQUEIO TÉCNICO VERIFICADO — não declarar R04 aceito enquanto o autofill
real não puder ser executado.**

## Retry Chrome Selenium 151 — 2026-09-15

O runtime que bloqueava a prova era somente o Chromium 153 distribuído pelo
Playwright. O teste de integração agora seleciona explicitamente o Chrome
151 do Selenium por `MAX_UI_AUTOFILL_EXECUTABLE` (com o caminho local
diagnosticado como padrão) e falha de forma clara se nenhum runtime compatível
for encontrado.

Contra a fixture HTTP/Vite com `MaxInputText` real, o teste executa o fluxo
CDP integral, sem `locator.fill`, `userEvent`, escrita de `.value` ou evento
`input` sintético:

1. `Autofill.enable`;
2. `Autofill.setAddresses`;
3. resolução do `backendNodeId` do owner nativo e do `frameId`;
4. `Autofill.trigger({ fieldId, frameId, address })`;
5. espera por `Autofill.addressFormFilled`;
6. confirmação do campo preenchido, do DOM e de `FormData`.

O evento retornou o campo `email`, valor `ada@example.test`, tipo de autofill
`Email address` e estratégia `autocompleteAttribute`. O owner no DOM e o
`FormData` do formulário exibiram o mesmo valor. Essa é uma prova do
subsistema Autofill do Chrome, não de interação simulada.

```text
$ npx vitest run tests/integration/r04ChromiumAutofill.test.ts --reporter=verbose
Test Files  1 passed (1)
Tests  1 passed (1)

$ npx vue-tsc -p tsconfig.test.json --noEmit --pretty false
exit 0
```

**IMPLEMENTADO — R04 possui agora a evidência de autofill real exigida e
aguarda a refutação independente REV5-R04.**
