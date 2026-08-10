# Dois watchers concorrentes sobre `modelValue` no MaxInputSelect, um deles com corrida no `default`

- **Categoria:** bug
- **Severidade:** média
- **Arquivo(s):** `src/components/MaxInputSelect.vue:133-134`, `src/components/MaxInputSelect.vue:179-181`
- **Domínio:** inputs-selecao-arquivo

## Problema

O componente registra **dois** watchers sobre a mesma fonte, separados por 45 linhas de código:

```ts
// linha 134
watch(() => props.modelValue, (val) => temp_value.value = val);
...
// linhas 179-181
watch(() => props.modelValue, () => {
    if (isBlank(props.modelValue) && props.default !== undefined) temp_value.value = props.default;
}, { deep: true });
```

Problemas concretos:

1. **Ordem implícita como regra de negócio.** Quando `modelValue` vira vazio e há um `default`, os dois watchers rodam em sequência: o primeiro grava o valor vazio em `temp_value`, o segundo sobrescreve com o `default`. O resultado correto depende exclusivamente da ordem de registro — mover uma das declarações no arquivo muda o comportamento silenciosamente. Pior: entre os dois, `temp_value` passa transitoriamente pelo valor vazio, e o `watch(temp_value, ...)` da linha 133 **emite** `update:modelValue` com esse valor intermediário. Ou seja, o pai recebe uma emissão espúria de valor vazio antes de receber o default.

2. **O `default` nunca é aplicado na montagem.** `temp_value` é inicializado com `ref(props.modelValue)` (linha 118) e o watcher do `default` não tem `immediate: true`. Um componente montado já com `modelValue` vazio e `default` definido **não** aplica o default — ele só é aplicado se `modelValue` mudar depois. Esse é o caso de uso mais óbvio da prop (`<MaxInputSelect :default="'ativo'" />` num formulário novo) e é justamente o que não funciona.

3. **`deep: true` desnecessário e caro.** O segundo watcher observa `() => props.modelValue`, que num select é tipicamente um escalar (string/number). `deep: true` força travessia recursiva a cada checagem, sem benefício.

O componente irmão `MaxTagSelect` tem o mesmo padrão com uma variação (`watchDebounced` com 500ms, `MaxTagSelect.vue:176-180`), o que confirma que a lógica foi copiada sem revisão — e lá o atraso de 500ms cria uma janela ainda maior em que o valor vazio fica visível.

## Impacto

Emissão espúria de `update:modelValue` com valor vazio, que pode disparar validações, requisições ou dirty-checking indevidos no formulário do pai. E a prop pública `default` não funciona no cenário de montagem, que é o principal — apps que a usam veem o campo vazio e concluem que a prop está quebrada.

## Plano de correção

1. Unificar os dois watchers num único handler, tornando a precedência explícita em vez de dependente da ordem de registro:
   ```ts
   watch(() => props.modelValue, (val) => {
       temp_value.value = (isBlank(val) && props.default !== undefined) ? props.default : val;
   }, { immediate: true });
   ```
2. O `immediate: true` resolve o defeito de montagem e permite simplificar a inicialização da linha 118.
3. Remover `deep: true`, que não tem uso para um valor escalar.
4. Confirmar que a emissão via `watch(temp_value, ...)` (linha 133) passa a ocorrer uma única vez por mudança, com o valor final.
5. Aplicar a mesma unificação em `MaxTagSelect.vue:176-180`, mantendo os dois componentes em paridade (avaliar se o debounce de 500ms lá ainda faz sentido depois da unificação — provavelmente não).

## Verificação

- Novo teste em `tests/components/MaxInputSelect.test.ts`: montar com `{ modelValue: '', default: 'ativo' }` e asserir que `temp_value` é `'ativo'` logo após a montagem (hoje é `''`).
- Teste de emissão única: mudar `modelValue` de `'a'` para `''` com `default: 'ativo'` deve emitir `update:modelValue` **uma** vez, com `'ativo'` — não duas vezes com `''` e depois `'ativo'`.
- Teste de que um `modelValue` preenchido não é sobrescrito pelo `default`.
- Teste equivalente em `tests/components/MaxTagSelect.test.ts` (complementa os casos das linhas 148 e 159, que hoje só cobrem o caminho pós-montagem com o watchDebounced mockado).
- `npx vitest run tests/components/MaxInputSelect.test.ts tests/components/MaxTagSelect.test.ts` — deve elevar a cobertura de branches do MaxInputSelect, hoje em 67%.
