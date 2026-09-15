# Relatório de implementação — IMP5-R14

- Papel: `IMP5-R14` (implementação, R14 / E09-01)
- Agente: `/root/imp5_r14`
- Parent: `/root`
- Início: `2026-09-15T14:53:00-03:00`
- Fim: `2026-09-15T14:57:21-03:00`
- HEAD auditado: `adc637b1c6b8af0f584dc4af9c1f735d10838bfa` (com mudanças locais desta implementação)
- Manifesto: `src/components/MaxAuthCard.vue`, `tests/components/MaxAuthCard.test.ts`, `tests/browser/MaxAuthCard.browser.ts`, `docs/optimize-new/execution-fix5/IMP5-R14.md`, `docs/optimize-new/execution-fix5/MATRIZ_ORQUESTRACAO.md`.

## Reprodução e causa raiz

`MaxAuthCard` combinava `@submit.prevent="handleFormSubmit"` no formulário com `:action` nos dois `MaxButton` de `type="submit"`. Como `MaxButton` invoca `action` no clique e o botão nativo também dispara submit, havia dois caminhos para a mesma função. O componente ainda usava a guarda temporal `isHandlingSubmitInTick` para mascarar a duplicidade e o `@complete` do OTP era uma terceira entrada não nativa.

## Correção

- Removidos `:action="onSubmit"`, `:action="handleDynamicSubmit"`, seus aliases e a guarda de tick.
- Removido `@complete="handleFormSubmit"` do OTP.
- Mantido somente `@submit.prevent="handleFormSubmit"`; os dois botões seguem como `type="submit"`.
- Adicionado teste Chromium com Enter real e atualização de valores como autofill seguida de `form.requestSubmit()`; cada submissão emite exatamente uma vez.
- Mantido o contrato de um owner live por mensagem: `MaxToast` deixa o container sem `aria-live` e cada toast é o único `role=status|alert`; a suíte focal cobre essa contagem.

## Evidências executadas

```text
npx eslint src/components/MaxAuthCard.vue tests/components/MaxAuthCard.test.ts tests/browser/MaxAuthCard.browser.ts
# passou sem erros ou warnings

npm test -- --run tests/components/MaxAuthCard.test.ts
Test Files  1 passed (1)
Tests       36 passed (36)

npm run test:browser -- --run tests/browser/MaxAuthCard.browser.ts
Test Files  1 passed (1)
Tests       1 passed (1)

npm test -- --run tests/components/MaxToast.test.ts
Test Files  1 passed (1)
Tests       30 passed (30)

git diff --check
# passou
```

Resultado: implementação pronta para refutação independente `REV5-R14`; nenhum commit foi criado por este papel.
