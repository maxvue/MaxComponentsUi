# Plano de Implementação: Inacessibilidade Semântica e Teclado no Modo Clássico MaxTabItem

## 1. Diagnóstico e Objetivo

### Diagnóstico
1. **[`MaxTabItem.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxTabItem.vue#L1-L22):**
   - Na abordagem clássica de abas (`<MaxTabs><MaxTabItem title="Geral">...</MaxTabItem></MaxTabs>`), o cabeçalho teleportado para a lista de abas é uma `<div>` sem semântica interativa:
     - Não possui `role="tab"`.
     - Não possui `tabindex="0"` (quando ativo) ou `tabindex="-1"` (quando inativo).
     - Não declara `:aria-selected="is_active ? 'true' : 'false'"`.
     - Não possui associação `:aria-controls="panelId"`.
     - Não possui ouvintes de teclado para `Enter` ou `Espaço`.
   - O painel de conteúdo (`.max-tab-item-content`) não possui `role="tabpanel"`, não possui `:aria-labelledby` e não recebe foco de teclado (`tabindex="0"`).
2. **[`MaxTabs.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxTabs.vue#L1-L25):**
   - O contêiner de itens (`.max-tabs-title-items`) não declara `role="tablist"` nem `aria-orientation="horizontal"`.
   - Não há suporte a navegação por setas direcionais horizontais (`ArrowLeft` / `ArrowRight`) para alternar entre as abas.

### Objetivo
- Implementar o padrão completo WAI-ARIA Tabs Pattern no modo clássico `MaxTabs` e `MaxTabItem`.
- Adicionar `role="tablist"` ao contêiner de títulos e `role="tab"` aos itens de abas.
- Associar títulos e painéis via `id`, `aria-controls` e `aria-labelledby`.
- Permitir ativação e foco por teclado via `Tab`, setas horizontais (`ArrowLeft`/`ArrowRight`), `Enter`, `Espaço`, `Home` e `End`.

---

## 2. Arquivos a Modificar

- [`src/components/MaxTabs.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxTabs.vue)
- [`src/components/MaxTabItem.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxTabItem.vue)
- [`tests/unit/MaxTabsClassic.spec.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/tests/unit/MaxTabsClassic.spec.ts)

---

## 3. Especificação Técnica Cirúrgica

### 3.1. `MaxTabs.vue`

#### Alterações no Template
Adicionar `role="tablist"`, orientação e ouvinte de setas no contêiner:
```html
<div class="max-tabs-title-items"
    :id="'max-tab-' + tabs_id"
    role="tablist"
    aria-orientation="horizontal"
    @keydown="onTablistKeydown"
></div>
```

#### Alterações no `<script setup lang="ts">`
Implementar navegação por setas direcionais entre as abas filhas:
```typescript
const onTablistKeydown = (event: KeyboardEvent) => {
    const container = document.getElementById('max-tab-' + tabs_id);
    if (!container) return;

    const tabs = Array.from(container.querySelectorAll<HTMLElement>('[role="tab"]:not([disabled])'));
    if (tabs.length === 0) return;

    const currentIndex = tabs.findIndex(tab => tab === document.activeElement);
    if (currentIndex === -1) return;

    let nextIndex = currentIndex;

    switch (event.key) {
        case 'ArrowRight':
            event.preventDefault();
            nextIndex = (currentIndex + 1) % tabs.length;
            break;
        case 'ArrowLeft':
            event.preventDefault();
            nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
            break;
        case 'Home':
            event.preventDefault();
            nextIndex = 0;
            break;
        case 'End':
            event.preventDefault();
            nextIndex = tabs.length - 1;
            break;
        default:
            return;
    }

    const nextTab = tabs[nextIndex];
    nextTab?.focus();
    if (props.selectOnFocus) {
        nextTab?.click();
    }
};
```

---

### 3.2. `MaxTabItem.vue`

#### Alterações no Template
1. Cabeçalho da aba com `role="tab"` e teclado:
```html
<template>
    <teleport :to="'#max-tab-' + toValue(tabs_info?.tabs_id)" v-if="toValue(tabs_info?.tabs_id) && is_mounted">
        <div
            class="max-tab-item-title"
            :class="{ 'max-tab-active': is_active, 'max-tab-disabled': props.disabled }"
            :active="is_active"
            :disabled="props.disabled || undefined"
            role="tab"
            :id="`tab-${uniqueTabId}`"
            :aria-controls="`tabpanel-${uniqueTabId}`"
            :aria-selected="is_active ? 'true' : 'false'"
            :tabindex="is_active ? 0 : -1"
            @click="onTitleClick"
            @keydown.enter.prevent="onTitleClick"
            @keydown.space.prevent="onTitleClick"
        >
            <max-icon :icon="props.icon ?? props.i" v-if="props.icon || props.i" size="1.2" />
            <slot name="title">{{ props.title }}</slot>
        </div>
    </teleport>

    <!-- Botão de ação opcional preservado -->
    <teleport :to="'#max-tab-buttons-' + toValue(tabs_info?.tabs_id)" v-if="toValue(tabs_info?.tabs_id) && is_mounted && is_active && props.actionButton && (props.actionButtonLabel || props.actionButtonIcon)">
        <div @click="props.actionButton" class="button-tab-item">
            <max-button :label="props.actionButtonLabel" :icon="props.actionButtonIcon" v-if="props.actionButtonLabel" />
            <max-icon-button :icon="props.actionButtonIcon" v-else />
        </div>
    </teleport>

    <!-- Painel de conteúdo acessível -->
    <div
        class="max-tab-item-content"
        v-if="is_active"
        role="tabpanel"
        :id="`tabpanel-${uniqueTabId}`"
        :aria-labelledby="`tab-${uniqueTabId}`"
        tabindex="0"
    >
        <slot></slot>
    </div>
</template>
```

#### Alterações no `<script setup lang="ts">`
Gerar ID único estável para associação ARIA:
```typescript
const uniqueTabId = computed(() => {
    return String(props.value ?? tab_id.value ?? Math.random().toString(36).slice(2, 9));
});
```

#### Alterações no SCSS Scoped
Adicionar `:focus-visible` nos títulos das abas:
```scss
.max-tab-item-title {
    cursor: pointer;
    user-select: none;
    transition: color 0.2s ease, border-color 0.2s ease;

    &:focus-visible {
        outline: 2px solid var(--blue-600, #00768E);
        outline-offset: -2px;
        border-radius: 4px;
    }

    &[disabled] {
        cursor: not-allowed;
        opacity: 0.5;
    }
}

.max-tab-item-content {
    &:focus-visible {
        outline: 2px solid var(--blue-600, #00768E);
        outline-offset: 2px;
        border-radius: 6px;
    }
}
```

---

## 4. Garantia de Retrocompatibilidade

1. **Slots e APIs Mantidos:**
   - As props `title`, `icon`, `value`, `disabled`, `actionButton`, etc., continuam inalteradas.
   - O comportamento do slot `title` e do slot default é 100% preservado.
2. **Estilos e Classes Existentes:**
   - A classe original `.max-tab-item-title` e o atributo `:active="is_active"` são mantidos, garantindo que regras CSS de projetos existentes não sofram quebras visuais.

---

## 5. Critérios de Aceitação e Comandos de Validação

### Critérios de Aceitação
- [ ] O contêiner de abas em `MaxTabs` possui `role="tablist"` e `aria-orientation="horizontal"`.
- [ ] Cada aba em `MaxTabItem` renderiza com `role="tab"`, `:aria-selected` booleano e `tabindex="0"` na aba ativa e `-1` nas inativas.
- [ ] O painel de conteúdo exibe `role="tabpanel"`, `tabindex="0"` e `:aria-labelledby` referenciando o id da aba correspondente.
- [ ] Pressionar as setas `ArrowLeft` e `ArrowRight` no tablist move o foco entre as abas disponíveis.
- [ ] Pressionar `Enter` ou `Espaço` em uma aba inativa a ativa.

### Comandos de Validação
```bash
npm run type-check
npx vitest run tests/unit/MaxTabsClassic.spec.ts
```
