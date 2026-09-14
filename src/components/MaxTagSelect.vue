<template>
    <InputBase
        v-bind="{ ...props, ...attrs }"
        class="max-tag-select max-select-tag"
        :class="{ 'is-button-mode': props.isButton }"
        input-click-auto
        no-dropdown
        :no-icon="props.isButton || (attrs as any)?.noIcon"
        :no-status="props.isButton || (attrs as any)?.noStatus"
    >
        <template #default="{ inputAttrs }">
            <div v-if="showPlaceholder" class="tab-placeholder-select">
                {{ placeholderText }}
            </div>

            <div class="max-select-wrapper">
                <div
                    ref="triggerEl"
                    v-bind="inputAttrs"
                    class="max-select"
                    :class="{ 'is-disabled': props.disabled, 'is-focused': isOpen }"
                    :tabindex="props.disabled || props.isButton ? -1 : 0"
                    :role="props.isButton ? undefined : 'combobox'"
                    :aria-haspopup="props.isButton ? undefined : 'listbox'"
                    :aria-expanded="props.isButton ? undefined : isOpen"
                    :aria-controls="props.isButton ? undefined : (isOpen ? listboxId : undefined)"
                    :aria-activedescendant="props.isButton ? undefined : activeDescendantId"
                    :aria-disabled="props.disabled ? 'true' : undefined"
                    @click.stop="toggle"
                    @keydown="onTriggerKeydown"
                >
                    <div class="max-select-label">
                        <slot name="value">
                            <div
                                class="value-tag-div"
                                :style="getStyleColor(option_selected, false, true)"
                                :color-string="getColorString(option_selected)"
                                v-if="!isButton && hasSelected"
                            >
                                <MaxIcon
                                    :icon="option_selected?.icon ?? null"
                                    :size="option_selected?.icon_size ?? 1.4"
                                    v-if="option_selected.icon"
                                    :color="getStyleColor(option_selected, false, true).color"
                                />
                                <div
                                    class="tag-value-text"
                                    :style="{ color: getStyleColor(option_selected, false, true).color }"
                                >
                                    {{ option_selected?.[props.optionName] ?? option_selected?.name ?? option_selected?.label }}
                                </div>
                            </div>
                            <div v-else-if="isButton">
                                <MaxIconButton :icon="props.i ?? props.icon ?? props.iconLeft" :size="option_selected?.icon_size ?? 1.8" />
                            </div>
                        </slot>
                    </div>
                </div>

                <button
                    v-if="hasClear && hasSelected && !props.disabled"
                    type="button"
                    class="max-select-clear-btn"
                    aria-label="Limpar seleção"
                    @click.stop="clearSelection"
                >
                    <MaxIcon icon="lucide:x" size="0.85" />
                </button>

                <div v-if="$slots['btn-right']" class="max-tag-select-btn-right">
                    <slot name="btn-right"></slot>
                </div>
            </div>

            <Teleport to="body" v-if="isOpen">
                <div
                    ref="overlayEl"
                    :id="listboxId"
                    class="max-select-overlay"
                    role="listbox"
                    tabindex="-1"
                    :style="{ top: position.top + 'px', left: position.left + 'px', width: position.width }"
                    @click.stop
                >
                    <div v-if="props.filter" class="max-select-header">
                        <div class="max-select-filter-container">
                            <input
                                ref="filterInputEl"
                                type="text"
                                class="max-select-filter"
                                v-model="searchQuery"
                                placeholder="Pesquisar..."
                                role="searchbox"
                                aria-autocomplete="list"
                                :aria-controls="listboxId"
                                :aria-activedescendant="activeDescendantId"
                                autofocus
                                @keydown="onFilterKeydown"
                                @click.stop
                            />
                        </div>
                    </div>

                    <div ref="listContainerEl" class="max-select-list-container" @scroll="onContainerScroll">
                        <div v-if="loading" class="max-select-empty-message">
                            Carregando...
                        </div>
                        <template v-else-if="hasOptions">
                            <div v-if="isVirtual" class="max-select-spacer" :style="{ height: `${totalHeight}px` }" aria-hidden="true" />
                            <div
                                class="max-select-list"
                                :class="{ 'is-virtual': isVirtual }"
                                :style="isVirtual ? { transform: `translateY(${offsetY}px)` } : undefined"
                            >
                                <template v-for="entry in visibleItems" :key="entry.item.key">
                                    <div v-if="entry.item.type === 'group'" class="max-select-option-group-wrapper">
                                        <slot name="optiongroup" :option="entry.item.group">
                                            <div class="label_div max-select-option-group">
                                                <div class="labelz">
                                                    <div>{{ entry.item.label }}</div>
                                                </div>
                                            </div>
                                        </slot>
                                    </div>
                                    <div
                                        v-else
                                        :id="`${listboxId}-opt-${entry.item.selectableIndex}`"
                                        class="max-select-option"
                                        :class="{
                                            'max-select-option-selected is-selected': isOptionSelected(entry.item.option),
                                            'max-select-option-highlighted is-focused': highlightedIndex === entry.item.selectableIndex
                                        }"
                                        :style="{ height: `${numericItemHeight}px` }"
                                        role="option"
                                        :aria-selected="isOptionSelected(entry.item.option)"
                                        @click.stop="selectOption(entry.item.option)"
                                        @mouseenter="highlightedIndex = entry.item.selectableIndex"
                                    >
                                        <slot name="option" :option="entry.item.option" :selected="isOptionSelected(entry.item.option)" :index="entry.item.optionIndex">
                                            <div
                                                class="label-tag-div"
                                                :style="getStyleColor(entry.item.option, highlightedIndex === entry.item.selectableIndex, false)"
                                            >
                                                <MaxIcon
                                                    :icon="entry.item.option['icon']"
                                                    v-if="entry.item.option['icon']"
                                                    :size="entry.item.option?.['iconSize'] ?? '1'"
                                                    :style="{ width: '30px' }"
                                                    :color="getStyleColor(entry.item.option, false, false).color"
                                                />
                                                <div class="label-tag">
                                                    <div style="display: grid; white-space: nowrap;" v-text="entry.item.option[props.optionLabel] ?? entry.item.option.label" :style="{ color: attrs.color }"></div>
                                                </div>
                                                <div class="sub-label-tag" v-text="entry.item.option?.sub_label ?? entry.item.option?.sub ?? entry.item.option?.subLabel"></div>
                                                <img v-if="entry.item.option['img']" :src="`/media/images/${entry.item.option['img']}`" alt="Image" class="img-label" />
                                            </div>
                                        </slot>
                                    </div>
                                </template>
                            </div>
                        </template>
                        <div v-else class="max-select-empty-message">
                            {{ attrs.emptyMessage ?? 'Nenhum registro encontrado' }}
                        </div>
                    </div>
                </div>
            </Teleport>
        </template>
    </InputBase>
