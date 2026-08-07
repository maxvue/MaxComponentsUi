# Plano 01 — `MaxBaseInput` (substitui `primevue/inputtext`)

| | |
|---|---|
| **id** | 1 |
| **Arquivo a criar** | `src/components/base/MaxBaseInput.vue` |
| **Primitiva eliminada** | `InputText` |
| **Depende de** | — |
| **Destrava** | ids 6–15, 21, 23, 24, 29, 31 (10+ componentes) |

Esta é a primitiva **mais crítica** da migração. Dez componentes de input de texto a
consomem. Erre aqui e o erro se propaga por toda a Fase 1.

---

## 1. O que o `InputText` do PrimeVue realmente faz

Apesar da fama, o `InputText` do PrimeVue 4 é **fino**. Ele renderiza um único
`<input>` e sua responsabilidade é quase toda de classes CSS e integração com o
`FormField`. Anatomia real (PrimeVue 4.5):

```html
<input class="p-inputtext p-component" data-p="..." />
```

### Props (API pública a replicar)

| Prop | Tipo | Default | Comportamento |
|---|---|---|---|
| `modelValue` | `string \| null` | — | valor do input |
| `defaultValue` | `string \| null` | — | valor inicial no modo não-controlado |
| `name` | `string` | — | nome do campo (usado pelo Form) |
| `size` | `'small' \| 'large' \| null` | `null` | adiciona `p-inputtext-sm` / `p-inputtext-lg` |
| `invalid` | `boolean` | `false` | adiciona `p-invalid`; reflete em `aria-invalid` |
| `variant` | `'outlined' \| 'filled' \| null` | `null` | `p-variant-filled` quando `filled` |
| `fluid` | `boolean \| null` | `null` | `p-inputtext-fluid` → `width: 100%` |
| `formControl` | `object` | — | integração com o Form (não usado neste repo) |
| `unstyled` | `boolean` | `false` | suprime classes (não usado neste repo) |

> **Herdadas:** todo atributo não declarado (`type`, `placeholder`, `disabled`,
> `readonly`, `maxlength`, `autocomplete`, `inputmode`, `id`, `aria-*`…) cai no
> `<input>` via `inheritAttrs`. **Isso é essencial** — os componentes deste repo
> passam `type`, `placeholder` e `disabled` por essa via.

### Eventos

`update:modelValue`, `input`, `change`, `focus`, `blur`, `keydown`, `keyup`.
Na prática, PrimeVue só declara `update:modelValue` e deixa o resto cair como
atributo herdado — mas o `@blur` usado por `MaxInputText.vue` **precisa** funcionar.

### Classes CSS geradas (contrato com o tema)

`p-inputtext`, `p-component`, `p-filled` (quando tem valor), `p-inputtext-sm`,
`p-inputtext-lg`, `p-invalid`, `p-disabled`, `p-inputtext-fluid`, `p-variant-filled`.

---

## 2. Como este repositório usa o `InputText`

Levantamento real (`grep -n "InputText" src/components/*.vue`):

```
MaxInputText.vue                  <InputText v-bind="props" :type :placeholder v-model fluid @blur />
MaxInputCep.vue                   + v-maska
MaxInputCpfCnpj.vue               + v-maska (máscara dinâmica)
MaxInputPhoneMail.vue             + v-maska
MaxInputSearch.vue                simples
MaxInputCoordinateDecimalLat.vue  simples
MaxInputCoordinateDecimalLng.vue  simples
MaxInputCreditCard.vue            + v-maska
MaxInputCreditCardCvv.vue         + v-maska
MaxInputCreditCardDate.vue        + v-maska
MaxColorPicker.vue                simples
MaxPhoneField.vue                 simples
MaxInputIconPicker.vue            importado como PrimeInputText
```

**Conclusões que orientam o desenho:**

1. O uso real é **estreito**: `v-model`, `fluid`, `type`, `placeholder`, `disabled`,
   `@blur` e a diretiva `v-maska`. Não há uso de `variant`, `size`, `formControl`
   nem `unstyled`.
2. `v-bind="props"` é usado à larga — o componente recebe props do Max (como `label`,
   `icon`, `msg`) que **não** são de input e caem como atributos no DOM. A implementação
   nova deve **filtrar** essas props em vez de despejá-las no `<input>` (o PrimeVue
   também as despejava; limpar isso é melhoria segura e invisível).
3. **`v-maska` precisa continuar funcionando.** A diretiva do Maska se aplica ao
   elemento onde é declarada. Se `MaxBaseInput` for um wrapper com `<div>` externo, a
   diretiva vai para o `<div>` e a máscara **quebra silenciosamente**.
   ⚠️ **Requisito de desenho: o elemento raiz de `MaxBaseInput` DEVE ser o próprio
   `<input>`, sem wrapper.**

---

## 3. Implementação

### Estrutura

```vue
<template>
    <input
        ref="inputRef"
        :class="inputClass"
        :value="modelValue"
        :disabled="disabled"
        :aria-invalid="invalid || undefined"
        @input="onInput"
        @blur="onBlur"
        @focus="onFocus"
    />
</template>
```

