# Plano 18 — `MaxUserAvatar` (substitui `primevue/avatar`)

| | |
|---|---|
| **id** | 18 |
| **Arquivo** | `src/components/MaxUserAvatar.vue` |
| **Primitiva eliminada** | `Avatar` |
| **Depende de** | — |
| **Teste existente** | `tests/components/MaxUserAvatar.test.ts` |

---

## 1. O `Avatar` do PrimeVue

| Prop | Tipo | Default | Efeito |
|---|---|---|---|
| `label` | `string` | — | iniciais (texto) |
| `icon` | `string` | — | classe de ícone |
| `image` | `string` | — | URL da imagem |
| `size` | `'normal'\|'large'\|'xlarge'` | `'normal'` | `p-avatar-lg`/`-xl` |
| `shape` | `'square'\|'circle'` | `'square'` | `p-avatar-circle` |

### Markup por modo

```html
<!-- label -->
<div class="p-avatar p-component"><span class="p-avatar-text">JS</span></div>

<!-- image -->
<div class="p-avatar p-component p-avatar-image"><img src="..." alt="" /></div>

<!-- icon -->
<div class="p-avatar p-component"><span class="p-avatar-icon ..."></span></div>
```

Precedência: `image` > `icon` > `label` > slot `default`.

Evento: `error` (falha ao carregar a imagem) — importante, porque um avatar com URL
quebrada deve cair para as iniciais em vez de exibir ícone de imagem partida.

---

## 2. Implementação

```vue
<template>
    <div :class="avatarClass" :style="avatarStyle">
        <img v-if="props.image && !imageFailed" :src="props.image" :alt="props.alt ?? ''" @error="onImageError" />
        <MaxIcon v-else-if="props.icon" :icon="props.icon" class="p-avatar-icon" />
        <span v-else-if="props.label" class="p-avatar-text">{{ initials }}</span>
        <slot v-else />
    </div>
</template>
```

```ts
const imageFailed = ref(false);
const onImageError = (event: Event) => {
    imageFailed.value = true;      // fallback automático para iniciais
    emit('error', event);
};

const avatarClass = computed(() => ({
    'p-avatar': true,
    'p-component': true,
    'p-avatar-image': !!props.image && !imageFailed.value,
    'p-avatar-circle': props.shape === 'circle',
    'p-avatar-lg': props.size === 'large',
    'p-avatar-xl': props.size === 'xlarge'
}));
```

### Preserve o que é do Max

`MaxUserAvatar` provavelmente já deriva iniciais de um nome de usuário e/ou gera uma cor
de fundo determinística a partir do nome. **Leia o arquivo e preserve integralmente**
essa lógica — ela é a razão de existir do componente.

### Acessibilidade

- imagem: `alt` significativo (nome do usuário), não `alt=""`, salvo se for decorativo
  ao lado do nome escrito;
- modo iniciais: `role="img"` + `aria-label` com o nome completo — senão o leitor de
  tela anuncia só "JS";
- avatar puramente decorativo: `aria-hidden="true"`.

### Estilo

`.p-avatar`: `display: inline-flex`, `align-items/justify-content: center`,
`width`/`height` (32px normal, 48px lg, 64px xl), `border-radius` (0 square / 50%
circle), `background`, `font-size` proporcional. `img` com
`width: 100%; height: 100%; object-fit: cover`.

---

## 3. Teste

1. modo `label` renderiza `.p-avatar-text` com as iniciais;
2. modo `image` renderiza `<img>` com o `src`;
3. modo `icon` renderiza o ícone;
4. precedência image > icon > label;
5. `shape="circle"` → `p-avatar-circle`;
6. cada `size` gera a classe;
7. **erro na imagem cai para iniciais** e emite `error`;
8. derivação de iniciais a partir do nome (a lógica própria do Max);
9. `role="img"` + `aria-label` no modo iniciais;
10. slot default quando nada mais é informado.

---

## 4. Checklist

- [ ] Sem PrimeVue
- [ ] Lógica de iniciais/cor do Max preservada
- [ ] Fallback de imagem quebrada funciona (teste 7)
- [ ] ARIA correto
- [ ] `type-check`, `lint`, `test` OK
