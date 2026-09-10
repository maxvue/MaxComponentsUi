# Plano de Implementação: Ausência de Navegação por Setas e Seleção por Teclado em Selects

## 1. Diagnóstico e Objetivo

### Diagnóstico
1. **[`MaxInputSelect.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputSelect.vue#L7-L19) e [`MaxTagSelect.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxTagSelect.vue#L7-L19):**
   - O gatilho do combobox associa tanto `ArrowDown` quanto `ArrowUp` diretamente a `@keydown.down.prevent="toggle"` e `@keydown.up.prevent="toggle"`.
   - Quando a lista está aberta, ao pressionar `ArrowDown` na tentativa de navegar para o próximo item, o método `toggle()` é chamado e **o dropdown se fecha imediatamente** na cara do usuário.
   - Não há implementação de índice destacado (`highlightedIndex`), impossibilitando a navegação entre opções via teclado.
   - O gatilho declara `role="combobox"`, mas não possui `aria-haspopup="listbox"`, `aria-controls` apontando para o ID da lista aberta, nem `aria-activedescendant` para refletir o item sob foco virtual (WCAG 2.1.1 e WAI-ARIA Combobox Pattern).
   - O padrão da prop `listHeight` é de apenas `27px` ([`MaxInputSelect.vue:216`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputSelect.vue#L216)), gerando alvos de toque muito pequenos em dispositivos móveis (violação WCAG 2.5.8 - Target Size).

### Objetivo
- Implementar o padrão completo de Combobox WAI-ARIA com navegação vertical por setas (`ArrowDown`/`ArrowUp`), confirmação via `Enter` e cancelamento com `Escape`.
- Manter o foco no gatilho ou no input de filtro enquanto sincroniza a opção ativa via `aria-activedescendant`.
- Realizar scroll suave automático para garantir que o item destacado esteja visível na lista.
- Ajustar a altura padrão dos itens para garantir usabilidade em telas móveis e desktop (`min-height: 36px`).

---

## 2. Arquivos a Modificar

- [`src/components/MaxInputSelect.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputSelect.vue)
- [`src/components/MaxTagSelect.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxTagSelect.vue)
- [`tests/unit/MaxInputSelect.spec.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/tests/unit/MaxInputSelect.spec.ts)
- [`tests/unit/MaxTagSelect.spec.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/tests/unit/MaxTagSelect.spec.ts)

---

## 3. Especificação Técnica Cirúrgica

### 3.1. `MaxInputSelect.vue`

#### Alterações no Template
1. No gatilho `role="combobox"`:
```html
<div
    ref="triggerEl"
    class="p-select"
    :class="{ 'p-disabled': props.disabled, 'p-focus': isOpen }"
    tabindex="0"
    role="combobox"
    aria-haspopup="listbox"
    :aria-expanded="isOpen"
    :aria-controls="listboxId"
    :aria-activedescendant="activeDescendantId"
    @click.stop="toggle"
    @keydown="onTriggerKeydown"
>
```

2. No overlay de opções `role="listbox"`:
```html
<div
    ref="overlayEl"
    :id="listboxId"
    class="p-select-overlay"
    role="listbox"
    tabindex="-1"
    :style="{ top: position.top + 'px', left: position.left + 'px', width: position.width }"
    @click.stop
>
    <!-- Filtro opcional com captura de setas -->
    <div v-if="props.filter" class="p-select-header">
        <div class="p-select-filter-container">
            <input
                ref="filterInputEl"
                type="text"
                class="p-select-filter"
                v-model="searchQuery"
                placeholder="Pesquisar..."
                role="searchbox"
                aria-autocomplete="list"
                :aria-controls="listboxId"
                :aria-activedescendant="activeDescendantId"
                @keydown="onFilterKeydown"
                @click.stop
            />
        </div>
    </div>

    <!-- Célula de opção com id dinâmico e classe de destaque -->
    <div
        v-for="(option, index) in flatSelectableOptions"
        :key="index"
        :id="`${listboxId}-opt-${index}`"
        :ref="(el) => setOptionRef(el, index)"
        class="p-select-option"
        :class="{
            'p-select-option-selected': isOptionSelected(option),
            'p-select-option-highlighted': highlightedIndex === index
        }"
        :style="{ minHeight: itemHeight }"
        role="option"
        :aria-selected="isOptionSelected(option) ? 'true' : 'false'"
        @click.stop="selectOption(option)"
        @mouseenter="highlightedIndex = index"
    >
        <!-- Conteúdo do slot option -->
    </div>
</div>
```

#### Alterações no `<script setup lang="ts">`
```typescript
import { ref, computed, watch, nextTick, onBeforeUnmount } from 'vue';

const listboxId = `max-select-listbox-${Math.random().toString(36).slice(2, 9)}`;
const highlightedIndex = ref(-1);
const optionRefs = ref<(HTMLElement | null)[]>([]);

const setOptionRef = (el: any, index: number) => {
    optionRefs.value[index] = el as HTMLElement | null;
};

// Lista plana contendo todas as opções selecionáveis (inclusive desdobradas de grupos)
const flatSelectableOptions = computed<any[]>(() => {
    const raw = filteredOptions.value;
    if (props.groupOptions !== undefined) {
        const flat: any[] = [];
        for (const grp of raw as any[]) {
            if (grp?.items && Array.isArray(grp.items)) {
                flat.push(...grp.items);
            }
        }
        return flat;
    }
    return (raw as any[]) || [];
});

const activeDescendantId = computed(() => {
    if (!isOpen.value || highlightedIndex.value < 0) return undefined;
    return `${listboxId}-opt-${highlightedIndex.value}`;
});

const isOptionSelected = (opt: any): boolean => {
    return opt?.[props.optionValue] === temp_value.value;
};

const scrollHighlightedIntoView = () => {
    nextTick(() => {
        const el = optionRefs.value[highlightedIndex.value];
        el?.scrollIntoView({ block: 'nearest' });
    });
};

const onTriggerKeydown = (event: KeyboardEvent) => {
    if (props.disabled) return;

    switch (event.key) {
        case 'ArrowDown':
            event.preventDefault();
            if (!isOpen.value) {
                toggle();
            } else {
                navigateOptions(1);
            }
            break;
        case 'ArrowUp':
            event.preventDefault();
            if (!isOpen.value) {
                toggle();
            } else {
                navigateOptions(-1);
            }
            break;
        case 'Enter':
        case ' ':
            event.preventDefault();
            if (!isOpen.value) {
                toggle();
            } else if (highlightedIndex.value >= 0 && flatSelectableOptions.value[highlightedIndex.value]) {
                selectOption(flatSelectableOptions.value[highlightedIndex.value]);
            }
            break;
        case 'Escape':
            if (isOpen.value) {
                event.preventDefault();
                hide();
                triggerEl.value?.focus();
            }
            break;
    }
};

const onFilterKeydown = (event: KeyboardEvent) => {
    switch (event.key) {
        case 'ArrowDown':
            event.preventDefault();
            navigateOptions(1);
            break;
        case 'ArrowUp':
            event.preventDefault();
            navigateOptions(-1);
            break;
        case 'Enter':
            event.preventDefault();
            if (highlightedIndex.value >= 0 && flatSelectableOptions.value[highlightedIndex.value]) {
                selectOption(flatSelectableOptions.value[highlightedIndex.value]);
                triggerEl.value?.focus();
            }
            break;
        case 'Escape':
            event.preventDefault();
            hide();
            triggerEl.value?.focus();
            break;
    }
};

const navigateOptions = (step: number) => {
    const total = flatSelectableOptions.value.length;
    if (total === 0) return;

    let next = highlightedIndex.value + step;
    if (next < 0) next = total - 1;
    if (next >= total) next = 0;

    highlightedIndex.value = next;
    scrollHighlightedIntoView();
};

watch(isOpen, (open) => {
    if (open) {
        optionRefs.value = [];
        const initialIdx = flatSelectableOptions.value.findIndex(opt => isOptionSelected(opt));
        highlightedIndex.value = initialIdx >= 0 ? initialIdx : 0;
        scrollHighlightedIntoView();
    } else {
        highlightedIndex.value = -1;
    }
});
```

#### Atualização de Estilos SCSS Scoped
```scss
.p-select-option {
    display: flex;
    align-items: center;
    cursor: pointer;
    min-height: 36px;
    padding: 6px 12px;
    transition: background-color 0.15s ease;

    &.p-select-option-highlighted,
    &:hover {
        background-color: var(--background-100, #f1f5f9);
        color: var(--blue-700, #005F77);
    }

    &.p-select-option-selected {
        font-weight: 600;
        background-color: var(--blue-50, #e0f2fe);
    }
}
```

---

### 3.2. `MaxTagSelect.vue`
Aplicar a mesma lógica de desvinculação do `toggle()` em `ArrowDown`/`ArrowUp`, introduzindo `highlightedIndex`, `activeDescendantId`, captura de `Enter` e `Escape`.

---

## 4. Garantia de Retrocompatibilidade

1. **Props Preservadas com Default Seguro:**
   - A prop `listHeight` continua sendo suportada. Se não for especificada, o estilo `min-height: 36px` garante ergonomia tátil sem deformar layouts já fixados por consumidores que passam `listHeight="25px"`.
2. **Seleção via Mouse Idêntica:**
   - Usuários de mouse continuam clicando normalmente nos itens. O evento `@mouseenter` sincroniza `highlightedIndex` sem conflito.

---

## 5. Critérios de Aceitação e Comandos de Validação

### Critérios de Aceitação
- [ ] Com dropdown fechado, pressionar `ArrowDown` ou `ArrowUp` abre a lista e destaca a primeira opção (ou a opção atualmente selecionada).
- [ ] Com dropdown aberto, pressionar `ArrowDown` e `ArrowUp` move o destaque visual e o valor de `aria-activedescendant` sem fechar o dropdown.
- [ ] Pressionar `Enter` com uma opção destacada efetua a seleção do item e fecha o dropdown.
- [ ] Pressionar `Escape` fecha o dropdown e retorna o foco ao gatilho combobox.
- [ ] Itens possuem altura mínima de 36px para toque móvel seguro.

### Comandos de Validação
```bash
npm run type-check
npx vitest run tests/unit/MaxInputSelect.spec.ts
npx vitest run tests/unit/MaxTagSelect.spec.ts
```
