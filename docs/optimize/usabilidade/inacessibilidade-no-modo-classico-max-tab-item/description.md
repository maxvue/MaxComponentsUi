# Inacessibilidade Semântica e Teclado no Modo Clássico MaxTabItem

## Descrição e Causa Raiz

### Problema
A biblioteca MaxComponentsUi oferece duas abordagens para abas: a abordagem moderna modular (`MaxTab`, `MaxTabList`, `MaxTabPanel`) e a abordagem clássica/legada (`MaxTabs` com filhos diretos `MaxTabItem.vue`).

Ao auditar `MaxTabItem.vue` ([`src/components/MaxTabItem.vue:1-22`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxTabItem.vue#L1-L22)):
```html
<template>
    <teleport :to="'#max-tab-' + toValue(tabs_info?.tabs_id)" v-if="toValue(tabs_info?.tabs_id) && is_mounted">
        <div
            class="max-tab-item-title"
            :active="is_active"
            :disabled="props.disabled || undefined"
            @click="onTitleClick"
        >
            <max-icon :icon="props.icon ?? props.i" v-if="props.icon || props.i" size="1.2" />
            <slot name="title">{{ props.title }}</slot>
        </div>
    </teleport>
    ...
    <div class="max-tab-item-content" v-if="is_active">
        <slot></slot>
    </div>
</template>
```

### Análise de Violações ARIA e Teclado
1. **Ausência Completa de WAI-ARIA Tabs Pattern:**
   - O cabeçalho teleportado é uma `<div>` sem `role="tab"`.
   - Não possui `tabindex="0"` (ou `-1` quando inativo), tornando impossível tabular ou focar na aba por teclado.
   - Não possui `:aria-selected="is_active ? 'true' : 'false'"`.
   - Não possui `:aria-controls` associando o cabeçalho ao conteúdo.
   - O contêiner de conteúdo teleportado (`.max-tab-item-content`) não possui `role="tabpanel"` nem `aria-labelledby`.
2. **Navegação por Teclado Quebrada (WCAG 2.1.1):**
   - Não há suporte às teclas `Enter` e `Espaço` para ativar a aba.
   - Não há suporte a setas direcionais (`ArrowLeft` / `ArrowRight`) para alternar entre as abas.

### Impacto
Aplicações consumidoras que utilizam o padrão clássico `<MaxTabs><MaxTabItem title="Dados Gerais">...</MaxTabItem></MaxTabs>` tornam suas interfaces 100% inacessíveis para usuários cegos e usuários que operam sistemas sem mouse.

## Localização no Código
- [`src/components/MaxTabItem.vue:1-22, 48-56`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxTabItem.vue#L1-L22)
- [`src/components/MaxTabs.vue:1-32`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxTabs.vue#L1-L32)

## Proposta de Solução
1. Atualizar o elemento de título em `MaxTabItem.vue`:
   ```html
   <div
       class="max-tab-item-title"
       :class="{ 'max-tab-active': is_active, 'max-tab-disabled': props.disabled }"
       role="tab"
       :id="`tab-${tab_id}`"
       :aria-controls="`tabpanel-${tab_id}`"
       :aria-selected="is_active ? 'true' : 'false'"
       :tabindex="is_active ? 0 : -1"
       @click="onTitleClick"
       @keydown.enter.prevent="onTitleClick"
       @keydown.space.prevent="onTitleClick"
   >
   ```
2. Adicionar no contêiner do painel:
   ```html
   <div
       class="max-tab-item-content"
       v-if="is_active"
       role="tabpanel"
       :id="`tabpanel-${tab_id}`"
       :aria-labelledby="`tab-${tab_id}`"
       tabindex="0"
   >
       <slot></slot>
   </div>
   ```
3. Suportar navegação por setas direcionais na lista de títulos em `MaxTabs.vue`.