</template>

<script setup lang="ts">
    /**
     * Componente de seleção (dropdown).
     * Suporta opções simples, agrupadas e carregamento dinâmico via callback.
     */
    import { ref, computed, watch, useAttrs, onBeforeUnmount, nextTick, type Ref } from 'vue';
    import InputBase from './InputBase.vue';
    import { SelectGroupOptions } from '../types';
    import { getColorFromVar, contrastColor, isBlank, watchDebounced } from '@maxvue/max-use';
    import { useActiveOverlayPosition } from '../composables/useActiveOverlayPosition';
    import { getOverlayWidth, getOverlayLeft } from '../helpers/useOverlayWidth';
    import { useVirtualList } from '../composables/useVirtualList';
    import MaxIcon from './MaxIcon.vue';
    import MaxIconButton from './MaxIconButton.vue';

    const attrs: any = useAttrs();

    const props = withDefaults(
        defineProps<{
            /** Texto de placeholder do campo */
            placeholder?: string | undefined;
            /** Valor selecionado */
            modelValue: any;
            /** Função assíncrona para carregar opções ao abrir o select */
            loadOptions?: () => Promise<any[]>;
            /** Ícone principal (ex: 'mdi:user') */
            icon?: string | undefined;
            /** Flag que informa o campo do valor */
            optionValue?: string;
            /** Flag que informa o campo do label */
            optionLabel?: string;
            /** Flag que informa o campo do name */
            optionName?: string;
            /** Ícone posicionado à esquerda */
            iconLeft?: string | undefined;
            /** Ícone posicionado à direita */
            iconRight?: string | undefined;
            /** Alias para o ícone principal */
            i?: string | undefined;
            /** Ícone escuro comparado ao fundo */
            iconDark?: boolean | undefined | number | string;
            /** Ícone claro comparado ao fundo */
            iconLight?: boolean | undefined | number | string;
            /** Estado de conclusão/validação */
            done?: boolean | undefined;
            /** Mensagem ou estado de erro */
            error?: string | null | boolean | undefined;
            /** Mensagem ou estado de atenção */
            caution?: string | null | boolean | undefined;
            /** Indica se o campo é obrigatório */
            required?: boolean | undefined;
            /** Oculta a área de mensagem */
            noMessage?: boolean;
            /** Ícone da mensagem de feedback */
            iconMessage?: string | undefined;
            /** Default Value */
            default?: string | number | boolean | null | undefined;
            /** Lista de opções simples [{ name, value, icon, sub_label }] */
            options?: any[];
            /** Lista de opções agrupadas [{ label, items: [] }] */
            groupOptions?: SelectGroupOptions;
            disabled?: boolean | undefined;
            filter?: boolean | undefined;
            hasRemove?: boolean | undefined;
            isButton?: boolean | undefined;
            backgroundColor?: string;
            /** Altura dos itens da lista em px (padrão: 36) */
            itemHeight?: number | string | undefined;
            /** Força ou desativa a virtualização da lista */
            virtualScroll?: boolean | undefined;
            /** Limiar para ativação automática do virtual scroll (padrão: 500) */
            virtualScrollThreshold?: number | undefined;
            /** Tolerância de itens renderizados fora da viewport (overscan) */
            numToleratedItems?: number | undefined;
        }>(),
        {
            modelValue: null,
            done: undefined,
            optionValue: 'value',
            optionName: 'name',
            filter: false,
            optionLabel: 'label',
            error: undefined,
            caution: undefined,
            required: false,
            placeholder: undefined,
            default: undefined,
            disabled: false,
            isButton: false,
            backgroundColor: 'var(--background-500)',
            itemHeight: 36,
            virtualScroll: undefined,
            virtualScrollThreshold: 500,
            numToleratedItems: 5
        }
    );

    const getColorString = (item: any) => {
        if (!item) return 'unset';
        return item.background_color ?? item.backgroundColor ?? item.tag_color ?? item.tagColor ?? item['tag-color'] ?? item['background-color'] ?? 'unset';
    };

    const styleColorCache = new Map<string, any>();

    const getStyleColor = (item: any, hover: boolean = false, is_value: boolean = false) => {
        const color_string = getColorString(item);
        const cacheKey = `${color_string}_${hover}_${is_value}_${props.backgroundColor}`;
        const cached = styleColorCache.get(cacheKey);
        if (cached) return cached;

        const default_color = is_value ? props.backgroundColor : 'var(--background-500)';

        const color = getColorFromVar(color_string === 'unset' ? default_color : color_string);

        let background = hover ? color.darken(0.2).hexa() : color.hexa();
        let text = contrastColor(background);
        if (color_string === 'unset' && !is_value) {
            background = hover ? 'rgba(0,0,0, 0.1)' : 'transparent';
            text = hover ? 'var(--background-775)' : 'var(--background-700)';
        }

        const style = {
            backgroundColor: background,
            color: text,
            borderRadius: '6px',
            padding: is_value ? '0 8px 0 6px !important' : '0 10px 0 6px !important',
            gap: is_value ? '4px' : 0
        };
        styleColorCache.set(cacheKey, style);
        return style;
    };

    const emit = defineEmits<{
        'update:modelValue': [value: any];
        'change': [value: any];
        'clear': [];
        'before-show': [event?: Event];
    }>();

    const temp_value = ref<any>(props.modelValue);
    let skipNextUpdateModelValue = false;

    const listboxId = `max-tag-select-listbox-${Math.random().toString(36).slice(2, 9)}`;
    const highlightedIndex = ref<number>(-1);
    const listContainerEl = ref<HTMLElement | null>(null);

    const hasClear = computed(() => Boolean((attrs as any)?.clearable || (attrs as any)?.isClearable || (attrs as any)?.showClear || props.hasRemove));

    const clearSelection = () => {
        temp_value.value = null;
        emit('update:modelValue', null);
        emit('change', null);
        emit('clear');
    };

    watch(temp_value, (val) => {
        if (skipNextUpdateModelValue) {
            skipNextUpdateModelValue = false;
            return;
        }
        emit('update:modelValue', val);
    });
    watch(() => props.modelValue, (val) => (temp_value.value = val));
    watch(() => props.disabled, (disabled) => {
        if (disabled) hide();
    });

    const isOpen = ref(false);
    const loading = ref(false);
    const optionsField: Ref<any[]> = ref([]);
    const searchQuery = ref('');

    const triggerEl = ref<HTMLElement | null>(null);
    const overlayEl = ref<HTMLElement | null>(null);
    const filterInputEl = ref<HTMLInputElement | null>(null);

    const { position } = useActiveOverlayPosition({
        target: triggerEl,
        overlay: overlayEl,
        active: isOpen,
        compute: (ctx) => {
            const { targetRect, overlayRect, viewportWidth, viewportHeight } = ctx;
            const targetX = targetRect.left;
            const targetY = targetRect.top;
            const targetH = targetRect.height;
            const overlayH = overlayRect.height || 200;

            const width = getOverlayWidth({ triggerWidth: targetRect.width, windowWidth: viewportWidth, minWidth: 140 });
            let top = targetY + targetH + 2;

            if (top + overlayH > viewportHeight && targetY - overlayH > 0) top = targetY - overlayH - 2;


            return {
                top,
                left: getOverlayLeft(targetX, width, viewportWidth),
                width: width + 'px'
            };
        }
    });

    const options = computed(() => {
        const list = (optionsField.value && optionsField.value.length > 0) ? optionsField.value : (props.options ?? props.groupOptions ?? []);
        list?.map((option: any) => (option.hover ??= false));
        return list;
    });

    const option_selected = computed(() => {
        const valueKey = props.optionValue;

        if (props.options) return props.options.find((opt: any) => opt[valueKey] === temp_value.value) ?? {};

        const groups = Object.values(options.value) as any[];
        for (const group of groups) {
            if (!group || !Array.isArray(group.items)) {
                if (group?.[valueKey] === temp_value.value) return group;
                continue;
            }
            const found = group.items.find((opt: any) => opt[valueKey] === temp_value.value);
            if (found) return found;
        }
        return {};
    });

    const hasSelected = computed(() => Boolean(option_selected.value && Object.keys(option_selected.value).length > 0));

    const placeholderText = computed(() => (props.placeholder !== undefined ? props.placeholder : attrs.placeholder));

    const showPlaceholder = computed(() => placeholderText.value !== undefined && !hasSelected.value);

    const filteredOptions = computed(() => {
        const raw = options.value;
        if (!props.filter || !searchQuery.value.trim()) return raw;

        const q = searchQuery.value.toLowerCase().trim();
        const labelKey = props.optionLabel;

        if (props.groupOptions !== undefined) return (raw as any[])
            .map((group) => {
                if (!group || !Array.isArray(group.items)) return group;
                const items = group.items.filter((item: any) => {
                    const txt = String(item[labelKey] ?? item.label ?? item.name ?? '').toLowerCase();
                    const sub = String(item.sub_label ?? item.sub ?? item.subLabel ?? '').toLowerCase();
                    return txt.includes(q) || sub.includes(q);
                });
                return items.length > 0 ? { ...group, items } : null;
            })
            .filter(Boolean);

        return (raw as any[]).filter((opt: any) => {
            const txt = String(opt[labelKey] ?? opt.label ?? opt.name ?? '').toLowerCase();
            const sub = String(opt.sub_label ?? opt.sub ?? opt.subLabel ?? '').toLowerCase();
            return txt.includes(q) || sub.includes(q);
        });
    });

    type FlatTagEntry =
        | { type: 'group'; label: string; group: any; key: string }
        | { type: 'option'; option: any; selectableIndex: number; key: string; groupIndex: number; optionIndex: number };

    const flattenedItems = computed<FlatTagEntry[]>(() => {
        const raw = filteredOptions.value;
        if (props.groupOptions !== undefined) {
            const result: FlatTagEntry[] = [];
            let selectableCount = 0;
            const groups = (raw as any[]) || [];
            for (let gIdx = 0; gIdx < groups.length; gIdx++) {
                const grp = groups[gIdx];
                result.push({
                    type: 'group',
                    label: grp?.label ?? '',
                    group: grp,
                    key: `g-${gIdx}-${grp?.label ?? ''}`
                });
                const items = grp?.items && Array.isArray(grp.items) ? grp.items : [];
                for (let oIdx = 0; oIdx < items.length; oIdx++) {
                    const opt = items[oIdx];
                    result.push({
                        type: 'option',
                        option: opt,
                        selectableIndex: selectableCount++,
                        key: `tag-opt-${gIdx}-${oIdx}-${opt?.[props.optionValue] ?? oIdx}`,
                        groupIndex: gIdx,
                        optionIndex: oIdx
                    });
                }
            }
            return result;
        }

        const options = (raw as any[]) || [];
        return options.map((opt, idx) => ({
            type: 'option' as const,
            option: opt,
            selectableIndex: idx,
            key: `tag-opt-${idx}-${opt?.[props.optionValue] ?? idx}`,
            groupIndex: 0,
            optionIndex: idx
        }));
    });

    const flatSelectableOptions = computed<any[]>(() => {
        if (props.groupOptions !== undefined) return flattenedItems.value
            .filter((e): e is Extract<FlatTagEntry, { type: 'option' }> => e.type === 'option')
            .map((e) => e.option);

        return (filteredOptions.value as any[]) || [];
    });

    const hasOptions = computed(() => {
        if (props.groupOptions !== undefined) return filteredOptions.value.some((g: any) => g?.items?.length > 0);
        return filteredOptions.value.length > 0;
    });

    const numericItemHeight = computed(() => {
        if (typeof props.itemHeight === 'number') return props.itemHeight;
        if (typeof props.itemHeight === 'string') {
            const p = parseFloat(props.itemHeight);
            return isNaN(p) ? 36 : p;
        }
        return 36;
    });

    const isVirtual = computed(() => {
        if (props.virtualScroll !== undefined) return Boolean(props.virtualScroll);
        return flattenedItems.value.length > (props.virtualScrollThreshold ?? 500);
    });

    const {
        visibleItems,
        offsetY,
        totalHeight,
        setViewport,
        scrollToIndex
    } = useVirtualList(flattenedItems, {
        itemHeight: numericItemHeight,
        enabled: isVirtual,
        overscan: props.numToleratedItems ?? 5
    });

    const onContainerScroll = (e: Event) => {
        const el = e.target as HTMLElement;
        if (el) setViewport(el.scrollTop, el.clientHeight);
    };

    const activeDescendantId = computed(() => {
        if (!isOpen.value || highlightedIndex.value < 0) return undefined;
        return `${listboxId}-opt-${highlightedIndex.value}`;
    });

    const isOptionSelected = (opt: any): boolean => {
        if (!opt || temp_value.value === undefined) return false;
        return opt[props.optionValue] === temp_value.value;
    };

    const getFlattenedIndexForHighlighted = () => {
        if (highlightedIndex.value < 0) return -1;
        if (props.groupOptions !== undefined) {
            const found = flattenedItems.value.findIndex(
                (entry) => entry.type === 'option' && entry.selectableIndex === highlightedIndex.value
            );
            return found >= 0 ? found : highlightedIndex.value;
        }
        return highlightedIndex.value;
    };

    const scrollHighlightedIntoView = () => {
        nextTick(() => {
            const container = listContainerEl.value;
            if (!container || highlightedIndex.value < 0) return;

            const flatIdx = getFlattenedIndexForHighlighted();
            const clientH = container.clientHeight || 200;

            if (isVirtual.value) {
                setViewport(container.scrollTop, clientH);
                const targetScroll = scrollToIndex(flatIdx, 'auto');
                container.scrollTop = targetScroll;
                setViewport(targetScroll, clientH);
            } else {
                const h = numericItemHeight.value;
                const targetTop = flatIdx * h;
                const targetBottom = targetTop + h;

                if (targetTop < container.scrollTop) container.scrollTop = targetTop;
                else if (targetBottom > container.scrollTop + clientH) container.scrollTop = targetBottom - clientH;
            }
        });
    };

    watch(isOpen, (open) => {
        if (open) nextTick(() => {
            const container = listContainerEl.value;
            if (container) setViewport(container.scrollTop, container.clientHeight || 200);
        });
    });

    const navigateOptions = (step: number) => {
        const total = flatSelectableOptions.value.length;
        if (total === 0) return;

        let next = highlightedIndex.value + step;
        if (next < 0) next = total - 1;
        if (next >= total) next = 0;

        highlightedIndex.value = next;
        scrollHighlightedIntoView();
    };

    async function before_show(event: any) {
        emit('before-show', event);
        if (props.loadOptions) {
            loading.value = true;
            try {
                optionsField.value = await props.loadOptions();
            } finally {
                loading.value = false;
            }
        }
    }

    const toggle = async (event?: any) => {
        if (props.disabled) return;
        if (!isOpen.value) {
            await before_show(event);
            searchQuery.value = '';
            isOpen.value = true;
        } else hide();

    };

    const hide = () => {
        isOpen.value = false;
    };

    const selectOption = (opt: any) => {
        const val = opt?.[props.optionValue] ?? opt;
        temp_value.value = val;
        emit('change', val);
        hide();
    };

    const onTriggerKeydown = (event: KeyboardEvent) => {
        if (props.disabled) return;

        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault();
                if (!isOpen.value) toggle();
                else navigateOptions(1);

                break;
            case 'ArrowUp':
                event.preventDefault();
                if (!isOpen.value) toggle();
                else navigateOptions(-1);

                break;
            case 'Enter':
            case ' ':
                event.preventDefault();
                if (!isOpen.value) toggle();
                else if (highlightedIndex.value >= 0 && flatSelectableOptions.value[highlightedIndex.value]) selectOption(flatSelectableOptions.value[highlightedIndex.value]);

                break;
            case 'Home':
                if (isOpen.value && flatSelectableOptions.value.length > 0) {
                    event.preventDefault();
                    highlightedIndex.value = 0;
                    scrollHighlightedIntoView();
                }
                break;
            case 'End':
                if (isOpen.value && flatSelectableOptions.value.length > 0) {
                    event.preventDefault();
                    highlightedIndex.value = flatSelectableOptions.value.length - 1;
                    scrollHighlightedIntoView();
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

    const onKeydown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
            hide();
            triggerEl.value?.focus();
        }
    };

    let outsidePointerDown = false;
    const onDocPointerDown = (e: MouseEvent | TouchEvent | PointerEvent) => {
        const target = e.target as Node | null;
        if (overlayEl.value && !overlayEl.value.contains(target) && triggerEl.value && !triggerEl.value.contains(target)) outsidePointerDown = true;
        else outsidePointerDown = false;

    };

    const onDocClick = (e: MouseEvent) => {
        const target = e.target as Node | null;
        if (outsidePointerDown && overlayEl.value && !overlayEl.value.contains(target) && triggerEl.value && !triggerEl.value.contains(target)) hide();

        outsidePointerDown = false;
    };

    watch(isOpen, async (open) => {
        if (typeof window !== 'undefined') if (open) {
            window.addEventListener('keydown', onKeydown);
            document.addEventListener('pointerdown', onDocPointerDown, true);
            document.addEventListener('click', onDocClick, true);
        } else {
            window.removeEventListener('keydown', onKeydown);
            document.removeEventListener('pointerdown', onDocPointerDown, true);
            document.removeEventListener('click', onDocClick, true);
        }


        if (open) {
            const items = flatSelectableOptions.value;
            const selectedIdx = items.findIndex((opt: any) => isOptionSelected(opt));
            highlightedIndex.value = selectedIdx >= 0 ? selectedIdx : (items.length > 0 ? 0 : -1);
            scrollHighlightedIntoView();

            if (props.filter) {
                await nextTick();
                filterInputEl.value?.focus();
            }
        } else highlightedIndex.value = -1;

    });

    watch(searchQuery, () => {
        if (isOpen.value) {
            highlightedIndex.value = flatSelectableOptions.value.length > 0 ? 0 : -1;
            scrollHighlightedIntoView();
        }
    });

    onBeforeUnmount(() => {
        if (typeof window !== 'undefined') {
            window.removeEventListener('keydown', onKeydown);
            document.removeEventListener('pointerdown', onDocPointerDown, true);
            document.removeEventListener('click', onDocClick, true);
        }
    });

    watchDebounced(
        () => props.modelValue,
        () => {
            if (isBlank(props.modelValue) && props.default !== undefined) temp_value.value = props.default;
        },
        { deep: true, debounce: 500 }
    );
