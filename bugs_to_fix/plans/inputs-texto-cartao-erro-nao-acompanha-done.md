# Inputs de cartão marcam borda de erro enquanto o usuário digita, mas sem mensagem

- **Categoria:** falha
- **Severidade:** média
- **Arquivo(s):** `src/components/MaxInputCreditCard.vue:36-45`, `src/components/MaxInputCreditCardCvv.vue:37-46`, `src/components/MaxInputCreditCardDate.vue:43-52`
- **Domínio:** inputs-texto

## Problema

Os três componentes de cartão usam duas fontes distintas para o estado visual, e elas divergem antes do primeiro blur.

`done` é reativo desde a primeira tecla (não espera blur):

```ts
// MaxInputCreditCard.vue:36
const done = computed(() => isDone.value ?? (unmaskedValue.value.length > 0 ? isValidCreditCard(unmaskedValue.value) : null));
```

Mas `error_msg` só fala quando `isDone` já foi materializado por um blur:

```ts
// MaxInputCreditCard.vue:42-45
const error_msg = computed(() => {
    if (isDone.value === false) return unmaskedValue.value.length === 0 ? 'Campo obrigatório' : 'Número de cartão inválido';
    return null;
});
```

Enquanto o usuário digita o cartão (`isDone === null`, `unmaskedValue` parcial), `done` já vale `false` — porque um número incompleto reprova no Luhn. O `InputBase` recebe `done: false` e `error: null`.

Em `InputBase.vue:170`:

```ts
const isError = computed(() => (... typeof props.error === 'string' && hasContent(props.error)) || props.error === true || props.done === false);
```

`props.done === false` já basta para `isError` ser verdadeiro. Resultado: **a borda vermelha acende ao digitar o segundo dígito do cartão** e permanece durante toda a digitação, enquanto a linha de mensagem fica vazia (`displayMessage` em `InputBase.vue:172-180` não tem o que exibir). Só depois do blur a mensagem aparece.

O mesmo padrão está nos três arquivos: CVV (`unmaskedValue.length === props.len`) e validade (`isValidDate`, 4 dígitos) também reprovam durante a digitação parcial.

Compare com `MaxInputCep.vue:54-63`, que trata isso corretamente — `done` só é avaliado quando há conteúdo e `caution` exige `temp_value_numbers.length > 0`, e com `MaxInputCpfCnpj.vue:90-95`, que zera o `caution` para documento vazio.

## Impacto

Feedback de erro prematuro e mudo: o campo fica vermelho desde o começo da digitação, sem dizer o motivo. É o oposto da UX pretendida pelo `@blur="checkDone()"` presente nos três templates (linha 3 de cada), que existe justamente para adiar a validação. O usuário percebe o campo como "errado" antes de terminar de preenchê-lo.

## Plano de correção

1. Fazer `done` respeitar o mesmo adiamento que `error_msg`: enquanto `isDone === null` (sem blur ainda), retornar `null` em vez de calcular a validação.
   ```ts
   const done = computed(() => isDone.value);
   ```
   Se houver necessidade de refletir "válido" imediatamente ao completar o número (feedback positivo antecipado, o check verde), retornar `true` quando a validação passa e `null` — nunca `false` — quando ainda não passou e não houve blur:
   ```ts
   const done = computed(() => {
       if (isDone.value !== null) return isDone.value;
       return isValidCreditCard(unmaskedValue.value) ? true : null;
   });
   ```
2. Aplicar a mesma mudança nos três arquivos, mantendo as regras específicas (`length === props.len` no CVV, `isValidDate` na validade).
3. Conferir se `error_msg` e `done` passam a concordar em todos os estados: intocado, digitando, blur com valor inválido, blur com valor válido, blur vazio com `required`.

## Verificação

- Teste por componente: montar, setar `unmaskedValue` para um valor parcial (ex.: `'4111'`), afirmar que o `InputBase` recebe `done` **diferente de** `false` (ou seja, sem borda de erro) enquanto `error` é `null`.
- Teste de não-regressão: após `checkDone()` com valor inválido, `done === false` **e** `error` com a mensagem correta — já coberto em `tests/components/MaxInputCreditCard.test.ts:57-67`, `MaxInputCreditCardCvv.test.ts` e `MaxInputCreditCardDate.test.ts:54-64`.
- Teste do feedback positivo: cartão válido completo digitado, sem blur, não deve exibir erro.
- `npx vitest run tests/components/MaxInputCreditCard.test.ts tests/components/MaxInputCreditCardCvv.test.ts tests/components/MaxInputCreditCardDate.test.ts`.
