# Plano 16 — `MaxButton` (substitui `primevue/button`)

| | |
|---|---|
| **id** | 16 |
| **Arquivos** | `src/components/MaxButton.vue` **e** `src/types/index.ts` |
| **Primitiva eliminada** | `Button` |
| **Depende de** | — |
| **Bloqueia** | id 33 (`MaxTable` usa botões nos controles) |
| **Teste existente** | `tests/components/MaxButton.test.ts` |

⚠️ **Dois arquivos.** `src/types/index.ts:1` importa
`import type { ButtonProps as PrimeButtonProps } from 'primevue/button'` e o usa em
`MaxButtonsType extends Omit<PrimeButtonProps, 'size' | 'iconPos'>`. Esse tipo é
**exportado publicamente** — apps consumidoras podem importá-lo.

---

## 1. O `Button` do PrimeVue 4

### Props

| Prop | Tipo | Default | Classe/efeito |
|---|---|---|---|
| `label` | `string` | — | texto |
| `icon` | `string` | — | classe de ícone (aqui é sobrescrito pelo slot `#icon`) |
| `iconPos` | `'left'\|'right'\|'top'\|'bottom'` | `'left'` | `p-button-icon-{pos}` |
| `badge` | `string` | — | badge sobreposto |
| `badgeSeverity` | `string` | — | severidade do badge |
| `loading` | `boolean` | `false` | `p-button-loading`; usa slot `#loadingicon` |
| `loadingIcon` | `string` | — | ícone de carregamento |
| `severity` | `'secondary'\|'success'\|'info'\|'warn'\|'help'\|'danger'\|'contrast'` | — | `p-button-{severity}` |
| `raised` | `boolean` | `false` | `p-button-raised` |
| `rounded` | `boolean` | `false` | `p-button-rounded` |
| `text` | `boolean` | `false` | `p-button-text` |
| `outlined` | `boolean` | `false` | `p-button-outlined` |
| `link` | `boolean` | `false` | `p-button-link` |
| `size` | `'small'\|'large'` | — | `p-button-sm` / `p-button-lg` |
| `variant` | `'outlined'\|'text'\|'link'` | — | forma moderna das flags acima |
| `fluid` | `boolean` | — | `p-button-fluid` |
| `plain` | `boolean` | `false` | `p-button-plain` |
| `disabled` | `boolean` | `false` | `p-disabled` + atributo |
| `as` | `string \| Component` | `'button'` | elemento renderizado |
| `asChild` | `boolean` | `false` | modo headless |

### Markup

```html
<button class="p-button p-component" type="button">
    <span class="p-button-icon p-button-icon-left"></span>
    <span class="p-button-label">Label</span>
</button>
```

### Slots

`default`, `icon`, `loadingicon` — **os três são usados** por `MaxButton.vue`.

---

## 2. Como o `MaxButton` usa hoje

```vue
<Button v-bind="props as PrimeButtonProps" :iconPos="iconPos" uppercase
        :class="{ 'max-button-dashed': props.dashed }" @click="onClick" v-if="props.label">
    <template #default><slot></slot></template>
    <template #icon>  <MaxIcon ... /> </template>
    <template #loadingicon><MaxIcon icon="loading" ... /></template>
</Button>
<MaxIconButton v-bind="props" v-else class="icon-button-b" />
```

Lógica própria a **preservar**: `isTransparentVariant`, `light`, `iconColor`, `iconPos`,
`data`, `onClick` (com `goToRoute`, `props.action` e o emit `click`), e o fallback para
`MaxIconButton` quando não há `label`.

### O contrato de CSS que NÃO pode quebrar

O bloco `<style>` do próprio arquivo depende destes seletores:

```
.p-button-outlined  .p-button-text  .p-button-link
.p-button-secondary .p-button-success .p-button-info
.p-button-warn  .p-button-warning  .p-button-help
.p-button-danger  .p-button-contrast
[data-p~='outlined']  [data-p~='text']  [data-p~='link']
```

E as variáveis `var(--max-button-{severity}-border-color)`.

**A nova implementação deve emitir exatamente essas classes**, incluindo o atributo
`data-p` (o PrimeVue 4 usa `data-p="outlined"` etc. em paralelo às classes). Se você
emitir só as classes e não o `data-p`, os seletores `[data-p~='...']` do SCSS morrem
silenciosamente e ícones outlined perdem a cor.

---

## 3. Implementação

### Estrutura

```vue
<template>
    <button
        v-if="props.label"
        :class="buttonClass"
        :data-p="dataP"
        :type="props.type ?? 'button'"
        :disabled="props.disabled || props.loading"
        :aria-busy="props.loading || undefined"
        uppercase
        @click="onClick"
    >
        <span class="p-button-icon p-button-icon-left" v-if="iconPos === 'left' && (props.icon ?? props.i) && !props.loading">
            <MaxIcon ... />
        </span>
        <span class="p-button-icon" v-if="props.loading">
            <MaxIcon icon="loading" ... />
        </span>
        <span class="p-button-label">
            <slot>{{ props.label }}</slot>
        </span>
        <span class="p-button-icon p-button-icon-right" v-if="iconPos === 'right' && (props.icon ?? props.i) && !props.loading">
            <MaxIcon ... />
        </span>
    </button>
    <MaxIconButton v-bind="props" v-else class="icon-button-b" />
</template>
```

