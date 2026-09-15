# PRES5-R05 — preservação de R05 / F06 / E03-03

- Papel: auditoria de preservação, somente leitura.
- Agente: `/root/pres5_r05`; parent: `/root`.
- Início: `2026-09-15T17:47:45-03:00`.
- Fim: `2026-09-15T17:48:02-03:00`.
- HEAD auditado: `847202ef3d9383be660bda4dc9bbd2c9e77c314d`.

## Escopo e evidência

O contrato preservado exige que `MaxInputCpfCnpj`, `MaxInputCep`,
`MaxInputCreditCard` e `MaxInputCreditCardDate` mantenham `error` tanto como
booleano quanto como mensagem, sem perder os estados lazy de
`touched/dirty/submitted`, a correção após erro e o reset externo.

Inspeção dos quatro adaptadores confirmou `error?: string | boolean` e o
encaminhamento de `true` por `hasExplicitBooleanError`, antes do resultado da
validação compartilhada. `useInputValidation` mantém a política lazy: vazio
required é neutro no mount, `onBlur`/`submit` registram interação, entrada
válida remove `hadError` e `reset()` limpa touched, dirty, submitted e
hadError.

## Comando independente

```text
npx vitest run tests/components/inputSharedValidationMatrix.test.ts --reporter=verbose
```

Saída relevante:

```text
Test Files  1 passed (1)
Tests       33 passed (33)
Duration    1.56s
```

A matriz cobre os quatro adaptadores para mount, blur, submit, valor
incompleto, correção, `error=true`, mensagem textual e reset externo. Não há
`as any` nem asserções condicionais no arquivo de teste.

## Veredito

**ACEITO.** R05/F06 permanece preservado no HEAD auditado; não houve alteração
de código por este papel.
