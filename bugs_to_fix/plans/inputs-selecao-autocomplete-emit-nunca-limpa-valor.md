# Autocompletes nunca emitem a limpeza do campo — `update:modelValue` só sai para objetos

- **Categoria:** bug
- **Severidade:** alta
- **Arquivo(s):** `src/components/MaxInputAutoComplete.vue:70-73`, `src/components/MaxInputAutoCompleteApi.vue:100-104`
- **Domínio:** inputs-selecao-arquivo

## Problema

Os dois componentes guardam o emit atrás da mesma condição:

`MaxInputAutoComplete.vue:70-73`
```ts
watch(temp_value, () => {
    isDone.value = testIsDone();
    if (temp_value.value && typeof temp_value.value !== 'string') emit('update:modelValue', temp_value.value);
});
```

O emit só acontece quando `temp_value` é **truthy** e **não é string**. Isso significa que os seguintes estados **nunca** são propagados ao pai:

- **Limpeza do campo.** O `AutoComplete` do PrimeVue seta `temp_value` para `''` ou `null` quando o usuário apaga o texto. Ambos são falsy, então o emit é bloqueado. O componente exibe o campo vazio, mas o `v-model` do pai continua segurando a opção antiga — o formulário submete um valor que o usuário já removeu da tela.
- **Digitação livre.** Enquanto o usuário digita (antes de escolher uma opção), `temp_value` é uma string; o emit é bloqueado. No `MaxInputAutoCompleteApi` isso é especialmente relevante porque `forceSelection` tem default `false` (linha 56), ou seja, texto livre é explicitamente permitido e mesmo assim nunca chega ao pai.

A intenção do guard é compreensível — evitar emitir a string parcial a cada tecla enquanto o usuário ainda não escolheu. Mas o guard confunde dois casos distintos ("string parcial em digitação" e "campo esvaziado") e trata ambos como "não emitir".

Há ainda uma assimetria agravante: o watch de `props.modelValue` (`MaxInputAutoComplete.vue:75`) sincroniza o pai → filho **sem** condição alguma. Então o pai consegue limpar o filho, mas o filho nunca consegue limpar o pai — o estado dos dois diverge permanentemente após a primeira limpeza feita pelo usuário.

## Impacto

Perda de integridade de dados no formulário: um campo que o usuário limpou visualmente continua enviando o valor antigo no submit. Como o `isDone`/`caution` (linhas 56-66) é recalculado a partir de `temp_value` local, a UI pode até indicar "campo vazio/obrigatório pendente" enquanto o model do pai segue preenchido — sinais contraditórios. É o tipo de defeito que produz registros errados em produção sem nenhum erro visível.

## Plano de correção

1. Separar os dois casos no watch. Emitir sempre que o valor for um objeto (opção escolhida) **ou** quando o valor for vazio/nulo (limpeza):
   ```ts
   watch(temp_value, (val) => {
       isDone.value = testIsDone();
       if (val && typeof val === 'string') return; // digitacao parcial: nao propaga
       emit('update:modelValue', val ?? null);
   });
   ```
   Assim, `''`/`null`/`undefined` passam a limpar o pai, e a digitação parcial continua contida.
2. No `MaxInputAutoCompleteApi`, onde `forceSelection` default é `false` (linha 56), avaliar se texto livre deve ser propagado: quando `props.forceSelection === false`, faz sentido emitir também a string, já que a app aceitou entrada livre. Tornar essa decisão explícita e documentada, em vez de implícita no guard.
3. Aplicar a correção nos dois arquivos, mantendo-os em paridade.

## Verificação

- Novo teste em `tests/components/MaxInputAutoComplete.test.ts`: setar `temp_value` para uma opção (objeto), depois para `''`, e asserir que `update:modelValue` foi emitido duas vezes, a segunda com valor vazio/nulo (hoje é emitido só uma vez).
- Teste de que digitação parcial (string não vazia) **não** emite, preservando o comportamento intencional.
- Teste equivalente em `tests/components/MaxInputAutoCompleteApi.test.ts`, incluindo o caso `forceSelection: false`.
- Teste de ida e volta: pai limpa → filho limpa → pai continua limpo (sem re-emitir o valor antigo).
- `npx vitest run tests/components/MaxInputAutoComplete.test.ts tests/components/MaxInputAutoCompleteApi.test.ts`.
