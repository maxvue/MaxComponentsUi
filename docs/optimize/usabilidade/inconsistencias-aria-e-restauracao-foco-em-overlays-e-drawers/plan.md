# Plano de Implementação: Inconsistências de WAI-ARIA, Rótulo Acessível e Focus Trap em MaxDrawer e Overlays

## 1. Diagnóstico e Objetivo

### Diagnóstico
1. **[`MaxDrawer.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxDrawer.vue#L12-L19):**
   - **Conflito Semântico WAI-ARIA:** O elemento do painel declara `role="complementary"` juntamente com `aria-modal="true"`. Segundo a especificação W3C WAI-ARIA 1.2/1.3, o atributo `aria-modal="true"` é válido estritamente em elementos com `role="dialog"` ou `role="alertdialog"`. Utilizá-lo em um landmark complementar quebra a interpretação de leitores de tela modernos.
   - **Ausência de Nome Acessível (WCAG 4.1.2):** O painel do drawer não referencia o título via `aria-labelledby`, nem possui `aria-label`. O leitor de tela anuncia um contêiner anônimo.
2. **[`useFocusTrap.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/helpers/useFocusTrap.ts#L48-L54):**
   - Ao ativar o trap de foco (`activate`), a função busca elementos focáveis via `focusable()`. Se o conteúdo do drawer for puramente informativo ou textual sem botões/inputs imediatos, `items[0]` é `undefined`.
   - Como o contêiner do drawer não possui `tabindex="-1"`, o foco permanece no `document.body` por trás da máscara de bloqueio, permitindo que a navegação por teclado e leitores de tela escapem do diálogo modal.
3. **[`MaxInputIconPicker.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputIconPicker.vue#L22-L35):**
   - A gaveta inferior do seletor de ícones é renderizada via `<Teleport>` direto sem `role="dialog"`, sem `aria-modal="true"`, sem fechamento com a tecla `Escape` e com botão de fechar sem `aria-label`.

### Objetivo
- Corrigir a semântica de `MaxDrawer.vue` para `role="dialog"` quando modal (ou parametrizável), vinculando o cabeçalho via `aria-labelledby`.
- Aperfeiçoar o helper `useFocusTrap.ts` para direcionar o foco para o próprio contêiner modal caso nenhum elemento interativo interno esteja disponível.
- Ajustar a gaveta do `MaxInputIconPicker.vue` para semântica modal completa com fechamento por `Escape`, foco automático na pesquisa e rótulo no botão fechar.

---

## 2. Arquivos a Modificar

- [`src/components/MaxDrawer.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxDrawer.vue)
- [`src/helpers/useFocusTrap.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/helpers/useFocusTrap.ts)
- [`src/components/MaxInputIconPicker.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputIconPicker.vue)
- [`tests/unit/MaxDrawerAria.spec.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/tests/unit/MaxDrawerAria.spec.ts)
- [`tests/unit/useFocusTrap.spec.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/tests/unit/useFocusTrap.spec.ts)

---

## 3. Especificação Técnica Cirúrgica

### 3.1. `MaxDrawer.vue`

#### Alterações no Template
Ajustar papel, modalidade, identificador de cabeçalho e `tabindex="-1"` no contêiner:
```html
<template>
    <teleport to="body">
        <transition name="max-drawer-fade" @after-leave="emit('after-hide')">
            <div
                v-if="props.visible"
                class="max-drawer-mask"
                :class="{ 'max-drawer-mask-modal': props.modal }"
                :style="{ zIndex: z_index }"
                @click.self="onMaskClick"
            >
                <slot name="container" :close-callback="close">
                    <div
                        ref="panel_el"
                        class="max-drawer"
                        :class="[`max-drawer-${props.position}`, { 'max-drawer-no-padding': props.noPadding }, $attrs.class]"
                        :role="props.modal ? 'dialog' : 'complementary'"
                        :aria-modal="props.modal ? 'true' : undefined"
                        :aria-labelledby="hasHeader ? headerId : undefined"
                        :aria-label="!hasHeader && props.ariaLabel ? props.ariaLabel : undefined"
                        tabindex="-1"
                        @keydown="onPanelKeydown"
                    >
                        <div v-if="hasHeader || props.showCloseIcon" class="max-drawer-header">
                            <slot name="header">
                                <span :id="headerId" class="max-drawer-title">{{ props.header }}</span>
                            </slot>
                            <button
                                v-if="props.showCloseIcon"
                                type="button"
                                aria-label="Fechar gaveta"
                                v-bind="close_button_attrs"
                                :class="['max-drawer-close', props.closeButtonProps?.class]"
                                @click="close"
                            >
                                <slot name="closeicon">
                                    <MaxIcon :i="props.closeIcon ?? 'iconoir:xmark'" size="1.3" />
                                </slot>
                            </button>
                        </div>
                        <div class="max-drawer-content">
                            <slot></slot>
                        </div>
                        <div v-if="$slots.footer" class="max-drawer-footer">
                            <slot name="footer"></slot>
                        </div>
                    </div>
                </slot>
            </div>
        </transition>
    </teleport>
</template>
```

#### Alterações no `<script setup lang="ts">`
```typescript
const instanceId = `max-drawer-${Math.random().toString(36).slice(2, 9)}`;
const headerId = `${instanceId}-header`;

const hasHeader = computed(() => Boolean(props.header || slots.header));

const onPanelKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && props.closeOnEscape !== false) {
        event.preventDefault();
        close();
        return;
    }
    trap.onKeydown(event);
};
```

#### SCSS Scoped
Remover qualquer contorno indesejado gerado pelo `tabindex="-1"` programático ao focar o container:
```scss
.max-drawer {
    outline: none;

    &:focus-visible {
        outline: 2px solid var(--blue-600, #00768E);
        outline-offset: -2px;
    }
}
```

---

### 3.2. `useFocusTrap.ts`

#### Alteração no Método `activate()`
Adicionar fallback para focar o próprio elemento contêiner quando não houver itens internos:
```typescript
const activate = () => {
    previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    nextTick(() => {
        const items = focusable();
        if (items.length > 0) {
            items[0]?.focus();
        } else if (el.value) {
            if (!el.value.hasAttribute('tabindex')) {
                el.value.setAttribute('tabindex', '-1');
            }
            el.value.focus();
        }
    });
};
```

---

### 3.3. `MaxInputIconPicker.vue`

#### Alterações na Gaveta de Ícones
Adicionar atributos de diálogo acessível, foco automático no input de pesquisa e ouvinte de Escape:
```html
<Teleport to="body" v-if="visible">
    <div class="max-icon-picker-drawer-backdrop" @click="closeDrawer">
        <div
            class="max-icon-picker-drawer p-drawer-bottom"
            role="dialog"
            aria-modal="true"
            :aria-labelledby="drawerTitleId"
            tabindex="-1"
            @keydown.esc.prevent="closeDrawer"
            @click.stop
        >
            <div class="p-drawer-header">
                <span :id="drawerTitleId" class="p-drawer-title">Escolha um ícone</span>
                <button
                    type="button"
                    class="p-drawer-close-button"
                    aria-label="Fechar seletor de ícones"
                    @click="closeDrawer"
                >
                    <MaxIcon i="mdi:close" size="1.2" />
                </button>
            </div>
            <!-- Restante do conteúdo -->
        </div>
    </div>
</Teleport>
```

#### Alterações no `<script setup lang="ts">`
```typescript
const drawerTitleId = `icon-picker-title-${Math.random().toString(36).slice(2, 9)}`;
const searchInputRef = ref<HTMLInputElement | null>(null);

const closeDrawer = () => {
    visible.value = false;
};

watch(visible, (val) => {
    if (val) {
        nextTick(() => {
            searchInputRef.value?.focus();
        });
    }
});
```

---

## 4. Garantia de Retrocompatibilidade

1. **Modo Modal e Não-Modal Preservados:**
   - A prop `modal` de `MaxDrawer` continua definindo se há máscara ou não (`default: true`). Quando `modal: true`, usa `role="dialog"` e `aria-modal="true"`; quando falso, recai para `role="complementary"`.
2. **Propriedades Opcionais:**
   - A prop `ariaLabel?: string` é opcional e não quebra contratos existentes.

---

## 5. Critérios de Aceitação e Comandos de Validação

### Critérios de Aceitação
- [ ] `MaxDrawer` modal possui `role="dialog"` e `aria-modal="true"`.
- [ ] O título de `MaxDrawer` é vinculado ao painel via `aria-labelledby`.
- [ ] Gaveta ou modal aberto sem elementos interativos transfere foco para o contêiner com `tabindex="-1"` em vez de manter foco solto no `document.body`.
- [ ] A gaveta de `MaxInputIconPicker` possui `role="dialog"`, `aria-modal="true"` e fecha ao teclar `Escape`.

### Comandos de Validação
```bash
npm run type-check
npx vitest run tests/unit/MaxDrawerAria.spec.ts
npx vitest run tests/unit/useFocusTrap.spec.ts
```