Note: **sem `<div>` envolvente** (requisito do `v-maska`) e **sem `<slot>`**
(um `<input>` é void).

### Script

```ts
<script setup lang="ts">
    import { computed, ref } from 'vue';

    defineOptions({ inheritAttrs: true });   // atributos extras vão para o <input>

    const props = withDefaults(
        defineProps<{
            modelValue?: string | number | null;
            size?: 'small' | 'large' | null;
            invalid?: boolean;
            variant?: 'outlined' | 'filled' | null;
            fluid?: boolean | null;
            disabled?: boolean;
        }>(),
        { modelValue: '', size: null, invalid: false, variant: null, fluid: null, disabled: false }
    );

    const emit = defineEmits<{
        'update:modelValue': [value: string];
        input: [event: Event];
        blur: [event: FocusEvent];
        focus: [event: FocusEvent];
    }>();

    const inputRef = ref<HTMLInputElement | null>(null);

    const hasValue = computed(() => props.modelValue !== null && props.modelValue !== undefined && props.modelValue !== '');

    const inputClass = computed(() => ({
        'p-inputtext': true,
        'p-component': true,
        'p-filled': hasValue.value,
        'p-inputtext-sm': props.size === 'small',
        'p-inputtext-lg': props.size === 'large',
        'p-inputtext-fluid': props.fluid === true,
        'p-variant-filled': props.variant === 'filled',
        'p-invalid': props.invalid === true,
        'p-disabled': props.disabled === true
    }));

    const onInput = (event: Event) => {
        emit('update:modelValue', (event.target as HTMLInputElement).value);
        emit('input', event);
    };

    const onBlur = (event: FocusEvent) => emit('blur', event);
    const onFocus = (event: FocusEvent) => emit('focus', event);

    defineExpose({ $el: inputRef, focus: () => inputRef.value?.focus() });
</script>
```

### Pontos de atenção

- **`:value` + `@input`, não `v-model`.** O `v-maska` reescreve o valor do DOM; o
  `v-model` do Vue brigaria com a máscara. Ligação manual é o que o PrimeVue faz e o
  que o Maska espera.
- **`hasValue` alimenta `p-filled`.** O tema `MaxStyle` usa essa classe; se ela sumir,
  labels flutuantes param de subir.
- **`defineExpose`** — `MaxInputSelect` e outros usam `ref="elem"` para chamar métodos.
  Exponha `$el` e `focus()` para manter compatibilidade.

### Estilo

O `<style>` do `MaxBaseInput.vue` deve **replicar** o visual que o `MaxStyle` aplicava
via tema Aura em `.p-inputtext`. Extraia os valores computados rodando o playground
antes da migração e inspecionando o elemento:

```bash
npm run dev:playground   # inspecione um MaxInputText, copie os valores computados
```

Use as variáveis CSS do tema Max (`var(--background-300)`, `var(--max-primary-500)`),
**não** valores literais. Propriedades a cobrir: `padding`, `border`, `border-radius`,
`background`, `color`, `font-size`, `transition`, e os estados `:hover`, `:focus`,
`:disabled`, `.p-invalid`.

---

## 4. Teste — `tests/components/base/MaxBaseInput.test.ts` (criar)

Cobertura obrigatória:

1. renderiza um `<input>` como **elemento raiz** (`wrapper.element.tagName === 'INPUT'`)
   — protege o contrato do `v-maska`;
2. aplica `p-inputtext` e `p-component`;
3. `p-filled` aparece com valor e some sem valor;
4. digitar emite `update:modelValue` com o valor novo;
5. mudança na prop `modelValue` reflete no `input.value`;
6. `@blur` e `@focus` são emitidos;
7. `fluid` → `p-inputtext-fluid`; `size="small"` → `p-inputtext-sm`;
8. `invalid` → classe `p-invalid` **e** `aria-invalid="true"`;
9. `disabled` → atributo `disabled` **e** classe `p-disabled`;
10. atributos herdados (`placeholder`, `type`, `maxlength`) chegam ao `<input>`;
11. **teste de integração com máscara**: monte um componente que use
    `v-maska` sobre o `MaxBaseInput` e confirme que a máscara aplica.

### Mutações que o teste precisa pegar

- remover `emit('update:modelValue')` → teste 4 deve falhar;
- trocar `hasValue` por `true` fixo → teste 3 deve falhar;
- envolver o `<input>` num `<div>` → teste 1 deve falhar.

---

## 5. Checklist de conclusão

- [ ] `src/components/base/MaxBaseInput.vue` criado, raiz é `<input>`
- [ ] `grep -n "primevue" src/components/base/MaxBaseInput.vue` → vazio
- [ ] Todas as 11 asserções do teste passam
- [ ] Teste da mutação aplicado e documentado em `notas`
- [ ] `npm run type-check`, `npm run lint`, `npm run test` passam
- [ ] **NÃO** exportado em `src/index.ts` (é primitiva interna)
- [ ] **NÃO** adicionado ao manifesto do resolver
