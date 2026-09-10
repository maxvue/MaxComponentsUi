# Plano de Implementação: Impossibilidade de Limpar Seleção e Falta de Navegação por Teclado no Select (`MaxInputSelect`)

## 1. Diagnóstico e Objetivo

O componente [`MaxInputSelect.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputSelect.vue) é amplamente utilizado em filtros e formulários, mas apresenta duas limitações críticas de usabilidade e acessibilidade:
1. **Impossibilidade de Limpar Seleção (`clearable`):** Uma vez selecionada qualquer opção, o componente não oferece botão de limpeza ("X" / `clearable`). Em telas com filtros de pesquisa (ex.: "Status: Ativo", "Categoria: Roupas"), o usuário fica aprisionado à seleção, sendo incapaz de voltar ao estado neutro (`null` / todos) sem recarregar a página.
2. **Ausência de Navegação por Teclado no Menu Aberto:** O listener de teclado no dropdown aberto trata exclusivamente a tecla `Escape`. Teclas canônicas de navegação (`ArrowDown`, `ArrowUp`, `Enter`, `Home`, `End`) são completamente ignoradas. O usuário não consegue percorrer os itens da lista nem confirmar a seleção sem utilizar o mouse, violando o padrão W3C Combobox.

**Objetivo:**
1. Adicionar suporte à prop `clearable?: boolean` (com alias `showClear?: boolean`), exibindo um botão de limpeza rápida quando houver valor selecionado, emitindo o evento `@clear` e resetando o valor para `null`.
2. Implementar navegação completa por teclado na lista de opções abertas (`focusedIndex`), com rolagem automática do item focado para a área visível (`scrollIntoView`), seleção via `Enter`/`Space` e destaque visual de foco (`.is-focused`).

---

## 2. Arquivos a Modificar (com links absolutos)

- [`src/components/MaxInputSelect.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputSelect.vue): inclusão do botão de limpeza, manipulação de `focusedIndex`, listeners de teclado e estilos.
- [`tests/components/MaxInputSelect.test.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/tests/components/MaxInputSelect.test.ts): testes unitários para o botão clear, evento `@clear` e navegação via setas e Enter.

---

## 3. Especificação Técnica Cirúrgica

### 3.1. Props e Lógica de Limpeza e Foco em `MaxInputSelect.vue`

Extensão das props e emits:

```ts
const props = withDefaults(
    defineProps<{
        // ... props já existentes ...
        /** Permite limpar a opção selecionada exibindo um botão 'X' */
        clearable?: boolean;
        /** Alias para clearable */
        showClear?: boolean;
    }>(),
    {
        // ... defaults existentes ...
        clearable: false,
        showClear: false
    }
);

const emit = defineEmits<{
    'update:modelValue': [value: any];
    'change': [value: any];
    'clear': [];
}>();

const isClearable = computed(() => Boolean(props.clearable || props.showClear));

const clearSelection = () => {
    temp_value.value = null;
    emit('update:modelValue', null);
    emit('change', null);
    emit('clear');
};
```

Gerenciamento de foco por teclado:

```ts
const focusedIndex = ref<number>(-1);
const listEl = ref<HTMLElement | null>(null);

const scrollToFocusedItem = () => {
    nextTick(() => {
        if (!overlayEl.value) return;
        const focusedItem = overlayEl.value.querySelector('.p-select-option.is-focused') as HTMLElement;
        if (focusedItem) {
            focusedItem.scrollIntoView({ block: 'nearest' });
        }
    });
};

const onKeydown = (event: KeyboardEvent) => {
    if (!isOpen.value) return;

    if (event.key === 'Escape') {
        hide();
        return;
    }

    const items = filtered_options.value ?? [];
    if (items.length === 0) return;

    if (event.key === 'ArrowDown') {
        event.preventDefault();
        focusedIndex.value = (focusedIndex.value + 1) % items.length;
        scrollToFocusedItem();
    } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        focusedIndex.value = (focusedIndex.value - 1 + items.length) % items.length;
        scrollToFocusedItem();
    } else if (event.key === 'Home') {
        event.preventDefault();
        focusedIndex.value = 0;
        scrollToFocusedItem();
    } else if (event.key === 'End') {
        event.preventDefault();
        focusedIndex.value = items.length - 1;
        scrollToFocusedItem();
    } else if (event.key === 'Enter') {
        if (focusedIndex.value >= 0 && focusedIndex.value < items.length) {
            event.preventDefault();
            selectOption(items[focusedIndex.value]);
        }
    }
};