</script>

<style lang="scss" scoped>
    .max-select-tag {
        &.max-input-main-div :deep(.max-input-field-div:focus-within) {
            outline: none !important;
        }

        :deep(.max-input-field-div) {
            width: 100%;

            .input-slot-div {
                margin: 0 !important;
                width: 100% !important;
                padding: 0 !important;

                .value-tag-div {
                    grid-template-columns: auto 1fr auto;
                    width: auto !important;
                    max-width: 100%;
                    padding: 0 !important;
                }
            }
        }

        :deep(.input-slot-div) {
            padding: 0 !important;
        }

        .tab-placeholder-select {
            position: absolute;
            color: var(--background-650);
            font-size: 0.9rem;
            z-index: 1;
            display: grid;
            place-items: center;
            width: 100%;
            height: 100%;
            pointer-events: none;
        }

        .max-select-wrapper {
            position: relative;
            width: 100%;
            display: flex;
            align-items: center;

            .max-select-clear-btn {
                position: absolute;
                right: 8px;
                background: transparent;
                border: none;
                padding: 0 4px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                color: var(--background-500);
                transition: color 0.15s ease, transform 0.15s ease;
                z-index: 2;

                &:hover {
                    color: var(--max-danger-500, #ef4444);
                    transform: scale(1.1);
                }
            }
        }

        .max-select {
            width: 100% !important;
            height: 36px !important;
            cursor: pointer;
            display: flex;
            align-items: center;
            outline: none;

            .max-select-label {
                border: none !important;
                padding: 0 10px !important;
                display: grid;
                place-items: center start;
                outline: none !important;
                height: 32px !important;
                flex: 1;

                &:focus {
                    border: none !important;
                    outline: none !important;
                    outline-offset: 0 !important;
                    box-shadow: none;
                }

                .value-tag-div {
                    grid-template-columns: auto 1fr auto;
                    place-items: center;
                    padding: unset;
                    display: grid;
                    overflow: hidden;
                    position: relative;
                    width: fit-content;
                    max-width: 100%;
                    gap: 4px;

                    :deep(> .max-icon-div) {
                        width: auto !important;
                        padding: 3px 10px 3px 3px !important;

                        .max-icon {
                            padding: 0 !important;
                        }
                    }

                    .tag-value-text {
                        max-width: 100% !important;
                        position: relative;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        white-space: nowrap;
                    }
                }
            }
        }

        &.is-button-mode {
            width: auto !important;
            min-width: unset !important;
            border: none !important;
            background: transparent !important;
            padding: 0 !important;

            :deep(.max-input-field-div) {
                border: none !important;
                background: transparent !important;
                padding: 0 !important;
                min-height: unset !important;
                height: auto !important;
                box-shadow: none !important;

                .input-slot-div {
                    padding: 0 !important;
                    margin: 0 !important;
                    width: auto !important;
                }
            }

            .max-select,
            .p-select {
                width: auto !important;
                height: auto !important;
                padding: 0 !important;
                border: none !important;
                background: transparent !important;

                .max-select-label,
                .p-select-label {
                    padding: 0 !important;
                    height: auto !important;
                    border: none !important;
                    background: transparent !important;
                }
            }
        }

        &[small] {
            padding: 0 !important;

            .max-select {
                padding: 0 5px 0 0 !important;

                span {
                    font-size: 0.85rem !important;
                }
            }
        }

        &[flex], &[full] {
            .max-select,
            .max-select .max-select-label,
            .max-select .max-select-label .value-tag-div,
            .max-select .max-select-label .value-tag-div .tag-value-text {
                height: 100% !important;
                max-height: 100% !important;
                display: grid;
            }

            .max-select .max-select-label .value-tag-div .tag-value-text {
                display: grid;
                place-items: center start;
            }
        }
    }

    .max-select-overlay {
        position: fixed;
        z-index: var(--z-dropdown, 1000);
        background: var(--background-0, #fff);
        border: 1px solid var(--surface-border);
        border-radius: 6px;
        box-shadow: 0 4px 12px rgb(0 0 0 / 15%);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        transform: translateY(-10px);

        .max-select-header {
            padding: 6px !important;
            z-index: 1 !important;

            .max-select-filter-container {
                width: 100%;

                .max-select-filter {
                    width: 100%;
                    padding: 4px 8px;
                    border: 1px solid var(--surface-border);
                    border-radius: 4px;
                    outline: none;
                    font-size: 0.85rem;
                }
            }
        }

        .max-select-list-container {
            position: relative;
            padding: 10px;
            scrollbar-width: thin;
            overflow-y: auto;

            .max-select-spacer {
                width: 100%;
            }

            .max-select-list {
                &.is-virtual {
                    position: absolute;
                    top: 10px;
                    left: 10px;
                    right: 10px;
                }

                .max-select-option-group-wrapper {
                    padding: 4px 8px;
                    font-weight: 600;
                    font-size: 0.8rem;
                    color: var(--background-500, #94a3b8);
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    user-select: none;
                }

                .max-select-option {
                    cursor: pointer;
                    padding: 2px 4px;
                    min-height: 36px;
                    display: flex;
                    align-items: center;
                    box-sizing: border-box;
                    transition: background-color 0.15s ease;

                    &.max-select-option-highlighted,
                    &.is-focused,
                    &:hover {
                        background-color: var(--background-100, #f1f5f9) !important;
                    }

                    &.max-select-option-selected {
                        background-color: unset !important;
                    }

                    .category {
                        width: 20px;
                        margin-right: 10px;
                        display: grid;
                        place-items: center;
                        border-radius: 5px;
                    }

                    .label-tag-div {
                        display: grid;
                        grid-template-columns: auto 1fr auto;
                        width: 100% !important;
                        place-items: center start;
                        gap: 10px;
                        height: 30px;
                        background-color: none !important;

                        .label-tag {
                            place-items: center;
                            display: flex;
                            flex-flow: row nowrap;
                        }

                        .sub-label-tag {
                            padding-left: 1rem;
                            text-align: right;
                            width: 100%;
                            font-size: 0.85rem;
                        }

                        img {
                            max-height: 20px;
                        }
                    }
                }
            }
        }

        &:has(.label-tag-div) {
            .max-select-list-container {
                max-height: 635px !important;

                .max-select-list {
                    gap: 5px !important;
                    display: flex;
                    flex-direction: column;

                    .max-select-option {
                        padding: 0 !important;
                    }
                }
            }

            &:has(.max-select-header) {
                .max-select-list-container {
                    padding-top: 14px !important;
                }
            }
        }
    }

    [transparent] {
        .max-select {
            background-color: transparent !important;
        }
    }
</style>
