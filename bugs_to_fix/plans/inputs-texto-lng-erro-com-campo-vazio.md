# Longitude exibe "Longitude inválida." com o campo vazio e não obrigatório

- **Categoria:** bug
- **Severidade:** média
- **Arquivo(s):** `src/components/MaxInputCoordinateDecimalLng.vue:58-62`
- **Domínio:** inputs-texto

## Problema

O computed `error` do Lng não tem o caminho de saída para "campo vazio e opcional":

```ts
const error = computed(() => {
    if (isBlank(temp_value.value) && props.required) return 'Campo obrigatório';
    if (!done.value) return 'Longitude inválida.';
    return false;
});
```

Com `temp_value === ''` e `required: false`, a primeira condição é falsa (falta o `required`), cai na segunda, e `done` é `false` porque `toNumber('')` dá `0` e `only_numbers.value === 0` está na lista de reprovações (linha 49). Resultado: `error === 'Longitude inválida.'` num campo que o usuário nunca tocou.

O irmão `MaxInputCoordinateDecimalLat.vue:58-62` implementa o caminho correto e serve de referência:

```ts
if (isBlank(temp_value.value)) return props.required ? 'Campo obrigatório' : false;
```

Verificado montando ambos com `modelValue: ''` e `required: false`:

```
LNG blank error: 'Longitude inválida.'   caution: false
LAT blank error: false
```

Note que `caution` é `false` (linha 55 trata `temp_value === ''` corretamente), então o `InputBase` recebe `error` com string e `caution` falso ao mesmo tempo — estado inconsistente. Como `InputBase.vue:170` calcula `isError` a partir de `error` ser string com conteúdo, a borda vermelha e a mensagem aparecem mesmo sem `caution`.

## Impacto

Formulário com campo de longitude opcional já nasce marcado em vermelho com "Longitude inválida.", antes de qualquer interação. Prejudica a leitura do formulário e treina o usuário a ignorar mensagens de erro legítimas.

## Plano de correção

1. Alinhar o computed `error` do Lng ao do Lat:
   ```ts
   const error = computed(() => {
       if (isBlank(temp_value.value)) return props.required ? 'Campo obrigatório' : false;
       if (!done.value) return 'Longitude inválida.';
       return false;
   });
   ```
2. Aproveitar para conferir se `caution` e `error` passam a concordar em todos os estados (vazio/opcional, vazio/obrigatório, preenchido inválido, preenchido válido).
3. Não alterar a faixa de validação (`<= -74 || > -32.4`) neste achado — é comportamento separado.

## Verificação

- Teste: montar com `{ modelValue: '', required: false }` e afirmar `wrapper.vm.error === false`. O arquivo `tests/components/MaxInputCoordinateDecimalLng.test.ts` **não** cobre esse caso hoje (o Lat cobre, em `tests/components/MaxInputCoordinateDecimalLat.test.ts:120-126`).
- Teste: montar com `{ modelValue: '', required: true }` e afirmar `'Campo obrigatório'` (já existe, linha 49-55 do teste — deve continuar passando).
- `npx vitest run tests/components/MaxInputCoordinateDecimalLng.test.ts`.
