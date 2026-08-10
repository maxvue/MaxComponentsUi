# `useMirroredModel()` usa watch raso e `ref()` que desempacota valores aninhados

- **Categoria:** bug
- **Severidade:** média
- **Arquivo(s):** `src/helpers/useMirroredModel.ts:48`, `:50-56`
- **Domínio:** helpers-composables

## Problema

```ts
// src/helpers/useMirroredModel.ts:48-56
const value = ref(props.modelValue) as Ref<T>;

watch(value, (newValue) => {
    emit('update:modelValue', options?.transform ? options.transform(newValue) : newValue);
}, { immediate: options?.immediate ?? false });

watch(() => props.modelValue, (newValue) => {
    if (! compare(newValue, value.value)) value.value = newValue;
});
```

Três defeitos concretos com `T` de tipo objeto/array:

1. **`watch(value, ...)` sobre um `ref` de objeto é raso.** O callback dispara quando o `.value` é **substituído**, não quando uma propriedade interna muda. Como `ref()` torna o objeto profundamente reativo, o consumidor pode mutar `value.value.campo = x` — mutação que não emite `update:modelValue`. O v-model fica dessincronizado silenciosamente. (Formalmente, `watch` sobre um `ref` cujo `.value` é reativo tem `deep` implícito no Vue 3.4+; abaixo disso, não. O comportamento depende da versão, o que por si só é motivo para explicitar.)

2. **O `compare` default é `===`** (linha 46). Para objetos, isso compara referências. Todo re-render do pai que produza um objeto novo com o mesmo conteúdo reatribui `value.value`, disparando o primeiro watch, que emite de volta ao pai — o **eco** que o JSDoc (linhas 27-32) diz explicitamente querer evitar. A proteção só funciona para primitivos.

3. **`ref(props.modelValue)` desempacota e torna reativo em profundidade.** Se o pai passa o mesmo objeto por referência, o `ref` local e o `props.modelValue` apontam para o **mesmo objeto**: mutar o local muta o do pai diretamente, violando o fluxo unidirecional. E `compare(newValue, value.value)` compararia o objeto consigo mesmo, sempre devolvendo `true` — o segundo watch nunca reatribui.

O teste `'funciona com valores numericos e transform de tipo'` (`tests/helpers/useMirroredModel.test.ts:82`) e todos os demais dos 9 casos usam apenas primitivos (strings e números). Nenhum caso usa objeto ou array, então nada disso está coberto.

## Impacto

Qualquer input desta lib que espelhe um objeto (ex.: valor de select com `SelectItem`, intervalo de datas, coordenada `{lat, lng}`) sofre eco ou dessincronização — exatamente os bugs que o composable foi criado para eliminar em `MaxInputCep.vue` e afins (mencionados nas linhas 30-32 do JSDoc).

## Plano de correção

1. Trocar `ref(props.modelValue)` por uma cópia quando `T` for objeto, ou documentar explicitamente que o composable só suporta valores primitivos e imutáveis.
2. Adicionar opção `deep?: boolean` repassada ao primeiro `watch`, para consumidores com valores estruturados.
3. Documentar no JSDoc que, para objetos, `compare` **precisa** ser fornecido (comparação estrutural), já que o default `===` não protege contra eco.
4. Se a decisão for restringir a primitivos, refletir isso no tipo: `T extends string | number | boolean | null | undefined`.

## Verificação

- Testes a criar/ajustar: `tests/helpers/useMirroredModel.test.ts` — adicionar casos com `T` objeto: (a) pai reenvia objeto novo com conteúdo idêntico e `compare` estrutural, assertando ausência de emissão de eco; (b) com `deep: true`, mutação de propriedade interna emite `update:modelValue`.
- Comandos: `npx vitest run tests/helpers/useMirroredModel.test.ts`, `npm run type-check`, `npm run lint`