### Cálculo de classes

```ts
const variantFlags = computed(() => ({
    outlined: props.outlined === true || props.variant === 'outlined',
    text: props.text === true || props.variant === 'text',
    link: props.link === true || props.variant === 'link'
}));

const buttonClass = computed(() => ({
    'p-button': true,
    'p-component': true,
    [`p-button-${props.severity}`]: !!props.severity,
    'p-button-outlined': variantFlags.value.outlined,
    'p-button-text': variantFlags.value.text,
    'p-button-link': variantFlags.value.link,
    'p-button-raised': props.raised === true,
    'p-button-rounded': props.rounded === true,
    'p-button-plain': props.plain === true,
    'p-button-fluid': props.fluid === true,
    'p-button-loading': props.loading === true,
    'p-button-sm': props.size === 'small',
    'p-button-lg': props.size === 'large',
    'p-disabled': props.disabled === true,
    'max-button-dashed': props.dashed === true
}));

// data-p espelha as flags de variante (contrato dos seletores [data-p~='...'])
const dataP = computed(() => {
    const tokens: string[] = [];
    if (variantFlags.value.outlined) tokens.push('outlined');
    if (variantFlags.value.text) tokens.push('text');
    if (variantFlags.value.link) tokens.push('link');
    if (props.severity) tokens.push(props.severity);
    return tokens.length ? tokens.join(' ') : undefined;
});
```

> **Atenção ao `warn` vs `warning`.** O SCSS trata os dois (`.p-button-warn,
> .p-button-warning`). O `MaxButtonsType` declara `'warning'`; o PrimeVue 4 usa
> `'warn'`. Emita a classe correspondente ao valor recebido e, para `'warning'`, emita
> **ambas** — assim nenhum dos dois seletores fica órfão.

### Estilo

O visual dos botões vinha do preset `MaxStyle`/Aura. Você precisa escrever o SCSS de
`.p-button` neste arquivo: `padding`, `border-radius`, `background`, `color`, `border`,
`font-weight`, `gap` entre ícone e label, `transition`, e as variantes por severidade
usando `var(--max-button-{severity}-*)`.

**Método recomendado:** antes de remover o PrimeVue, rode o playground, inspecione um
botão de cada severidade × variante, e copie os valores computados. É tedioso e é a
única forma de não regredir visualmente.

---

## 4. `src/types/index.ts`

```diff
- import type { ButtonProps as PrimeButtonProps } from 'primevue/button';
```

E substitua a herança:

```diff
- export interface MaxButtonsType extends /* @vue-ignore */ Omit<PrimeButtonProps, 'size' | 'iconPos'> {
+ export interface MaxButtonsType extends /* @vue-ignore */ Omit<MaxBaseButtonProps, 'size' | 'iconPos'> {
```

Declare `MaxBaseButtonProps` no próprio arquivo com as props da seção 1. **Exporte-o** —
`MaxButtonsType` é público e apps podem depender das props herdadas.

> Não simplesmente delete o `extends`. Isso removeria dezenas de props do tipo público e
> quebraria a tipagem de apps consumidoras em tempo de compilação.

---

## 5. Teste — ampliar `tests/components/MaxButton.test.ts`

Baseline primeiro. Depois adicione:

1. renderiza `<button>` com `p-button` e `p-component`;
2. cada `severity` gera `p-button-{severity}`; `'warning'` gera **as duas** classes;
3. `outlined`/`text`/`link` geram classe **e** token em `data-p`;
4. `variant="outlined"` equivale a `outlined: true`;
5. `loading` → `p-button-loading`, `aria-busy`, `disabled`, e o ícone de loading substitui o normal;
6. `disabled` → atributo + `p-disabled` + clique **não** emite;
7. `iconPos="right"` posiciona o ícone depois do label no DOM;
8. `iconRight` força `iconPos` right (lógica própria);
9. sem `label` → renderiza `MaxIconButton`, não `<button>`;
10. `props.route` → chama `goToRoute` e **não** emite `click`;
11. `props.action` → chama a action com `{ event, data }` e **não** emite `click`;
12. sem route nem action → emite `click`;
13. `dashed` → `max-button-dashed`;
14. slot default sobrescreve o label.

### Mutações a testar

- remover a emissão do `data-p` → teste 3 falha;
- inverter a precedência route/action/emit em `onClick` → testes 10–12 falham.

---

## 6. Checklist de conclusão

- [ ] `grep -n "primevue" src/components/MaxButton.vue src/types/index.ts` → vazio
- [ ] `MaxBaseButtonProps` declarado e **exportado** em `src/types/index.ts`
- [ ] Classes `p-button-*` **e** atributo `data-p` emitidos
- [ ] `warning` emite `p-button-warn` e `p-button-warning`
- [ ] SCSS de `.p-button` escrito; comparação visual feita no playground
- [ ] 14 asserções passam; mutações testadas
- [ ] `npm run type-check && npm run lint && npm run test` passam
