# Plano 17 — `MaxBadgeComponent` (substitui `Badge` + `OverlayBadge`)

| | |
|---|---|
| **id** | 17 |
| **Arquivo** | `src/components/MaxBadgeComponent.vue` |
| **Primitivas eliminadas** | `Badge`, `OverlayBadge` |
| **Depende de** | — |
| **Teste existente** | `tests/components/MaxBadgeComponent.test.ts` |

---

## 1. `Badge` do PrimeVue

Um `<span>` com classes. Zero comportamento.

| Prop | Tipo | Default | Efeito |
|---|---|---|---|
| `value` | `string \| number` | — | conteúdo |
| `severity` | `'secondary'\|'success'\|'info'\|'warn'\|'danger'\|'contrast'` | — | `p-badge-{severity}` |
| `size` | `'small'\|'large'\|'xlarge'` | — | `p-badge-sm`/`-lg`/`-xl` |

```html
<span class="p-badge p-component">5</span>
```

Classe extra `p-badge-dot` quando não há `value` (bolinha sem número);
`p-badge-circle` quando o valor tem 1 caractere.

## 2. `OverlayBadge` do PrimeVue

Envolve um filho e sobrepõe um `Badge` no canto superior direito.

```html
<div class="p-overlaybadge">
    <slot />                      <!-- o elemento decorado -->
    <span class="p-badge ...">5</span>
</div>
```

Aceita as mesmas props do `Badge` e as repassa.

---

## 3. Implementação

Leia o arquivo atual antes: confirme **quando** ele usa `Badge` e quando usa
`OverlayBadge` (provavelmente `OverlayBadge` quando há slot, `Badge` quando não há).

```vue
<template>
    <!-- modo overlay: badge sobre um filho -->
    <div class="p-overlaybadge max-badge-overlay" v-if="$slots.default">
        <slot />
        <span :class="badgeClass" v-bind="badgeAria">{{ displayValue }}</span>
    </div>

    <!-- modo simples -->
    <span :class="badgeClass" v-bind="badgeAria" v-else>{{ displayValue }}</span>
</template>
```

```ts
const hasValue = computed(() => props.value !== null && props.value !== undefined && props.value !== '');

const displayValue = computed(() => {
    if (!hasValue.value) return '';
    const n = Number(props.value);
    if (!Number.isNaN(n) && props.max && n > props.max) return `${props.max}+`;
    return String(props.value);
});

const badgeClass = computed(() => ({
    'p-badge': true,
    'p-component': true,
    'p-badge-dot': !hasValue.value,
    'p-badge-circle': displayValue.value.length === 1,
    [`p-badge-${props.severity}`]: !!props.severity,
    'p-badge-sm': props.size === 'small',
    'p-badge-lg': props.size === 'large',
    'p-badge-xl': props.size === 'xlarge'
}));

// acessibilidade: um contador que muda deve ser anunciado
const badgeAria = computed(() => hasValue.value
    ? { role: 'status', 'aria-label': `${displayValue.value} ${props.ariaSuffix ?? ''}`.trim() }
    : { 'aria-hidden': 'true' });
```

> **Preserve qualquer prop própria** que o `MaxBadgeComponent` já tenha (como um `max`
> para truncar em "99+", ou cores customizadas). Leia o arquivo e mantenha tudo.

### Estilo

SCSS para `.p-badge`: `display: inline-flex`, `min-width`, `height`, `border-radius:
10rem`, `font-size`, `font-weight`, `padding`, `background` e `color` por severidade
via variáveis do tema Max. Para `.p-overlaybadge`: `position: relative` no wrapper e
`position: absolute; top: 0; right: 0; transform: translate(50%, -50%)` no badge.

---

## 4. Teste — ampliar o existente

1. modo simples renderiza `<span class="p-badge">`;
2. com slot, renderiza `.p-overlaybadge` contendo o filho **e** o badge;
3. `value` aparece no conteúdo;
4. sem `value` → `p-badge-dot` e sem texto;
5. valor de 1 caractere → `p-badge-circle`;
6. cada `severity` gera a classe correta;
7. cada `size` gera a classe correta;
8. `max` trunca (ex.: `value: 150, max: 99` → `"99+"`);
9. badge com valor tem `role="status"`; badge dot tem `aria-hidden`.

---

## 5. Checklist

- [ ] Sem referências a PrimeVue
- [ ] Props próprias preservadas
- [ ] Classes `p-badge*` e `p-overlaybadge` emitidas
- [ ] ARIA correto nos dois modos
- [ ] Testes passam; mutação testada
- [ ] `type-check`, `lint`, `test` OK
