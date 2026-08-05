# Plano 06 — `MaxInputText` (componente-piloto da Fase 1)

| | |
|---|---|
| **id** | 6 |
| **Arquivo** | `src/components/MaxInputText.vue` |
| **Primitiva eliminada** | `InputText` |
| **Depende de** | 1 (`MaxBaseInput`) |
| **Teste existente** | `tests/components/MaxInputText.test.ts` |

Este é o **piloto** da Fase 1: valide o padrão aqui e replique-o nos ids 7–15. Se o
padrão estiver errado, você o repetirá dez vezes.

---

## 1. Estado atual

```vue
<template>
    <InputBase v-bind="props" :done="props.done ?? isDone" :error="props.error ?? error_msg" :caution="caution">
        <InputText v-bind="props" :type="props.type" :placeholder="props.placeholder" v-model="temp_value" fluid @blur="isDone = testIsDone()" />
        <slot></slot>
    </InputBase>
</template>
```

`InputBase` **já é PrimeVue-free**. A única dependência é `import InputText from
'primevue/inputtext'` (linha 17).

### Lógica de negócio a preservar intacta

O componente carrega validação própria que **não pode ser tocada**:

- `isDone` — ref recalculada no `@blur`;
- `isEqual` — compara com `targetValue` via `toSearchableString`;
- `isRequiredDone` — verifica preenchimento quando `required`;
- `testIsDone()` — cascata de precedência: `done` → `isEqual` → `isRequiredDone` → `caution`;
- `caution` computed;
- `error_msg` computed — lê `attrs.errMsg` / `attrs.error_message` / `attrs.error_msg`
  e monta mensagens em pt-BR ("Campo obrigatório", "Valor esperado: …", "Valor inválido");
- os dois `watch` que sincronizam `temp_value` ↔ `modelValue`.

**Nada disso muda.** A migração é uma troca de uma tag no template e uma linha de import.

---

## 2. A mudança

```diff
- <InputText v-bind="props" :type="props.type" :placeholder="props.placeholder" v-model="temp_value" fluid @blur="isDone = testIsDone()" />
+ <MaxBaseInput :type="props.type" :placeholder="props.placeholder" :disabled="props.disabled" v-model="temp_value" fluid @blur="isDone = testIsDone()" />
```

```diff
- import InputText from 'primevue/inputtext';
+ import MaxBaseInput from './base/MaxBaseInput.vue';
```

### Por que remover o `v-bind="props"` do input

Hoje `v-bind="props"` despeja **todas** as props do Max no `<input>`, incluindo `label`,
`msg`, `iconMessage`, `targetValue`, `done`, `caution` — que viram atributos DOM
inválidos (`label="Nome"` num `<input>` não é `label`; `msg="..."` não existe).

O PrimeVue absorvia parte disso nas props declaradas dele e o resto vazava para o DOM.
Passar explicitamente só o que o `<input>` entende é mais correto.

⚠️ **Mas há um risco real:** se alguma app consumidora depende de um atributo que hoje
vaza (ex.: um `data-*` ou `autocomplete` passado por `v-bind` externo), removê-lo
quebra. **Mitigação:** o `MaxBaseInput` tem `inheritAttrs: true`, então atributos
passados de fora (`<MaxInputText autocomplete="off" />`) continuam chegando ao `<input>`
via `attrs` — apenas as **props declaradas do Max** deixam de vazar. Isso é seguro.

Registre essa análise em `notas`.

---

## 3. Verificações específicas

Rode o teste existente **antes** de mudar qualquer coisa e anote quantas asserções
passam:

```bash
npx vitest run tests/components/MaxInputText.test.ts
```

Depois da mudança, ele deve passar **com o mesmo número de asserções**. Se algum
seletor do teste apontar para `.p-inputtext`, ele continua válido — o `MaxBaseInput`
emite essa classe de propósito.

### Ampliações do teste (obrigatórias)

Adicione ao arquivo existente:

1. `expect(wrapper.html()).not.toContain('p-inputtext-fluid')` **não** — ao contrário:
   confirme que `fluid` **continua** gerando `p-inputtext-fluid`;
2. o `@blur` recalcula `isDone` (dispare `blur` e verifique a classe `done` no `InputBase`);
3. `required` + campo vazio + blur → mensagem "Campo obrigatório";
4. `targetValue` divergente → mensagem "Valor esperado: …";
5. `attrs.errMsg` sobrescreve a mensagem padrão;
6. atributo externo (`autocomplete="off"`) chega ao `<input>`;
7. props do Max (`label`, `msg`) **não** aparecem como atributos no `<input>`.

---

## 4. Checklist de conclusão

- [ ] `grep -n "primevue" src/components/MaxInputText.vue` → vazio
- [ ] Toda a lógica de validação intacta (diff mostra só template + import)
- [ ] Teste existente passa sem enfraquecimento
- [ ] 7 asserções novas adicionadas
- [ ] Teste da mutação aplicado
- [ ] `npm run type-check && npm run lint && npm run test` passam
- [ ] **Padrão validado** — registre em `notas` o diff exato para replicar nos ids 7–15
