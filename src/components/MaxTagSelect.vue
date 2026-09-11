<template>
    <InputBase v-bind="{ ...props, ...attrs }" class="max-tag-select max-select-tag" input-click-auto no-dropdown>
        <div v-if="showPlaceholder" class="tab-placeholder-select">
            {{ placeholderText }}
        </div>

        <div
            ref="triggerEl"
            class="max-select p-select"
            :class="{ 'is-disabled': props.disabled, 'p-disabled': props.disabled, 'is-focused': isOpen, 'p-focus': isOpen }"
            tabindex="0"
            role="combobox"
            aria-haspopup="listbox"
            :aria-expanded="isOpen"
            :aria-controls="listboxId"
            :aria-activedescendant="activeDescendantId"
            @click.stop="toggle"
            @keydown="onTriggerKeydown"
        >
            <div class="max-select-label p-select-label">
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
                        <slot name="btn-right"></slot>
                    </div>
                    <div v-else-if="isButton">
                        <MaxIconButton :icon="props.i ?? props.icon ?? props.iconLeft" :size="option_selected?.icon_size ?? 1.8" />
                    </div>
                </slot>
            </div>
        </div>

        <Teleport to="body" v-if="isOpen">
            <div class="max-select-tag-backdrop" @click="hide">
                <div
                    ref="overlayEl"
                    :id="listboxId"
                    class="max-select-overlay p-select-overlay"
                    role="listbox"
                    tabindex="-1"
                    :style="{ top: position.top + 'px', left: position.left + 'px' }"
                    @click.stop
                >
                    <div v-if="props.filter" class="max-select-header p-select-header">
                        <div class="max-select-filter-container p-select-filter-container">
                            <input
                                ref="filterInputEl"
                                type="text"
                                class="max-select-filter p-select-filter"
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

                    <div class="max-select-list-container p-select-list-container">
                        <div v-if="loading" class="max-select-empty-message p-select-empty-message">
                            Carregando...
                        </div>
                        <template v-else-if="filteredOptions.length > 0">
                            <div class="max-select-list p-select-list">
                                <div
                                    v-for="(option, index) in (filteredOptions as any[])"
                                    :key="index"
                                    :id="`${listboxId}-opt-${index}`"
                                    :ref="(el) => setOptionRef(el, index)"
                                    class="max-select-option p-select-option"
                                    :class="{
                                        'max-select-option-selected p-select-option-selected is-selected': isOptionSelected(option),
                                        'max-select-option-highlighted p-select-option-highlighted is-focused': highlightedIndex === index
                                    }"
                                    role="option"
                                    :aria-selected="isOptionSelected(option)"
                                    @click.stop="selectOption(option)"
                                    @mouseenter="highlightedIndex = index"
                                >
                                    <slot name="option" :option="option" :selected="isOptionSelected(option)" :index="index">
                                        <div
                                            class="label-tag-div"
                                            :style="getStyleColor(option, option['hover'] ?? false, false)"
                                            @mouseenter="option['hover'] = true"
                                            @mouseleave="option['hover'] = false"
                                        >
                                            <MaxIcon
                                                :icon="option['icon']"
                                                v-if="option['icon']"
                                                :size="option?.['iconSize'] ?? '1'"
                                                :style="{ width: '30px' }"
                                                :color="getStyleColor(option, false, false).color"
                                            />
                                            <div class="label-tag">
                                                <div style="display: grid; white-space: nowrap;" v-text="option[props.optionLabel] ?? option.label" :style="{ color: attrs.color }"></div>
                                            </div>
                                            <div class="sub-label-tag" v-text="option?.sub_label ?? option?.sub ?? option?.subLabel"></div>
                                            <img v-if="option['img']" :src="`/media/images/${option['img']}`" alt="Image" class="img-label" />
                                        </div>
                                    </slot>
                                </div>
                            </div>
                        </template>
                        <div v-else class="max-select-empty-message p-select-empty-message">
                            {{ attrs.emptyMessage ?? 'Nenhum registro encontrado' }}
                        </div>
                    </div>
                </div>
            </div>
        </Teleport>
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
    import { getColorFromVar, contrastColor, isBlank, watchDebounced, useElementBounding, useElementSize, useWindowSize } from '@maxvue/max-use';
    import { getOverlayWidth, getOverlayLeft } from '../helpers/useOverlayWidth';
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
            backgroundColor: 'var(--background-500)'
        }
    );

    const getColorString = (item: any) => {
        if (!item) return 'unset';
        return item.background_color ?? item.backgroundColor ?? item.tag_color ?? item.tagColor ?? item['tag-color'] ?? item['background-color'] ?? 'unset';
    };

    const getStyleColor = (item: any, hover: boolean = false, is_value: boolean = false) => {
        const color_string = getColorString(item);

        const default_color = is_value ? props.backgroundColor : 'var(--background-500)';

        const color = getColorFromVar(color_string === 'unset' ? default_color : color_string);

        let background = hover ? color.darken(0.2).hexa() : color.hexa();
        let text = contrastColor(background);
        if (color_string === 'unset' && !is_value) {
            background = hover ? 'rgba(0,0,0, 0.1)' : 'transparent';
            text = hover ? 'var(--background-775)' : 'var(--background-700)';
        }

        return {
            backgroundColor: background,
            color: text,
            borderRadius: '6px',
            padding: is_value ? '0 8px 0 6px !important' : '0 10px 0 6px !important',
            gap: is_value ? '4px' : 0
        };
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
    const optionRefs = ref<(HTMLElement | null)[]>([]);

    const setOptionRef = (el: any, index: number) => {
        if (el) optionRefs.value[index] = el as HTMLElement;

    };

    watch(temp_value, (val) => {
        if (skipNextUpdateModelValue) {
            skipNextUpdateModelValue = false;
            return;
        }
        emit('update:modelValue', val);
    });
    watch(() => props.modelValue, (val) => (temp_value.value = val));

    const isOpen = ref(false);
    const loading = ref(false);
    const optionsField: Ref<any[]> = ref([]);
    const searchQuery = ref('');

    const triggerEl = ref<HTMLElement | null>(null);
    const overlayEl = ref<HTMLElement | null>(null);
    const filterInputEl = ref<HTMLInputElement | null>(null);

    const { x, y, width: width_btn, height: height_btn } = useElementBounding(triggerEl as any);
    const { height: height_el } = useElementSize(overlayEl as any);
    const { width: window_width, height: window_height } = useWindowSize();

    const position = computed(() => {
        const targetX = x.value;
        const targetY = y.value;
        const targetH = height_btn.value;

        const width = getOverlayWidth({ triggerWidth: width_btn.value, windowWidth: window_width.value, minWidth: 140 });

        let top = targetY + targetH + 2;

        if (top + (height_el.value || 200) > window_height.value && targetY - (height_el.value || 200) > 0) top = targetY - (height_el.value || 200) - 2;


        return {
            top,
            left: getOverlayLeft(targetX, width, window_width.value),
            width: width + 'px'
        };
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

        return (raw as any[]).filter((opt: any) => {
            const txt = String(opt[labelKey] ?? opt.label ?? opt.name ?? '').toLowerCase();
            const sub = String(opt.sub_label ?? opt.sub ?? opt.subLabel ?? '').toLowerCase();
            return txt.includes(q) || sub.includes(q);
        });
    });

    const flatSelectableOptions = computed<any[]>(() => {
        const raw = filteredOptions.value;
        if (props.groupOptions !== undefined && Array.isArray(raw)) {
            const flat: any[] = [];
            for (const grp of raw as any[]) if (grp?.items && Array.isArray(grp.items)) flat.push(...grp.items);
            else flat.push(grp);


            return flat;
        }
        return (raw as any[]) || [];
    });

    const activeDescendantId = computed(() => {
        if (!isOpen.value || highlightedIndex.value < 0) return undefined;
        return `${listboxId}-opt-${highlightedIndex.value}`;
    });

    const isOptionSelected = (opt: any): boolean => {
        if (!opt || temp_value.value === undefined) return false;
        return opt[props.optionValue] === temp_value.value;
    };

    const scrollHighlightedIntoView = () => {
        nextTick(() => {
            const el = optionRefs.value[highlightedIndex.value];
            if (el && typeof el.scrollIntoView === 'function') el.scrollIntoView({ block: 'nearest' });

        });
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

    watch(isOpen, async (open) => {
        if (typeof window !== 'undefined') if (open) window.addEventListener('keydown', onKeydown);
        else window.removeEventListener('keydown', onKeydown);


        if (open) {
            optionRefs.value = [];
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
        if (typeof window !== 'undefined') window.removeEventListener('keydown', onKeydown);

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
                    width: 100% !important;
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

        .max-select,
        .p-select {
            width: 100% !important;
            height: 36px !important;
            cursor: pointer;
            display: flex;
            align-items: center;
            outline: none;

            .max-select-label,
            .p-select-label {
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

        &[small] {
            padding: 0 !important;

            .max-select,
            .p-select {
                padding: 0 5px 0 0 !important;

                span {
                    font-size: 0.85rem !important;
                }
            }
        }

        &[flex], &[full] {
            .max-select,
            .p-select,
            .max-select .max-select-label,
            .p-select .p-select-label,
            .max-select .max-select-label .value-tag-div,
            .p-select .p-select-label .value-tag-div,
            .max-select .max-select-label .value-tag-div .tag-value-text,
            .p-select .p-select-label .value-tag-div .tag-value-text {
                height: 100% !important;
                max-height: 100% !important;
                display: grid;
            }

            .max-select .max-select-label .value-tag-div .tag-value-text,
            .p-select .p-select-label .value-tag-div .tag-value-text {
                display: grid;
                place-items: center start;
            }
        }
    }

    .max-select-tag-backdrop {
        top: 0;
        left: 0;
        position: fixed;
        width: 100vw;
        height: 100vh;
        z-index: 9999 !important;

        .max-select-overlay,
        .p-select-overlay {
            position: fixed;
            z-index: 1101;
            background: var(--background-0, #fff);
            border: 1px solid var(--surface-border, #e2e8f0);
            border-radius: 6px;
            box-shadow: 0 4px 12px rgb(0 0 0 / 15%);
            display: flex;
            flex-direction: column;
            overflow: hidden;
            transform: translateY(-10px);

            .max-select-header,
            .p-select-header {
                padding: 6px !important;
                z-index: 1 !important;

                .max-select-filter-container,
                .p-select-filter-container {
                    width: 100%;

                    .max-select-filter,
                    .p-select-filter {
                        width: 100%;
                        padding: 4px 8px;
                        border: 1px solid var(--surface-border, #e2e8f0);
                        border-radius: 4px;
                        outline: none;
                        font-size: 0.85rem;
                    }
                }
            }

            .max-select-list-container,
            .p-select-list-container {
                padding: 10px;
                scrollbar-width: thin;
                overflow-y: auto;

                ::-webkit-scrollbar {
                    width: 3px;
                    height: 3px;
                }

                .p-virtualscroller {
                    max-height: 250px !important;
                    overflow: hidden !important;
                    overflow-y: auto !important;
                }

                .max-select-list,
                .p-select-list {
                    .max-select-option,
                    .p-select-option {
                        cursor: pointer;
                        padding: 2px 4px;
                        min-height: 36px;
                        display: flex;
                        align-items: center;
                        box-sizing: border-box;
                        transition: background-color 0.15s ease;

                        &.max-select-option-highlighted,
                        &.p-select-option-highlighted,
                        &.is-focused,
                        &:hover {
                            background-color: var(--background-100, #f1f5f9) !important;
                        }

                        &.max-select-option-selected,
                        &.p-select-option-selected {
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
                .max-select-list-container,
                .p-select-list-container {
                    max-height: 635px !important;

                    .max-select-list,
                    .p-select-list {
                        gap: 5px !important;
                        display: flex;
                        flex-direction: column;

                        .max-select-option,
                        .p-select-option {
                            padding: 0 !important;
                        }
                    }
                }

                &:has(.max-select-header),
                &:has(.p-select-header) {
                    .max-select-list-container,
                    .p-select-list-container {
                        padding-top: 14px !important;
                    }
                }
            }
        }
    }

    [transparent] {
        :deep(.p-floatlabel),
        .max-select,
        .p-select {
            background-color: transparent !important;
        }
    }
</style>
