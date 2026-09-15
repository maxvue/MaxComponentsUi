# Gate GATE5-INPUTS-FORMS — inputs e formulários nativos

## Revalidação com Chrome 151 — 2026-09-15

### Identidade

- Papel: `GATE5-INPUTS-FORMS` (somente leitura de código de produção).
- Agente de revalidação: `/root/rev5_r04_chrome151`.
- Parent: `/root`.
- Início: `2026-09-15T18:15:00-03:00`.
- Fim: `2026-09-15T18:16:00-03:00`.
- HEAD auditado: `d12d4571799e97ca286f86fa716ce29b80709aaf`, com a implementação R04
  local pendente de commit.

### Evidência reproduzida

```text
$ npx vitest run --config vitest.browser.config.ts tests/browser/InputBaseForms.browser.ts --reporter=verbose
Test Files  1 passed (1)
Tests  2 passed (2)

$ MAX_UI_AUTOFILL_EXECUTABLE=/home/johnattas/.cache/selenium/chrome/linux64/151.0.7922.76/chrome \\
    npx vitest run tests/integration/r04ChromiumAutofill.test.ts --reporter=verbose
Test Files  1 passed (1)
Tests  1 passed (1)

$ npm exec vitest run tests/components/inputBaseAttributesSeparation.test.ts -- --reporter=verbose
Test Files  1 passed (1)
Tests  99 passed (99)
```

A matriz Chromium efetivamente monta as 25 famílias e confirma owner,
`label[for]`, `required` nativo (com a exceção intrínseca de
`input[type=color]`), exclusão de `disabled` em `FormData`, submissão e o
owner/proxy único de cada controle composto. O wrapper visual não recebe
atributos de formulário, nem há foco manual no wrapper.

A prova de autofill não usa `userEvent.fill`, atribuição de `.value` ou evento
sintético: no Chrome 151 configurado acima, o teste usa o DevTools Protocol
real para `Autofill.enable`, `Autofill.setAddresses` e `Autofill.trigger`,
aguarda `Autofill.addressFormFilled` e verifica `email=ada@example.test` no
owner nativo e no `FormData`. Para controles sem semântica de perfil, a
política é explícita (`autocomplete="off"`), em vez de anunciar falsamente
autofill de e-mail.

### Veredito da revalidação

**ACEITO.** Os três conjuntos de prova passaram, incluindo o requisito antes
bloqueado de autofill real do Chromium.

## Identidade

- Papel: `GATE5-INPUTS-FORMS` (somente leitura de código de produção).
- Agente: `/root/gate5_inputs_forms`.
- Parent: `/root`.
- Início: `2026-09-15T17:42:00-03:00`.
- Fim: `2026-09-15T17:43:53-03:00`.
- HEAD auditado: `cabb5d710f452a8a27e34d92210a28261491f8ac`.

## Contrato auditado

O gate exige, nas 25 famílias InputBase, owner nativo, associação
`label[for]`, `required`, exclusão de `disabled` em `FormData`, submissão e
autofill **real** de Chromium. Interação por `userEvent.fill`, ou atribuição
de `value` seguida de evento `input`, não pode ser contabilizada como
autofill.

## Evidência executada

```text
$ npx vitest run --config vitest.browser.config.ts tests/browser/InputBaseForms.browser.ts
Test Files  1 passed (1)
Tests  2 passed (2)
Duration  4.76s

$ npx vitest run tests/integration/r04ChromiumAutofill.test.ts
Test Files  1 passed (1)
Tests  1 passed (1)
Duration  1.86s

$ npm exec vitest run tests/components/inputBaseAttributesSeparation.test.ts
Test Files  1 passed (1)
Tests  99 passed (99)
Duration  2.24s
```

A matriz Chromium declara e percorre exatamente 25 famílias. Para cada uma,
ela prova owner, ausência de atributos de formulário no wrapper, associação
do rótulo ao owner/proxy, `required` vazio (exceto `input[type=color]`, que é
sempre valorado pelo HTML), validade nativa após valor, exclusão do campo
`disabled` de `FormData` e foco nativo por clique no rótulo. Ela também prova
`FormData` positivo para ColorPicker e Toggle marcado; este último é marcado
por clique real.

A sonda de autofill usa CDP oficial em `HeadlessChrome/153.0.8010.12` e
confirma a indisponibilidade do domínio:

```text
Protocol error (Autofill.enable): 'Autofill.enable' wasn't found
```

O teste passa porque espera e registra essa incapacidade. Portanto ele é uma
evidência de bloqueio do ambiente, e não cobertura de autofill real. O cenário
restante de `MaxInputText` usa `input.value` e `Event('input')`, também não
equivalente a um perfil/autofill do Chromium.

## Veredito

**REJEITADO.** As provas de formulário nativo das 25 famílias são aprovadas,
mas o requisito explícito de autofill real em navegador ainda não está
verificado. Não é correto promover a sonda CDP bloqueada, `userEvent.fill` ou
uma escrita programática a autofill. R04 e este gate permanecem abertos até a
execução contra Chromium que exponha Autofill CDP (ou ambiente de perfil real
controlável), seguida de revalidação independente.
