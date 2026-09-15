<template>
    <div
        ref="parentRef"
        class="max-base-virtual-scroller"
        :class="{ 'is-disabled': props.disabled }"
        :role="effectiveRole"
        :aria-label="effectiveAriaLabel"
        :aria-labelledby="effectiveAriaLabelledby"
        :aria-activedescendant="effectiveActivedescendant"
        :tabindex="effectiveTabindex"
        :aria-disabled="props.disabled ? 'true' : undefined"
        :aria-multiselectable="effectiveRole === 'listbox' && props.multiple ? 'true' : undefined"
        :style="style"
        @scroll="onScroll"
        @keydown="onKeydown"
    >
        <div :style="{ height: `${virtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }">
            <div
                v-for="virtualRow in virtualizer.getVirtualItems()"
                :id="getItemDomId(virtualRow.index)"
                :key="String(virtualRow.key)"
                :role="effectiveItemRole"
                :aria-setsize="isPositionalRole ? items.length : undefined"
                :aria-posinset="isPositionalRole ? virtualRow.index + 1 : undefined"
                :aria-selected="effectiveItemRole === 'option' ? isSelected(virtualRow.index) : undefined"
                :aria-disabled="isItemDisabled(virtualRow.index) ? 'true' : undefined"
                :class="[
                    'max-base-virtual-scroller-item',
                    {
                        'is-focused': isItemFocused(virtualRow.index),
                        'is-selected': isSelected(virtualRow.index),
                        'is-disabled': isItemDisabled(virtualRow.index)
                    }
                ]"
                :style="{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`
                }"
                @click="onItemClick(virtualRow.index)"
            >
                <slot
                    name="item"
                    :item="items[virtualRow.index]"
                    :options="{
                        index: virtualRow.index,
                        count: items.length,
                        first: virtualRow.index === 0,
                        last: virtualRow.index === items.length - 1,
                        even: virtualRow.index % 2 === 0,
                        odd: virtualRow.index % 2 !== 0,
                        selected: isSelected(virtualRow.index),
                        focused: isItemFocused(virtualRow.index),
                        disabled: isItemDisabled(virtualRow.index)
                    }"
                    :aria-props="{
                        role: effectiveItemRole,
                        id: getItemDomId(virtualRow.index),
                        'aria-setsize': isPositionalRole ? items.length : undefined,
                        'aria-posinset': isPositionalRole ? virtualRow.index + 1 : undefined,
                        'aria-selected': effectiveItemRole === 'option' ? isSelected(virtualRow.index) : undefined,
                        'aria-disabled': isItemDisabled(virtualRow.index) ? 'true' : undefined
                    }"
                />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { ref, computed, watch, onMounted, useId } from 'vue';
    import { useVirtualizer } from '@tanstack/vue-virtual';
    import type {
        VirtualScrollerRole,
        VirtualScrollerItemRole,
        VirtualScrollerSelectPayload
    } from '../../types/listbox';

    const props = withDefaults(
        defineProps<{
            /** coleção completa a virtualizar */
            items?: any[];
            /** altura estimada de cada item, em px */
            itemSize?: number;
            /** estilo aplicado ao container com scroll (ex.: height) */
            style?: Record<string, string> | string;
            /** itens extras renderizados fora da viewport */
            numToleratedItems?: number;
            /** papel ARIA do container com scroll (opcional; padrão neutro sem role) */
            role?: VirtualScrollerRole | string;
            /** papel ARIA atribuído a cada linha/item (opcional; ex: 'option', 'listitem') */
            itemRole?: VirtualScrollerItemRole | string;
            /** rótulo acessível via aria-label */
            ariaLabel?: string;
            /** ID do elemento que rotula este container via aria-labelledby */
            ariaLabelledby?: string;
            /** ID do item atualmente ativo para foco virtual */
            ariaActivedescendant?: string;
            /** Índice do item com foco ativo */
            focusedIndex?: number;
            /** Valor selecionado para controle via v-model */
            modelValue?: any;
            /** Habilita seleção de múltiplos itens */
            multiple?: boolean;
            /** Desabilita o componente */
            disabled?: boolean;
            /** Tabindex explícito do elemento container */
            tabindex?: number | string;
            /** Prefixo para os IDs determinísticos dos itens montados */
            idPrefix?: string;
            /** Extrai o valor do item para comparação com modelValue */
            getItemValue?: (item: any, index: number) => any;
            /** Extrai o ID DOM determinístico de um item */
            getItemId?: (index: number, item: any) => string;
            /** Função para indicar se um item específico está desabilitado */
            isItemDisabled?: (item: any, index: number) => boolean;
            /** Função customizada para checar se um item está selecionado */
            isSelected?: (item: any, index: number) => boolean;
            /** Seleciona automaticamente o item ao navegar pelo teclado */
            selectOnFocus?: boolean;
        }>(),
        {
            items: () => [],
            itemSize: 40,
            style: undefined,
            numToleratedItems: 5,
            role: undefined,
            itemRole: undefined,
            ariaLabel: undefined,
            ariaLabelledby: undefined,
            ariaActivedescendant: undefined,
            focusedIndex: undefined,
            modelValue: undefined,
            multiple: false,
            disabled: false,
            tabindex: undefined,
            idPrefix: undefined,
            getItemValue: undefined,
            getItemId: undefined,
            isItemDisabled: undefined,
            isSelected: undefined,
            selectOnFocus: false
        }
    );

    const emit = defineEmits<{
        scroll: [event: Event];
        'scroll-index-change': [payload: { first: number; last: number }];
        'update:modelValue': [value: any];
        'update:focusedIndex': [index: number];
        select: [payload: VirtualScrollerSelectPayload];
    }>();

    const parentRef = ref<HTMLElement | null>(null);
    const autoId = useId();
    const baseId = computed(() => props.idPrefix || `max-vs-${autoId}`);

    // Blindagem de papéis ARIA: impede combinações conflitantes e mantém padrão neutro
    const effectiveRole = computed<string | undefined>(() => {
        if (!props.role) return undefined;
        if (props.role === 'listbox') return 'listbox';
        if (props.role === 'list') return 'list';
        return props.role;
    });

    const effectiveItemRole = computed<string | undefined>(() => {
        // Em listbox, filhos interativos DEVEM ter papel option
        if (effectiveRole.value === 'listbox') return 'option';
        // Em list, filhos DEVEM ser listitem
        if (effectiveRole.value === 'list') return 'listitem';
        // Quando container não tem role (ou é neutro):
        if (props.itemRole === 'listitem') return 'listitem';

        // Impede 'option' solto sem container listbox
        return undefined;
    });

    const isPositionalRole = computed(() => effectiveItemRole.value === 'option' || effectiveItemRole.value === 'listitem');

    const effectiveAriaLabel = computed(() => props.ariaLabel || undefined);
    const effectiveAriaLabelledby = computed(() => props.ariaLabelledby || undefined);

    const effectiveTabindex = computed<number | undefined>(() => {
        if (props.disabled) return -1;
        if (props.tabindex !== undefined) return Number(props.tabindex);
        if (effectiveRole.value === 'listbox') return 0;
        return undefined;
    });

    const getItemDomId = (index: number): string => {
        if (props.getItemId) return props.getItemId(index, props.items[index]);
        return `${baseId.value}-option-${index}`;
    };

    const isItemDisabled = (index: number): boolean => {
        if (props.disabled) return true;
        const item = props.items[index];
        if (props.isItemDisabled) return props.isItemDisabled(item, index);
        return Boolean(item && typeof item === 'object' && item.disabled);
    };

    const getItemVal = (index: number): any => {
        const item = props.items[index];
        if (props.getItemValue) return props.getItemValue(item, index);
        if (item && typeof item === 'object' && 'value' in item) return item.value;
        return item;
    };

    const isSelected = (index: number): boolean => {
        const item = props.items[index];
        if (props.isSelected) return props.isSelected(item, index);
        if (props.modelValue === undefined || props.modelValue === null) return false;
        const val = getItemVal(index);
        if (props.multiple || Array.isArray(props.modelValue)) return Array.isArray(props.modelValue) && (props.modelValue.includes(val) || props.modelValue.includes(item));

        return props.modelValue === val || props.modelValue === item;
    };

    // Gerenciamento de foco interno/controlado
    const internalFocusedIndex = ref<number>(props.focusedIndex ?? -1);

    watch(
        () => props.focusedIndex,
        (newVal) => {
            if (newVal !== undefined) internalFocusedIndex.value = newVal;
        }
    );

    const activeIndex = computed(() => (props.focusedIndex !== undefined ? props.focusedIndex : internalFocusedIndex.value));
    const isItemFocused = (index: number) => activeIndex.value === index;

    const virtualizer = useVirtualizer(
        computed(() => ({
            count: props.items.length,
            getScrollElement: () => parentRef.value,
            estimateSize: () => props.itemSize,
            overscan: props.numToleratedItems
        }))
    );

    // Validação estrita e reativa de aria-activedescendant: APENAS nós atualmente montados no DOM
    const effectiveActivedescendant = computed<string | undefined>(() => {
        if (!parentRef.value) return undefined;

        // Se uma prop explícita foi fornecida
        if (props.ariaActivedescendant) {
            const el = parentRef.value.querySelector(`#${CSS.escape(props.ariaActivedescendant)}`);
            return el ? props.ariaActivedescendant : undefined;
        }

        // Se for modo listbox com item ativo
        if (effectiveRole.value === 'listbox' && activeIndex.value >= 0 && activeIndex.value < props.items.length) {
            const virtualItems = virtualizer.value.getVirtualItems();
            const isMounted = virtualItems.some((v) => v.index === activeIndex.value);
            if (!isMounted) return undefined;

            return getItemDomId(activeIndex.value);
        }

        return undefined;
    });

    const onScroll = (event: Event) => {
        emit('scroll', event);
        const range = virtualizer.value.range;
        if (range) emit('scroll-index-change', { first: range.startIndex, last: range.endIndex });
    };

    onMounted(() => {
        if (effectiveRole.value === 'listbox' && !effectiveAriaLabel.value && !effectiveAriaLabelledby.value) console.warn('[MaxBaseVirtualScroller] O papel "listbox" exige um nome acessível via aria-label ou aria-labelledby.');
    });

    // Navegação por teclado para Listbox
    const findNextEnabledIndex = (start: number, step: number): number => {
        let cur = start + step;
        while (cur >= 0 && cur < props.items.length) {
            if (!isItemDisabled(cur)) return cur;
            cur += step;
        }
        return start;
    };

    const findFirstEnabledIndex = (): number => {
        for (let i = 0; i < props.items.length; i++) if (!isItemDisabled(i)) return i;

        return -1;
    };

    const findLastEnabledIndex = (): number => {
        for (let i = props.items.length - 1; i >= 0; i--) if (!isItemDisabled(i)) return i;

        return -1;
    };

    const focusItem = (index: number) => {
        if (index < 0 || index >= props.items.length) return;
        internalFocusedIndex.value = index;
        emit('update:focusedIndex', index);
        virtualizer.value.scrollToIndex(index);

        if (props.selectOnFocus && !isItemDisabled(index)) toggleSelection(index);
    };

    const toggleSelection = (index: number) => {
        if (index < 0 || index >= props.items.length || isItemDisabled(index)) return;
        const val = getItemVal(index);
        const item = props.items[index];

        if (props.multiple) {
            const currentSelected = Array.isArray(props.modelValue) ? [...props.modelValue] : [];
            const pos = currentSelected.indexOf(val);
            if (pos >= 0) currentSelected.splice(pos, 1);
            else currentSelected.push(val);

            emit('update:modelValue', currentSelected);
            emit('select', { index, item, value: currentSelected });
        } else {
            emit('update:modelValue', val);
            emit('select', { index, item, value: val });
        }
    };

    const onKeydown = (event: KeyboardEvent) => {
        if (effectiveRole.value !== 'listbox' || props.disabled || props.items.length === 0) return;

        switch (event.key) {
            case 'ArrowDown': {
                event.preventDefault();
                const next = activeIndex.value < 0 ? findFirstEnabledIndex() : findNextEnabledIndex(activeIndex.value, 1);
                if (next !== -1) focusItem(next);
                break;
            }
            case 'ArrowUp': {
                event.preventDefault();
                const prev = activeIndex.value < 0 ? findLastEnabledIndex() : findNextEnabledIndex(activeIndex.value, -1);
                if (prev !== -1) focusItem(prev);
                break;
            }
            case 'Home': {
                event.preventDefault();
                const first = findFirstEnabledIndex();
                if (first !== -1) focusItem(first);
                break;
            }
            case 'End': {
                event.preventDefault();
                const last = findLastEnabledIndex();
                if (last !== -1) focusItem(last);
                break;
            }
            case 'PageDown': {
                event.preventDefault();
                const renderedCount = virtualizer.value.getVirtualItems().length || 10;
                const step = Math.max(1, renderedCount - 1);
                const target = Math.min(props.items.length - 1, (activeIndex.value < 0 ? 0 : activeIndex.value) + step);
                const resolved = isItemDisabled(target) ? findNextEnabledIndex(target, 1) : target;
                if (resolved !== -1) focusItem(resolved);
                break;
            }
            case 'PageUp': {
                event.preventDefault();
                const renderedCount = virtualizer.value.getVirtualItems().length || 10;
                const step = Math.max(1, renderedCount - 1);
                const target = Math.max(0, (activeIndex.value < 0 ? 0 : activeIndex.value) - step);
                const resolved = isItemDisabled(target) ? findNextEnabledIndex(target, -1) : target;
                if (resolved !== -1) focusItem(resolved);
                break;
            }
            case ' ':
            case 'Enter': {
                event.preventDefault();
                if (activeIndex.value >= 0 && activeIndex.value < props.items.length) toggleSelection(activeIndex.value);

                break;
            }
        }
    };

    const onItemClick = (index: number) => {
        if (props.disabled || isItemDisabled(index)) return;
        if (effectiveRole.value === 'listbox') {
            focusItem(index);
            toggleSelection(index);
        }
    };

    defineExpose({
        scrollToIndex: (i: number, options?: any) => virtualizer.value.scrollToIndex(i, options),
        focus: () => parentRef.value?.focus(),
        focusedIndex: computed(() => activeIndex.value),
        selectIndex: (i: number) => toggleSelection(i)
    });
</script>

<style lang="scss" scoped>
    .max-base-virtual-scroller {
        overflow: auto;

        &:focus-visible {
            outline: var(--max-focus-outline, 2px solid var(--max-primary-500, #00768e));
            outline-offset: -2px;
        }

        &.is-disabled {
            opacity: 0.6;
            cursor: not-allowed;
            pointer-events: none;
        }
    }

    .max-base-virtual-scroller-item {
        box-sizing: border-box;

        &.is-disabled {
            cursor: not-allowed;
            opacity: 0.5;
        }
    }
</style>
