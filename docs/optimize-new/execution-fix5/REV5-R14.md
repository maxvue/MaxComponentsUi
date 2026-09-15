# Relatório de refutação independente — REV5-R14

- Papel: `REV5-R14` (refutação somente leitura, R14 / E09-01)
- Agente: `/root/rev5_r14`
- Parent: `/root`
- Início: `2026-09-15T14:58:00-03:00`
- Fim: `2026-09-15T15:00:08-03:00`
- HEAD auditado: `288db2242e066d97011664e994b3bdff61c80481`
- Referência adversarial: `aac16bca`
- Manifesto: somente `docs/optimize-new/execution-fix5/REV5-R14.md` e `docs/optimize-new/execution-fix5/MATRIZ_ORQUESTRACAO.md` foram escritos; código e testes permaneceram somente leitura.

## Caso adversarial e reprodução na referência

O caso adversarial exige que os dois `MaxButton` de submissão não recebam a prop `action`, que o OTP não possua `@complete` encaminhado ao submit e que não exista coalescência temporal. Isso é verificável ao montar `MaxAuthCard` e inspecionar as props dos `MaxButton`: a prop `action` deve ser `undefined`; no modo OTP, completar o código não pode constituir outro canal de submit.

Na referência `aac16bca`, a inspeção independente falha esse caso:

```text
git show aac16bca:src/components/MaxAuthCard.vue | rg -o ':action="[^"]+"|@complete="[^"]+"|isHandlingSubmitInTick'
:action="onSubmit"
@complete="handleFormSubmit"
:action="handleDynamicSubmit"
isHandlingSubmitInTick (4 ocorrências)
```

`MaxButton` executa `props.action(...)` no seu `@click`; portanto, os botões `type="submit"` da referência dispunham simultaneamente do caminho de clique próprio e do submit do formulário. A guarda de `nextTick` apenas escondia essa duplicidade, em vez de removê-la. Logo, o caso adversarial é capaz de falhar em `aac16bca`.

No HEAD auditado, o mesmo inventário contém apenas a ação dos provedores sociais, fora do formulário de credenciais:

```text
git show HEAD:src/components/MaxAuthCard.vue | rg -o ':action="[^"]+"|@complete="[^"]+"|isHandlingSubmitInTick'
:action="() => emit('social', provider.id)"
```

## Verificação independente

```text
npm run test:browser -- tests/browser/MaxAuthCard.browser.ts
Test Files  1 passed (1)
Tests       1 passed (1)

npx vitest run tests/components/MaxToast.test.ts tests/components/MaxAuthCard.test.ts
Test Files  2 passed (2)
Tests       66 passed (66)
```

O teste Chromium exercitou Enter em campo de senha e atualização de valores seguida de `form.requestSubmit()` (cenário de autofill), obtendo precisamente uma emissão por submissão. A inspeção confirma que o botão nativo não recebe atributo `action` e que o único manipulador de submissão do formulário é `@submit.prevent="handleFormSubmit"`.

Para os anúncios, `MaxToast` mantém o container como `role="region"`, sem `aria-live`, e cada `.max-toast-item` é o único owner por mensagem via `role="status"` ou `role="alert"`. A suíte focal também cobre duas instâncias, atualização de mensagem e feedback de cópia sem regiões aninhadas; os 30 testes pertinentes passaram dentro dos 66 acima.

## Veredito

**ACEITO.** R14/E09-01 removeu os caminhos de submit concorrentes e a guarda de tick; Enter e autofill percorrem o submit nativo uma vez. O contrato de um owner live por mensagem permanece preservado.