watch(isOpen, (open) => {
    if (open) {
        // Inicializa o foco na opção selecionada ou no primeiro item
        const items = filtered_options.value ?? [];
        const selectedIdx = items.findIndex((opt: any) => isSelectedOption(opt));
        focusedIndex.value = selectedIdx >= 0 ? selectedIdx : 0;
        scrollToFocusedItem();
    } else {
        focusedIndex.value = -1;
    }
});
```

### 3.2. Template Atualizado do Gatilho e das Opções

Gatilho do Select com botão de limpeza:

```html
<div
    ref="triggerEl"
    class="p-select"
    :class="{ 'p-disabled': props.disabled, 'p-focus': isOpen }"
    tabindex="0"
    role="combobox"
    :aria-expanded="isOpen"
    @click.stop="toggle"
    @keydown.enter.prevent="toggle"
    @keydown.space.prevent="toggle"
    @keydown.down.prevent="toggle"
    @keydown.up.prevent="toggle"
>
    <div class="p-select-label">
        <slot name="value" :value="temp_value">
            <div class="value-div" v-if="hasSelectedOption" :style="{ color: option_selected.color }">
                <MaxIcon
                    :icon="option_selected.icon ?? null"
                    :size="option_selected.icon_size ?? undefined"
                    :style="{ paddingRight: option_selected.icon ? '10px' : '0' }"
                />
                <span class="value-text">{{ option_selected[props.optionName] ?? option_selected.name ?? option_selected.label }}</span>
            </div>
        </slot>
    </div>

    <!-- BOTÃO LIMPAR -->
    <button
        v-if="isClearable && hasSelectedOption && !props.disabled"
        type="button"
        class="p-select-clear-btn"
        aria-label="Limpar seleção"
        @click.stop="clearSelection"
    >
        <MaxIcon icon="lucide:x" size="0.85" />
    </button>

    <div class="p-select-dropdown" aria-hidden="true">
        <MaxIcon icon="lucide:chevron-down" size="1" />
    </div>
</div>
```

Lista de opções com marcação de foco:

```html
<ul class="p-select-list" role="listbox" ref="listEl">
    <li
        v-for="(opt, idx) in filtered_options"
        :key="idx"
        class="p-select-option"
        :class="{
            'is-focused': focusedIndex === idx,
            'is-selected': isSelectedOption(opt)
        }"
        role="option"
        :aria-selected="isSelectedOption(opt)"
        @mouseenter="focusedIndex = idx"
        @click.stop="selectOption(opt)"
    >
        <!-- Slot ou conteúdo padrão do item -->
        <span class="p-select-option-label">{{ opt[props.optionName] ?? opt.name ?? opt.label }}</span>
    </li>
</ul>
```

### 3.3. Estilização SCSS Scoped

```scss
<style lang="scss" scoped>
.select_input_div {
    .p-select {
        display: flex;
        align-items: center;
        width: 100%;
        position: relative;

        .p-select-clear-btn {
            background: transparent;
            border: none;
            padding: 0 4px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--background-500);
            transition: color 0.15s ease, transform 0.15s ease;
            z-index: 1;

            &:hover {
                color: var(--red-500, #ef4444);
                transform: scale(1.1);
            }
        }

        .p-select-dropdown {
            display: flex;
            align-items: center;
            justify-content: center;
            padding-right: 8px;
            color: var(--background-600);
        }
    }
}

.p-select-overlay {
    .p-select-list {
        list-style: none;
        padding: 4px;
        margin: 0;
        max-height: 240px;
        overflow-y: auto;

        .p-select-option {
            padding: 8px 12px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 0.875rem;
            color: var(--background-750);
            display: flex;
            align-items: center;
            transition: background-color 0.12s ease;

            &.is-focused {
                background-color: var(--background-100, #f1f5f9) !important;
                color: var(--primary-600, #2563eb) !important;
            }

            &.is-selected {
                font-weight: 600;
                background-color: var(--primary-50, #eff6ff);
                color: var(--primary-700, #1d4ed8);
            }
        }
    }
}
</style>
```

---

## 4. Garantia de Retrocompatibilidade

- O valor padrão de `clearable` é `false`, preservando o comportamento visual de telas já homologadas que não desejem exibir o botão de limpeza.
- Para habilitar em filtros, basta declarar `:clearable="true"` ou `:show-clear="true"`.
- O método de seleção por clique com o mouse não sofre nenhuma alteração de assinatura ou timing.

---

## 5. Critérios de Aceitação e Comandos de Validação

### 5.1. Critérios de Aceitação
1. Passar `clearable="true"` com um valor selecionado exibe o ícone "X" antes do chevron.
2. Clicar no ícone "X" redefine o valor para `null` e dispara os eventos `@update:modelValue`, `@change` e `@clear`.
3. Com o menu aberto, pressionar `ArrowDown` e `ArrowUp` move a classe `.is-focused` sequencialmente entre os itens da lista.
4. Pressionar `Enter` com um item focado seleciona o valor e fecha o dropdown.

### 5.2. Comandos de Validação
```bash
# Validação de tipagem
npm run type-check

# Testes automatizados do MaxInputSelect
npx vitest run tests/components/MaxInputSelect.test.ts
```
