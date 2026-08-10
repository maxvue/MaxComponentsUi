# `trueValue` / `falseValue` do MaxInputToggle são declarados mas nunca chegam ao ToggleSwitch

- **Categoria:** bug
- **Severidade:** alta
- **Arquivo(s):** `src/components/MaxInputToggle.vue:14`, `src/components/MaxInputToggle.vue:53-56`, `src/components/MaxInputToggle.vue:75-76`
- **Domínio:** inputs-selecao-arquivo

## Problema

O componente declara as props `trueValue` e `falseValue` (linhas 53-54, com defaults `true`/`false` na linha 56) e cria os computed correspondentes (linhas 75-76). Porém, o `ToggleSwitch` do PrimeVue é montado sem receber nenhum dos dois:

```vue
<ToggleSwitch v-model="modelvalue" @change="update_value" />
```

Como `trueValue`/`falseValue` não são repassados, o `ToggleSwitch` opera com seus próprios defaults booleanos. Consequentemente, `modelvalue` (e o `update:modelValue` emitido nas linhas 62-64 e 79) sempre carrega `true`/`false`, **nunca** os valores customizados que a app configurou.

Os computed `trueValue`/`falseValue` (linhas 75-76) só são usados no template para decidir a classe `active` dos rótulos laterais (linhas 10 e 16). Ou seja, com valores customizados o componente entra num estado incoerente: o rótulo nunca acende (porque `modelvalue` é booleano e `trueValue` é, por exemplo, `'S'`), e a app recebe um booleano em vez do valor que pediu.

O componente irmão `MaxInputSwitch` implementa o contrato corretamente (`setValue`/`toggleValue` nas linhas 99-109 usam `props.trueValue`/`props.falseValue`), o que confirma que este é o comportamento esperado e não uma limitação intencional.

## Impacto

Qualquer app que use `MaxInputToggle` com `:true-value="'S'" :false-value="'N'"` (ou 1/0, ou strings de status) recebe silenciosamente `true`/`false` no `v-model` e grava dados errados no backend, além de os rótulos laterais nunca destacarem o estado ativo. É uma quebra silenciosa de contrato de API pública.

## Plano de correção

1. Repassar os valores ao `ToggleSwitch` (linha 14): `<ToggleSwitch v-model="modelvalue" :trueValue="trueValue" :falseValue="falseValue" @change="update_value" />`.
2. Ajustar o valor inicial: `const modelvalue = ref(props.modelValue)` já preserva o valor externo, mas confirmar que o `ToggleSwitch` reconhece `modelvalue` inicial não-booleano comparando-o com `trueValue` (o PrimeVue faz `modelValue === trueValue`).
3. Revisar `update_value` (linhas 78-80): com o `@change` do PrimeVue disparando *após* o `v-model`, o watch da linha 62 já emite; a emissão dupla é inofensiva hoje, mas vale consolidar em um único caminho de emissão para evitar dois `update:modelValue` idênticos por clique.
4. Alternativa arquiteturalmente mais limpa (avaliar durante a migração do PrimeVue): alinhar a implementação com a de `MaxInputSwitch`, que já resolve esse contrato sem depender do `ToggleSwitch`.

## Verificação

- Novo teste em `tests/components/MaxInputToggle.test.ts`: montar com `{ modelValue: 'N', trueValue: 'S', falseValue: 'N', trueLabel: 'Sim', falseLabel: 'Nao' }`, emitir a mudança pelo `ToggleSwitch` e asserir que `update:modelValue` foi emitido com `'S'` (hoje emite `true`).
- Teste de que o rótulo direito recebe a classe `active` quando `modelValue === trueValue` com valores não booleanos.
- Espelhar o caso já coberto em `tests/components/MaxInputSwitch.test.ts:59` ("respeita trueValue/falseValue customizados... inclusive falsy") para o Toggle.
- `npx vitest run tests/components/MaxInputToggle.test.ts`.
