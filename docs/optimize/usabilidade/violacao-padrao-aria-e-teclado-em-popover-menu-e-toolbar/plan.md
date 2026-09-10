# Plano de Implementação: Violação do Padrão WAI-ARIA Menu e Navegação por Teclado em Popover, UserSection e TopToolbar

## 1. Diagnóstico e Objetivo

### Diagnóstico
1. **[`MaxPopoverMenu.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxPopoverMenu.vue#L1-L38):**
   - O gatilho de abertura do menu é uma `<div class="botao">` que não declara `role="button"`, não possui `tabindex="0"`, nem atributos `aria-haspopup="menu"` e `aria-expanded="isOpen"`.
   - O overlay declara `role="menu"` e itens declaram `role="menuitem"`, porém os itens são `<div>`s sem `tabindex`.
   - O componente não implementa foco automático inicial nem navegação por setas (`ArrowDown`/`ArrowUp`) ou roving tabindex, violando o padrão WAI-ARIA Menu Pattern.
   - O atributo `id="overlay_menu"` é estático no template, gerando duplicação de IDs inválida no DOM quando existem dois ou mais menus na página.
2. **[`MaxUserSection.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxUserSection.vue#L2-L9,L41-L64):**
   - O perfil do usuário no cabeçalho é uma `<div class="max-user-section user-section" @click.stop="toggle">` sem semântica de botão, sem `tabindex="0"` e sem suporte a `Enter`/`Espaço`. Usuários de teclado não conseguem focar nem abrir o menu de usuário.
   - Os itens do menu interno não possuem suporte a navegação por setas.
   - Utiliza ID estático `id="overlay_tmenu"`.
3. **[`MaxTopToolbar.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxTopToolbar.vue#L3-L48):**
   - A barra superior declara `role="menubar"`, mas seus itens não suportam navegação horizontal por setas (`ArrowLeft`/`ArrowRight`).
   - A abertura de submenus depende exclusivamente do evento do mouse `@mouseenter="openSubmenu(index)"`. Usuários de teclado não conseguem abrir os submenus na barra superior.

### Objetivo
- Implementar o padrão WAI-ARIA Menu Pattern completo em `MaxPopoverMenu` e `MaxUserSection`, com gatilhos acessíveis, roving tabindex (`tabindex="0"` no item focado e `-1` nos demais), navegação por setas direcionais (`ArrowDown`/`ArrowUp`), seleção via `Enter`/`Espaço` e fechamento com restauração de foco no `Escape`.
- Garantir IDs dinâmicos únicos para todos os menus.
- Habilitar navegação por setas horizontais e abertura por teclado de submenus em `MaxTopToolbar`.

---

## 2. Arquivos a Modificar

- [`src/components/MaxPopoverMenu.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxPopoverMenu.vue)
- [`src/components/MaxUserSection.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxUserSection.vue)
- [`src/components/MaxTopToolbar.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxTopToolbar.vue)
- [`tests/unit/MaxPopoverMenu.spec.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/tests/unit/MaxPopoverMenu.spec.ts)
- [`tests/unit/MaxUserSection.spec.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/tests/unit/MaxUserSection.spec.ts)
- [`tests/unit/MaxTopToolbar.spec.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/tests/unit/MaxTopToolbar.spec.ts)

---

## 3. Especificação Técnica Cirúrgica

### 3.1. `MaxPopoverMenu.vue`

#### Alterações no Template
1. Gatilho com acessibilidade de botão e controle de menu:
```html
<div
    class="botao"
    ref="triggerButtonRef"
    role="button"
    tabindex="0"
    aria-haspopup="menu"
    :aria-expanded="isOpen"
    :aria-controls="menuId"
    @click.stop="toggle"
    @keydown.enter.prevent="toggle"
    @keydown.space.prevent="toggle"
    @keydown.down.prevent="openAndFocusFirst"
    @keydown.up.prevent="openAndFocusLast"
>
    <slot name="button">
        <MaxButton v-bind="props" :size="props.size ?? props.sizeIcon" class="max-popover-menu-btn" />
    </slot>
</div>
```

2. Overlay do menu com IDs dinâmicos e roving tabindex:
```html
<Teleport to="body" v-if="isOpen">
    <div class="max-popover-menu-backdrop" @click="hide">
        <div
            ref="menuEl"
            :id="menuId"
            class="max-popover-menu-overlay"
            role="menu"
            :style="{ top: position.top + 'px', left: position.left + 'px' }"
            @keydown="onMenuKeydown"
            @click.stop
        >
            <div
                v-for="(item, idx) in resolvedItems"
                :key="idx"
                :ref="(el) => setItemRef(el, idx)"
                role="menuitem"
                class="max-popover-menu-item-wrapper"
                :tabindex="focusedItemIndex === idx ? 0 : -1"
                @click.stop="executeItem(item, $event)"
                @mouseenter="focusedItemIndex = idx"
            >
                <slot name="item" :data="item">
                    <div class="max-popover-menu-item">
                        <MaxIcon :icon="item.icon ?? item.i" v-if="item.icon || item.i" size="1.1" />
                        <div class="max-popover-menu-label">{{ item.label }}</div>
                    </div>
                </slot>
            </div>
        </div>
    </div>
</Teleport>
```

#### Alterações no `<script setup lang="ts">`
```typescript
import { computed, ref, nextTick, onBeforeUnmount } from 'vue';

const menuId = `max-popover-menu-${Math.random().toString(36).slice(2, 9)}`;
const triggerButtonRef = ref<HTMLElement | null>(null);
const focusedItemIndex = ref(0);
const itemRefs = ref<(HTMLElement | null)[]>([]);

const resolvedItems = computed<any[]>(() => {
    return props.items ?? props.model ?? [];
});

const setItemRef = (el: any, index: number) => {
    itemRefs.value[index] = el as HTMLElement | null;
};

const openAndFocusFirst = () => {
    if (!isOpen.value) toggle();
    nextTick(() => {
        focusedItemIndex.value = 0;
        itemRefs.value[0]?.focus();
    });
};

const openAndFocusLast = () => {
    if (!isOpen.value) toggle();
    nextTick(() => {
        const last = resolvedItems.value.length - 1;
        focusedItemIndex.value = last;
        itemRefs.value[last]?.focus();
    });
};

const executeItem = (item: any, event: MouseEvent | KeyboardEvent) => {
    if (item.action) {
        item.action({ event, data: item.data ?? {} });
    } else {
        onClick(event as any, item);
    }
    hide();
    triggerButtonRef.value?.focus();
};

const onMenuKeydown = (event: KeyboardEvent) => {
    const total = resolvedItems.value.length;
    if (total === 0) return;

    switch (event.key) {
        case 'ArrowDown':
            event.preventDefault();
            focusedItemIndex.value = (focusedItemIndex.value + 1) % total;
            itemRefs.value[focusedItemIndex.value]?.focus();
            break;
        case 'ArrowUp':
            event.preventDefault();
            focusedItemIndex.value = (focusedItemIndex.value - 1 + total) % total;
            itemRefs.value[focusedItemIndex.value]?.focus();
            break;
        case 'Home':
            event.preventDefault();
            focusedItemIndex.value = 0;
            itemRefs.value[0]?.focus();
            break;
        case 'End':
            event.preventDefault();
            focusedItemIndex.value = total - 1;
            itemRefs.value[total - 1]?.focus();
            break;
        case 'Enter':
        case ' ':
            event.preventDefault();
            if (resolvedItems.value[focusedItemIndex.value]) {
                executeItem(resolvedItems.value[focusedItemIndex.value], event);
            }
            break;
        case 'Escape':
            event.preventDefault();
            hide();
            triggerButtonRef.value?.focus();
            break;
    }
};
```

#### SCSS Scoped
```scss
.max-popover-menu-item-wrapper {
    outline: none;
    cursor: pointer;

    &:focus-visible {
        outline: 2px solid var(--blue-600, #00768E);
        outline-offset: -2px;
        background-color: var(--background-100, #f1f5f9);
    }
}
```

---

### 3.2. `MaxUserSection.vue`

#### Alterações no Gatilho e Overlay
1. Gatilho do Perfil:
```html
<div
    class="max-user-section user-section"
    :class="{ 'only-avatar': isCompact }"
    :screen="props.screen"
    ref="root_el"
    role="button"
    tabindex="0"
    aria-haspopup="menu"
    :aria-expanded="isOpen"
    :aria-controls="userMenuId"
    aria-label="Perfil do usuário"
    @click.stop="toggle"
    @keydown.enter.prevent="toggle"
    @keydown.space.prevent="toggle"
    @keydown.down.prevent="openUserMenu"
    pointer
>
```

2. Itens do Menu com roving tabindex e setas direcionais:
```html
<div
    ref="menuEl"
    :id="userMenuId"
    class="max-user-section-overlay"
    role="menu"
    :style="{ top: position.top + 'px', left: position.left + 'px' }"
    @keydown="onUserMenuKeydown"
    @click.stop
>
    <template v-for="(item, index) in menuItems" :key="index">
        <hr v-if="item.separator" class="max-user-section-separator" role="separator" />
        <div
            v-else-if="item.label"
            class="main-item-menu-div"
            role="menuitem"
            :tabindex="focusedUserMenuIdx === index ? 0 : -1"
            :ref="(el) => setUserMenuItemRef(el, index)"
            @click="handleItemClick(item)"
        >
            <MaxIcon v-if="item.icon" :icon="item.icon" />
            <div>{{ item.label }}</div>
        </div>
    </template>
</div>
```

---

### 3.3. `MaxTopToolbar.vue`

#### Alterações no Template
Permitir abertura de submenus com teclado:
```html
<li
    v-for="(item, index) in toolbar.items"
    :key="index"
    class="p-menubar-item"
    role="none"
    @mouseenter="openSubmenu(index)"
    @mouseleave="scheduleCloseSubmenu"
    @keydown="onMenubarItemKeydown($event, index, item)"
>
    <div
        class="menu-item-content root"
        role="menuitem"
        tabindex="0"
        :aria-haspopup="item.items && item.items.length ? 'true' : undefined"
        :aria-expanded="activeSubmenu === index"
        @click="handleItemClick(item)"
    >
        <!-- Conteúdo do item -->
    </div>
</li>
```

#### Alterações no `<script setup lang="ts">`
```typescript
const onMenubarItemKeydown = (event: KeyboardEvent, index: number, item: any) => {
    switch (event.key) {
        case 'ArrowDown':
        case 'Enter':
            if (item.items && item.items.length) {
                event.preventDefault();
                openSubmenu(index);
            }
            break;
        case 'Escape':
            if (activeSubmenu.value !== null) {
                event.preventDefault();
                activeSubmenu.value = null;
            }
            break;
    }
};
```

---

## 4. Garantia de Retrocompatibilidade

1. **Slots e APIs Mantidos:**
   - O slot `button` e o slot `item` de `MaxPopoverMenu` mantêm suas assinaturas intactas.
   - O comportamento de clique e hover para usuários com mouse não sofre alteração.
2. **IDs Dinâmicos Seguros:**
   - Evita colisões em páginas com múltiplos popovers sem exigir que o desenvolvedor passe IDs manuais.

---

## 5. Critérios de Aceitação e Comandos de Validação

### Critérios de Aceitação
- [ ] O gatilho de `MaxPopoverMenu` possui `role="button"`, `tabindex="0"` e `aria-haspopup="menu"`.
- [ ] Abrir o menu transfere foco para o primeiro item.
- [ ] Teclas `ArrowDown` e `ArrowUp` circulam o foco entre os itens do menu.
- [ ] Pressionar `Escape` fecha o menu e retorna o foco para o botão de gatilho.
- [ ] `MaxUserSection` é focável por `Tab` e operável com `Enter`/`Espaço`.
- [ ] `MaxTopToolbar` permite abrir submenus pelo teclado com `ArrowDown` ou `Enter`.

### Comandos de Validação
```bash
npm run type-check
npx vitest run tests/unit/MaxPopoverMenu.spec.ts
npx vitest run tests/unit/MaxUserSection.spec.ts
npx vitest run tests/unit/MaxTopToolbar.spec.ts
```
