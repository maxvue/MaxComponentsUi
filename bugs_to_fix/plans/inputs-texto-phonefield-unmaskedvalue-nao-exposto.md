# MaxPhoneField vincula `v-maska:unmaskedValue` a uma variável inexistente

- **Categoria:** bug
- **Severidade:** alta
- **Arquivo(s):** `src/components/MaxPhoneField.vue:25`, `src/components/MaxPhoneField.vue:61`
- **Domínio:** inputs-texto

## Problema

O template usa o binding de valor desmascarado do Maska:

```html
<InputText type="text" slot-b v-model="phone" v-maska:unmaskedValue.unmasked="maskValue" ... />
```

Mas **não existe** nenhum `const unmaskedValue = ref('')` no `<script setup>` deste componente, nem um `defineExpose`. O Maska emite um aviso em runtime, confirmado ao montar o componente nos testes:

```
stderr | MaxPhoneField
Maska: please expose `unmaskedValue` using defineExpose
```

Comparar com `MaxInputPhoneMail.vue:32/50/202`, `MaxInputCreditCard.vue:32/71`, `MaxInputCreditCardCvv.vue:33/72` e `MaxInputCreditCardDate.vue:32/78`, que todos declaram o ref e chamam `defineExpose({ unmaskedValue })`. Aqui o argumento da diretiva é letra morta.

O componente contorna a ausência recalculando os dígitos manualmente:

```ts
const temp_value = computed(() => country.value.value + phone.value.replace(/\D/g, ''));
```

Ou seja: o binding não só é inerte como é redundante — mas o aviso poluindo o console de toda aplicação consumidora permanece, e qualquer futura refatoração que assuma `unmaskedValue` disponível vai encontrar `undefined`.

## Impacto

- Aviso de runtime do Maska em toda montagem do componente, em dev e em produção do consumidor.
- Binding enganoso: quem lê o template acredita que existe um valor desmascarado disponível quando não existe.
- Risco de regressão silenciosa se alguém tentar migrar o cálculo manual de `temp_value` para o `unmaskedValue` "que já está no template".

## Plano de correção

1. Escolher uma das duas direções, sem meio-termo:
   - **(a) Remover o argumento**: trocar `v-maska:unmaskedValue.unmasked="maskValue"` por `v-maska="maskValue"`, já que `temp_value` (linha 61) computa os dígitos por conta própria. Menor mudança, elimina o aviso.
   - **(b) Adotar o padrão dos irmãos**: declarar `const unmaskedValue = ref('')`, `defineExpose({ unmaskedValue })` e derivar `temp_value` de `country.value.value + unmaskedValue.value`, alinhando com `MaxInputPhoneMail`.
2. Preferir (b) se houver intenção de padronizar os inputs mascarados na migração de independência do PrimeVue; (a) se o objetivo for apenas silenciar o defeito agora.
3. Não alterar o formato do valor emitido em `modelValue` — o contrato atual (DDI + dígitos, via `watchDebounced` na linha 103) deve ser preservado em qualquer das opções.

## Verificação

- Teste que monta `MaxPhoneField` com um spy em `console.warn`/`console.error` e afirma que a mensagem `Maska: please expose` não é emitida.
- Rodar `npx vitest run tests/components/MaxPhoneField.test.ts` e confirmar que a saída de stderr do arquivo fica limpa.
- Se optar por (b), teste afirmando que `wrapper.vm.unmaskedValue` reflete só os dígitos após `setValue` no input de telefone.
