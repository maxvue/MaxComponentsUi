# Plano 30 — `MaxPopoverMenu` (substitui `primevue/menu`)

| | |
|---|---|
| **id** | 30 |
| **Arquivo** | `src/components/MaxPopoverMenu.vue` |
| **Primitiva eliminada** | `Menu` |
| **Depende de** | 2 (`MaxBaseOverlay`) |
| **Teste existente** | `tests/components/MaxPopoverMenu.test.ts` |

> **Antes de tudo:** `src/components/MaxPopover.vue` **já é PrimeVue-free**. Leia-o. É
> bem possível que o `MaxPopoverMenu` possa ser reescrito compondo `MaxPopover` + uma
> lista de itens, sem tocar no `MaxBaseOverlay`. Avalie e registre a decisão em `notas`.

---

## 1. O `Menu` do PrimeVue 4

| Prop | Tipo | Default | Efeito |
|---|---|---|---|
| `model` | `MenuItem[]` | — | itens do menu |
| `popup` | `boolean` | `false` | modo flutuante (vs. inline) |
| `appendTo` | `string \| element` | `'body'` | destino |
| `autoZIndex` / `baseZIndex` | | | empilhamento |

### Estrutura de `MenuItem`

```ts
interface MenuItem {
    label?: string;
    icon?: string;
    command?: (event: { originalEvent: Event; item: MenuItem }) => void;
    url?: string;
    to?: string | object;          // rota do vue-router
    items?: MenuItem[];            // submenu
    disabled?: boolean;
    visible?: boolean;
    separator?: boolean;
    class?: string;
    style?: any;
    key?: string;
}
```

> **`visible` e `disabled` podem ser funções ou booleanos** no PrimeVue. Verifique como o
> `MaxPopoverMenu` os usa e preserve.

### Métodos expostos (API imperativa — provavelmente usada)

```ts
menuRef.value.toggle(event)
menuRef.value.show(event)
menuRef.value.hide()
```

⚠️ Se o `MaxPopoverMenu` (ou apps consumidoras) chamam `toggle(event)` via `ref`, esses
métodos **precisam continuar existindo** via `defineExpose`. Isso é API pública fácil de
esquecer, porque não aparece no template.

```bash
grep -rn "\.toggle(\|\.show(\|\.hide(" src/ playground/
```

### Slots
`item` (`{ item, props }`), `start`, `end`, `submenuheader`, `itemicon`.

### Markup

```html
<div class="p-menu p-component">
    <ul class="p-menu-list" role="menu">
        <li class="p-menu-item" role="menuitem">
            <a class="p-menu-item-link"><span class="p-menu-item-icon" /><span class="p-menu-item-label" /></a>
        </li>
        <li class="p-menu-separator" role="separator"></li>
    </ul>
</div>
```

---

## 2. Implementação

```vue
<template>
    <MaxBaseOverlay v-model:visible="visible" :target="targetEl" :dismissable="true">
        <div class="p-menu p-component">
            <slot name="start" />
            <ul class="p-menu-list" role="menu" :aria-label="props.ariaLabel">
                <template v-for="(item, i) in visibleItems" :key="item.key ?? i">
                    <li v-if="item.separator" class="p-menu-separator" role="separator"></li>
                    <li
                        v-else
                        class="p-menu-item"
                        role="menuitem"
                        :class="{ 'p-disabled': isDisabled(item) }"
                        :aria-disabled="isDisabled(item) || undefined"
                        :tabindex="i === activeIndex ? 0 : -1"
                        @click="onItemClick(item, $event)"
                        @keydown="onItemKeydown(item, $event, i)"
                    >
                        <slot name="item" :item="item">
                            <component :is="item.to ? RouterLink : 'a'" :to="item.to" :href="item.url" class="p-menu-item-link">
                                <MaxIcon v-if="item.icon" :icon="item.icon" class="p-menu-item-icon" />
                                <span class="p-menu-item-label">{{ item.label }}</span>
                            </component>
                        </slot>
                    </li>
                </template>
            </ul>
            <slot name="end" />
        </div>
    </MaxBaseOverlay>
</template>
```

### `command`, `url` e `to`

```ts
const onItemClick = (item: MenuItem, event: MouseEvent) => {
    if (isDisabled(item)) { event.preventDefault(); return; }
    if (item.command) item.command({ originalEvent: event, item });
    if (!item.url && !item.to) hide();      // links navegam; comandos fecham o menu
};
```

### API imperativa

```ts
defineExpose({
    toggle: (event?: Event) => { targetEl.value = (event?.currentTarget as HTMLElement) ?? targetEl.value; visible.value = !visible.value; },
    show:   (event?: Event) => { targetEl.value = (event?.currentTarget as HTMLElement) ?? targetEl.value; visible.value = true; },
    hide:   () => { visible.value = false; }
});
```

### Teclado (obrigatório em menus)

`↑`/`↓` movem entre itens (pulando separadores e desabilitados), `Home`/`End` vão ao
primeiro/último, `Enter`/`Space` ativam, `Escape` fecha e devolve o foco ao gatilho.
Ao abrir, o foco vai para o primeiro item habilitado.

### ARIA

`role="menu"` na lista, `role="menuitem"` nos itens, `role="separator"` nos separadores,
`aria-disabled` nos desabilitados, roving tabindex. O gatilho precisa de
`aria-haspopup="menu"` e `aria-expanded`.

---

## 3. Teste

1. renderiza os itens de `model`;
2. `separator: true` renderiza `role="separator"`;
3. `visible: false` (bool **e** função) oculta o item;
4. `disabled` (bool **e** função) desabilita e impede o clique;
5. clicar num item chama `command` com `{ originalEvent, item }`;
6. clicar num item com `command` fecha o menu;
7. item com `url`/`to` renderiza link e **não** fecha antes de navegar;
8. **`toggle()`, `show()`, `hide()` expostos e funcionais**;
9. slot `#item` recebe `{ item }`;
10. slots `#start` e `#end` renderizam;
11. teclado: `↓` move (pulando desabilitado e separador), `Enter` ativa, `Escape` fecha;
12. `role="menu"`/`menuitem` presentes;
13. clique fora fecha.

---

## 4. Checklist

- [ ] Decisão `MaxPopover` vs. `MaxBaseOverlay` registrada em `notas`
- [ ] Sem PrimeVue
- [ ] `toggle`/`show`/`hide` expostos (teste 8) — API imperativa preservada
- [ ] `visible`/`disabled` aceitam booleano **e** função
- [ ] Teclado completo com roving tabindex
- [ ] ARIA de menu completo
- [ ] `type-check`, `lint`, `test` OK
