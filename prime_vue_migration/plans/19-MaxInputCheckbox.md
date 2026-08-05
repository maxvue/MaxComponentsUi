# Plano 19 — `MaxInputCheckbox` (substitui `primevue/checkbox`)

| | |
|---|---|
| **id** | 19 |
| **Arquivo** | `src/components/MaxInputCheckbox.vue` |
| **Primitiva eliminada** | `Checkbox` |
| **Depende de** | — |
| **Teste existente** | `tests/components/SelectionInputs.test.ts` (verificar cobertura) |

> **Referência de ouro:** `src/components/MaxInputSwitch.vue` **já foi migrado** e
> implementa um controle binário dentro do `InputBase` sem PrimeVue. Leia-o antes de
> começar — estrutura, nomenclatura de classes e padrão de SCSS devem seguir o dele.

---

## 1. O `Checkbox` do PrimeVue 4

### Props

| Prop | Tipo | Default | Efeito |
|---|---|---|---|
| `modelValue` | `any` | — | valor (v-model) |
| `value` | `any` | — | valor deste checkbox em modo grupo |
| `binary` | `boolean` | `false` | modo booleano em vez de array |
| `trueValue` | `any` | `true` | valor quando marcado |
| `falseValue` | `any` | `false` | valor quando desmarcado |
| `indeterminate` | `boolean` | `false` | estado parcial |
| `disabled` | `boolean` | `false` | desabilita |
| `readonly` | `boolean` | `false` | somente leitura |
| `invalid` | `boolean` | `false` | `p-invalid` |
| `size` | `'small'\|'large'` | — | `p-checkbox-sm`/`-lg` |
| `inputId` | `string` | — | id do input interno (para `<label for>`) |
| `variant` | `'outlined'\|'filled'` | — | variante visual |

### Comportamento de grupo (importante)

Quando `binary` é `false` e `modelValue` é um **array**, marcar adiciona `value` ao
array e desmarcar remove. Esse é o modo default do PrimeVue. Verifique se o
`MaxInputCheckbox` atual usa esse modo — se usar, **precisa ser preservado**.

### Markup

```html
<div class="p-checkbox p-component">
    <input type="checkbox" class="p-checkbox-input" role="checkbox" aria-checked="..." />
    <div class="p-checkbox-box">
        <svg class="p-checkbox-icon">...</svg>   <!-- check ou traço (indeterminate) -->
    </div>
</div>
```

O `<input type="checkbox">` real fica **transparente sobre a caixa visual** — é ele que
recebe foco e teclado. Não substitua por `<div>` com `@click`: isso destrói a
acessibilidade nativa.

### Eventos

`update:modelValue`, `change`, `focus`, `blur`.

---

## 2. Implementação

```vue
<template>
    <InputBase v-bind="props" class="max-checkbox">
        <div :class="containerClass">
            <input
                ref="inputRef"
                type="checkbox"
                class="p-checkbox-input"
                :id="props.inputId"
                :checked="isChecked"
                :disabled="props.disabled"
                :readonly="props.readonly"
                :aria-checked="props.indeterminate ? 'mixed' : isChecked"
                @change="onChange"
                @focus="$emit('focus', $event)"
                @blur="$emit('blur', $event)"
            />
            <div class="p-checkbox-box">
                <MaxIcon v-if="props.indeterminate" icon="mdi:minus" class="p-checkbox-icon" />
                <MaxIcon v-else-if="isChecked" icon="mdi:check" class="p-checkbox-icon" />
            </div>
        </div>
    </InputBase>
</template>
```

```ts
const isChecked = computed(() => {
    if (props.binary) return props.modelValue === props.trueValue;
    if (Array.isArray(props.modelValue)) return props.modelValue.includes(props.value);
    return props.modelValue === props.value;
});

const onChange = (event: Event) => {
    if (props.disabled || props.readonly) return;

    let next: any;
    if (props.binary) {
        next = isChecked.value ? props.falseValue : props.trueValue;
    } else if (Array.isArray(props.modelValue)) {
        next = isChecked.value
            ? props.modelValue.filter((v: any) => v !== props.value)
            : [...props.modelValue, props.value];
    } else {
        next = isChecked.value ? null : props.value;
    }

    emit('update:modelValue', next);
    emit('change', event);
};
```

> **Não mute o array recebido.** `[...props.modelValue, props.value]` cria um novo array.
> `push` numa prop é mutação de estado do pai e produz bugs de reatividade difíceis de
> rastrear.

### `aria-checked="mixed"`
É o valor correto para indeterminado. `true`/`false` num checkbox parcial mente para o
leitor de tela.

### Estilo

Siga o padrão de `MaxInputSwitch.vue`: variáveis do tema Max, `transition` nas mudanças
de estado. O `.p-checkbox-input` precisa de `position: absolute; opacity: 0; inset: 0;
cursor: pointer` — invisível mas clicável e focável. O estado de foco deve ser **visível**
(`:focus-visible + .p-checkbox-box { outline: ... }`) — sem isso, navegação por teclado
fica cega.

---

## 3. Teste

1. renderiza `<input type="checkbox">` real (não um div);
2. `binary` → clicar alterna entre `trueValue` e `falseValue`;
3. modo array → marcar **adiciona** o `value` ao array;
4. modo array → desmarcar **remove** o `value`;
5. o array original **não é mutado** (compare referências);
6. `indeterminate` → `aria-checked="mixed"` e ícone de traço;
7. `disabled` → não emite ao clicar;
8. `readonly` → não emite ao clicar;
9. `Space` no input alterna (teclado);
10. `inputId` vira o `id` do input (para `<label for>`);
11. estados do `InputBase` (`error`, `required`) refletem.

---

## 4. Checklist

- [ ] Sem PrimeVue
- [ ] `<input type="checkbox">` nativo preservado (acessibilidade)
- [ ] Modo binary **e** modo array funcionam
- [ ] Array não é mutado
- [ ] `aria-checked="mixed"` no indeterminado
- [ ] Foco visível por teclado
- [ ] `type-check`, `lint`, `test` OK
