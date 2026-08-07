# 10 — MaxInputCpfCnpj: v-model congela quando o usuário apaga o documento

**Severidade:** Alta
**Categoria:** Bug / Regra de negócio
**Arquivos:** `src/components/MaxInputCpfCnpj.vue:127-134`

## Problema

O watch de `temp_value` só emite `update:modelValue` quando o valor tem exatamente 11 ou 14 dígitos:

```ts
watch( temp_value, () => {
    const only_numbers: string = onlyNumbers(temp_value.value);
    if (only_numbers.length === 11 || only_numbers.length === 14) {
        emit('update:modelValue', onlyNumbers(temp_value.value));
```

Se o usuário apaga o documento (ou digita parcialmente), o `modelValue` do pai fica congelado com o último CPF/CNPJ completo — **um form submeteria um documento que não está mais na tela**.

## Correção sugerida

Emitir sempre (`emit('update:modelValue', only_numbers)`), reservando o gate de 11/14 dígitos apenas para o evento `complete`.
