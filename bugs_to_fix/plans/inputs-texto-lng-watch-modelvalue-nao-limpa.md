# Longitude ignora limpeza externa: `modelValue` 0, '' ou null não atualizam o campo

- **Categoria:** bug
- **Severidade:** média
- **Arquivo(s):** `src/components/MaxInputCoordinateDecimalLng.vue:85`
- **Domínio:** inputs-texto

## Problema

O watch de sincronização do valor externo tem um guard truthy:

```ts
watch(() => props.modelValue, () => temp_value.value = props.modelValue ? toNumber(props.modelValue, 6) : temp_value.value);
```

Quando `props.modelValue` é falsy — `0`, `''`, `null`, `undefined` — o watch reatribui `temp_value` a **si mesmo**, isto é, mantém o valor antigo. Não há como o pai limpar ou zerar o campo.

Verificado montando com `modelValue: -46.6` e depois trocando a prop:

```
setProps({ modelValue: 0 })  -> temp_value continua -46.6
setProps({ modelValue: '' }) -> temp_value continua -46.6
```

O irmão `MaxInputCoordinateDecimalLat.vue:93-98` faz a atribuição direta, sem guard, e limpa corretamente.

O guard provavelmente foi introduzido para evitar o eco da própria emissão (o watch de `temp_value` na linha 78 emite `toNumber(temp_value, 6)`, que para campo vazio é `0`, e esse `0` voltaria como prop). Mas o remédio bloqueia também a limpeza legítima vinda do pai — o cenário "resetar formulário" é justamente `modelValue = ''` ou `null`.

## Impacto

- `form.reset()` / troca de registro no formulário não limpa a longitude: o valor do registro anterior permanece visível e é reemitido, podendo ser salvo no registro novo.
- Comportamento divergente entre Lat e Lng, dois componentes que os consumidores usam sempre em par.

## Plano de correção

1. Trocar o guard truthy por uma comparação de equivalência, no espírito do `compare` do `useMirroredModel` (`src/helpers/useMirroredModel.ts:46,54-56`): só reatribuir quando o valor externo for **diferente** do local, tratando `null`/`''`/`undefined` como "vazio" explícito.
   ```ts
   watch(() => props.modelValue, (val) => {
       if (isBlank(val)) { temp_value.value = ''; return; }
       const next = toNumber(val, 6);
       if (next !== toNumber(temp_value.value, 6)) temp_value.value = next;
   });
   ```
2. Avaliar migrar o componente inteiro para `useMirroredModel`, como já foi feito em `MaxInputCep` e `MaxInputCpfCnpj` — o helper existe exatamente para esse padrão e resolveria o eco sem o guard artesanal.
3. Aplicar a mesma revisão ao Lat: lá não há guard nenhum (linha 96-98), o que é o extremo oposto e pode reintroduzir eco quando o pai normaliza o número.

## Verificação

- Teste: montar com `modelValue: -46.6`, `setProps({ modelValue: '' })`, afirmar `temp_value === ''`.
- Teste: montar com `modelValue: -46.6`, `setProps({ modelValue: null })`, afirmar campo limpo.
- Teste de não-regressão do eco: alterar `temp_value` internamente e confirmar que não há loop infinito de `update:modelValue` (contar emissões).
- `npx vitest run tests/components/MaxInputCoordinateDecimalLng.test.ts tests/components/MaxInputCoordinateDecimalLat.test.ts`.
