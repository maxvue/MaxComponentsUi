<template>
    <InputBase v-bind="{ ...props, ...attrsWithoutModelProps }" class="max-input-select select_input_div">
        <div v-if="showPlaceholder" class="placeholder-select">
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
                <slot name="value" :value="temp_value">
                    <div
                        class="value-div"
                        v-if="hasSelectedOption"
                        :style="{ color: option_selected.color }"
                    >
                        <MaxIcon
                            :icon="option_selected.icon ?? null"
                            :size="option_selected.icon_size ?? undefined"
                            :style="{ paddingRight: option_selected.icon ? '10px' : '0' }"
                        />
                        <span class="value-text">{{ option_selected[props.optionName] ?? option_selected.name ?? option_selected.label }}</span>
                    </div>
                </slot>
            </div>

            <button
                v-if="isClearable && hasSelectedOption && !props.disabled"
                type="button"
                class="max-select-clear-btn p-select-clear-btn"
                aria-label="Limpar seleção"
                @click.stop="clearSelection"
            >
                <MaxIcon icon="lucide:x" size="0.85" />
            </button>

            <div class="max-select-dropdown p-select-dropdown" aria-hidden="true">
                <MaxIcon icon="lucide:chevron-down" size="1" />
            </div>
        </div>

        <Teleport to="body" v-if="isOpen">
            <div class="max-select-backdrop" @click="hide">
                <div
                    ref="overlayEl"
                    :id="listboxId"
                    class="max-select-overlay p-select-overlay"
                    role="listbox"
                    tabindex="-1"
                    :style="{ top: position.top + 'px', left: position.left + 'px', width: position.width }"
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
                        <template v-else-if="props.groupOptions !== undefined">
                            <template v-if="hasOptions">
                                <div v-for="(group, gIdx) in (filteredOptions as any[])" :key="gIdx" class="max-select-option-group-wrapper p-select-option-group-wrapper">
                                    <slot name="optiongroup" :option="group">
                                        <div class="label_div max-select-option-group p-select-option-group">
                                            <div class="labelz">
                                                <div>{{ group.label }}</div>
                                            </div>
                                        </div>
                                    </slot>
                                    <div
                                        v-for="(option, oIdx) in group.items"
                                        :key="oIdx"
                                        :id="`${listboxId}-opt-${getOptionIndex(option)}`"
                                        :ref="(el) => setOptionRef(el, getOptionIndex(option))"
                                        class="max-select-option p-select-option"
                                        :class="{
                                            'max-select-option-selected p-select-option-selected is-selected': isOptionSelected(option),
                                            'max-select-option-highlighted p-select-option-highlighted is-focused': highlightedIndex === getOptionIndex(option)
                                        }"
                                        :style="{ height: itemHeight }"
                                        role="option"
                                        :aria-selected="isOptionSelected(option)"
                                        @click.stop="selectOption(option)"
                                        @mouseenter="highlightedIndex = getOptionIndex(option)"
                                    >
                                        <slot name="option" :option="option" :selected="isOptionSelected(option)" :index="oIdx">
                                            <div class="label_div">
                                                <MaxIcon :icon="option['icon']" v-if="option['icon']" :size="option['iconSize'] ?? '1'" :style="{ width: '30px' }" />
                                                <div class="labelz">
                                                    <div v-text="option[props.optionLabel] ?? option.label ?? option.name" :style="{ color: attrs.color }"></div>
                                                </div>
                                                <div class="subLabel" v-text="option?.sub_label ?? option?.sub ?? option?.subLabel"></div>
                                            </div>
                                        </slot>
                                    </div>
                                </div>
                            </template>
                            <div v-else class="max-select-empty-message p-select-empty-message">
                                {{ attrs.emptyMessage ?? 'Nenhum registro encontrado' }}
                            </div>
                        </template>
                        <template v-else>
                            <template v-if="hasOptions">
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
                                    :style="{ height: itemHeight }"
                                    role="option"
                                    :aria-selected="isOptionSelected(option)"
                                    @click.stop="selectOption(option)"
                                    @mouseenter="highlightedIndex = index"
                                >
                                    <slot name="option" :option="option" :selected="isOptionSelected(option)" :index="index">
                                        <div :class="`category ${option.category}`" v-if="attrs.category === true">
                                            {{ option.category === 'UTILITY' ? 'A' : '' }}{{ option.category === 'MARKETING' ? 'B' : '' }}
                                        </div>
                                        <div class="label_div">
                                            <MaxIcon :icon="option['icon']" v-if="option['icon']" :size="option?.['iconSize'] ?? '1'" :style="{ width: '30px' }" />
                                            <div class="labelz">
                                                <div v-text="option[props.optionLabel] ?? option.label ?? option.name" :style="{ color: attrs.color }"></div>
                                            </div>
                                            <div class="subLabel" v-text="option?.sub_label ?? option?.sub ?? option?.subLabel"></div>
                                            <img v-if="option['img']" :src="`/media/images/${option['img']}`" alt="Image" class="img-label" />
                                        </div>
                                    </slot>
                                </div>
                            </template>
                            <div v-else class="max-select-empty-message p-select-empty-message">
                                {{ attrs.emptyMessage ?? 'Nenhum registro encontrado' }}
                            </div>
                        </template>
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
    import MaxIcon from './MaxIcon.vue';
    import { SelectGroupOptions } from '../types';
    import { isBlank, useElementBounding, useElementSize, useWindowSize } from '@maxvue/max-use';
    import { getOverlayWidth, getOverlayLeft } from '../helpers/useOverlayWidth';

    const attrs: any = useAttrs();

    const props = withDefaults(
        defineProps<{
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
            placeholder?: string | undefined;
            /** Permite limpar a opção selecionada exibindo um botão de limpeza */
            clearable?: boolean | undefined;
            /** Alias para clearable */
            showClear?: boolean | undefined;
            /** Altura dos itens da lista (em px ou com unidade CSS). Padrão: 27 */
            listHeight?: number | string | undefined;
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
            default: undefined,
            disabled: false,
            placeholder: undefined,
            clearable: false,
            showClear: false,
            listHeight: 27
        }
    );

    const emit = defineEmits<{
        'update:modelValue': [value: any];
        'change': [value: any];
        'clear': [];
        'before-show': [event?: Event];
    }>();

    const temp_value = ref<any>(props.modelValue);
    let skipNextUpdateModelValue = false;

    const listboxId = `max-select-listbox-${Math.random().toString(36).slice(2, 9)}`;
    const highlightedIndex = ref<number>(-1);
    const optionRefs = ref<(HTMLElement | null)[]>([]);

    const setOptionRef = (el: any, index: number) => {
        if (el) optionRefs.value[index] = el as HTMLElement;

    };

    const isClearable = computed(() => Boolean(props.clearable || props.showClear));

    const modelPropKeys = [
        'modelValue',
        'options',
        'optionLabel',
        'optionValue',
        'optionName',
        'groupOptions',
        'loadOptions',
        'default',
        'filter',
        'disabled',
        'clearable',
        'showClear',
        'show-clear',
        'listHeight',
        'list-height'
    ];
    const attrsWithoutModelProps = computed(() => {
        const result: Record<string, any> = {};
        for (const key in attrs) if (!modelPropKeys.includes(key)) result[key] = attrs[key];
        return result;
    });

    const itemHeight = computed(() => {
        if (props.listHeight === undefined || props.listHeight === null || props.listHeight === '') return '27px';

        if (typeof props.listHeight === 'number') return `${props.listHeight}px`;

        const str = String(props.listHeight).trim();
        if (/^\d+(\.\d+)?$/.test(str)) return `${str}px`;

        return str;
    });

    watch(temp_value, (val) => {
        if (skipNextUpdateModelValue) {
            skipNextUpdateModelValue = false;
            return;
        }
        emit('update:modelValue', val);
    });

    watch(
        () => props.modelValue,
        (val) => {
            temp_value.value = val;
            if (isBlank(val) && props.default !== undefined) temp_value.value = props.default;

        },
        { deep: true }
    );

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

        const width = getOverlayWidth({ triggerWidth: width_btn.value, windowWidth: window_width.value });

        let top = targetY + targetH + 2;

        if (top + (height_el.value || 200) > window_height.value && targetY - (height_el.value || 200) > 0) top = targetY - (height_el.value || 200) - 2;


        return {
            top,
            left: getOverlayLeft(targetX, width, window_width.value),
            width: width + 'px'
        };
    });

    const options = computed(() => {
        if (optionsField.value && optionsField.value.length > 0) return optionsField.value;
        if (props.options) return props.options;
        if (props.groupOptions) return props.groupOptions;
        return [];
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

    const hasSelectedOption = computed(() => Boolean(option_selected.value && Object.keys(option_selected.value).length > 0));

    const placeholderText = computed(() => (props.placeholder !== undefined ? props.placeholder : attrs.placeholder));

    const showPlaceholder = computed(() => placeholderText.value !== undefined && !hasSelectedOption.value);

    function normalizeText(value: any): string {
        return String(value ?? '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .trim();
    }

    const filteredOptions = computed(() => {
        const raw = options.value;
        if (!props.filter || !searchQuery.value.trim()) return raw;

        const q = normalizeText(searchQuery.value);
        const labelKey = props.optionLabel;

        if (props.groupOptions !== undefined) return (raw as any[])
            .map((group) => {
                if (!group || !Array.isArray(group.items)) return group;
                const items = group.items.filter((item: any) => {
                    const txt = normalizeText(item[labelKey] ?? item.label ?? item.name ?? '');
                    const sub = normalizeText(item.sub_label ?? item.sub ?? item.subLabel ?? '');
                    return txt.includes(q) || sub.includes(q);
                });
                return items.length > 0 ? { ...group, items } : null;
            })
            .filter(Boolean);


        return (raw as any[]).filter((opt: any) => {
            const txt = normalizeText(opt[labelKey] ?? opt.label ?? opt.name ?? '');
            const sub = normalizeText(opt.sub_label ?? opt.sub ?? opt.subLabel ?? '');
            return txt.includes(q) || sub.includes(q);
        });
    });

    const hasOptions = computed(() => {
        if (props.groupOptions !== undefined) return filteredOptions.value.some((g: any) => g?.items?.length > 0);

        return filteredOptions.value.length > 0;
    });

    const flatSelectableOptions = computed<any[]>(() => {
        const raw = filteredOptions.value;
        if (props.groupOptions !== undefined) {
            const flat: any[] = [];
            for (const grp of raw as any[]) if (grp?.items && Array.isArray(grp.items)) flat.push(...grp.items);


            return flat;
        }
        return (raw as any[]) || [];
    });

    const getOptionIndex = (option: any) => {
        return flatSelectableOptions.value.indexOf(option);
    };

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

    const clearSelection = () => {
        skipNextUpdateModelValue = true;
        temp_value.value = null;
        emit('update:modelValue', null);
        emit('change', null);
        emit('clear');
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
</script>

<style lang="scss" scoped>
.select_input_div {
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

    .placeholder-select {
        position: absolute;
        padding-left: 7px !important;
        color: var(--background-650);
        font-size: 0.9rem;
    }

    .max-select,
    .p-select {
        width: 100%;
        height: 36px !important;
        display: flex;
        align-items: center;
        justify-content: space-between;
        cursor: pointer;
        outline: none;

        .max-select-label,
        .p-select-label {
            border: none !important;
            padding: 0 10px !important;
            display: grid;
            place-items: center start;
            outline: none !important;
            height: 36px !important;
            flex: 1;

            &:focus {
                border: none !important;
                outline: none !important;
                outline-offset: 0 !important;
                box-shadow: none;
            }

            .value-div {
                display: grid;
                grid-template-columns: auto 1fr;
                place-items: center;

                .value-text {
                    color: var(--background-775);
                    white-space: nowrap;
                    text-overflow: ellipsis;
                    max-width: 100%;
                    overflow: hidden;
                }
            }
        }

        .max-select-clear-btn,
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
                color: var(--max-danger-500, #ef4444);
                transform: scale(1.1);
            }
        }

        .max-select-dropdown,
        .p-select-dropdown {
            padding-right: 13px;
            display: flex;
            align-items: center;
            color: var(--background-600, #94a3b8);
        }
    }

    &.in-line,
    &[input-click]:not([input-click='false']) {
        .max-select,
        .p-select,
        .max-select-label,
        .p-select-label {
            height: 20px !important;
            min-height: 20px !important;
        }
    }

    &[transparent] {
        :deep(.p-floatlabel),
        .max-select,
        .p-select {
            background-color: transparent !important;
        }
    }
}

.max-select-backdrop {
    position: fixed;
    inset: 0;
    z-index: 1100;
    background: transparent;

    .max-select-overlay,
    .p-select-overlay {
        position: fixed;
        z-index: 1101;
        background: var(--background-0, #fff);
        border: 1px solid var(--surface-border, #e2e8f0);
        border-radius: 6px;
        box-shadow: 0 4px 12px rgb(0 0 0 / 15%);
        max-height: 280px;
        display: flex;
        flex-direction: column;
        overflow: hidden;

        .max-select-header,
        .p-select-header {
            padding: 6px;
            border-bottom: 1px solid var(--surface-border, #e2e8f0);
            background: var(--background-0, #fff);
            box-shadow: none !important;

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
                    background: var(--background-50, #f8fafc);

                    &:focus {
                        border-color: var(--primary-500, #3b82f6);
                    }
                }
            }
        }

        .max-select-list-container,
        .p-select-list-container {
            overflow-y: auto;
            max-height: 240px;
            scrollbar-width: thin;

            ::-webkit-scrollbar {
                width: 3px;
                height: 3px;
            }

            .max-select-empty-message,
            .p-select-empty-message {
                padding: 8px 12px;
                color: var(--background-650);
                font-size: 0.85rem;
            }

            .max-select-option-group,
            .p-select-option-group {
                font-weight: 600;
                padding: 6px 10px;
                font-size: 0.8rem;
                color: var(--background-750);
                background: var(--background-50, #f8fafc);
            }

            .max-select-option,
            .p-select-option {
                display: flex;
                align-items: center;
                padding: 0 10px;
                min-height: 36px;
                box-sizing: border-box;
                cursor: pointer;
                font-size: 0.85rem;
                color: var(--background-700);
                transition: background-color 0.15s ease;

                &.max-select-option-highlighted,
                &.p-select-option-highlighted,
                &.is-focused,
                &:hover {
                    background-color: var(--background-100, #f1f5f9) !important;
                    color: var(--blue-700, #005F77);

                    &.max-select-option-selected,
                    &.p-select-option-selected,
                    &.is-selected {
                        background-color: var(--blue-700, #1d4ed8) !important;
                        color: var(--background-0, #fff) !important;

                        .icon-div {
                            color: var(--background-200) !important;
                        }

                        .labelz,
                        .subLabel {
                            color: var(--background-0, #fff);
                        }
                    }
                }

                &.max-select-option-selected,
                &.p-select-option-selected,
                &.is-selected {
                    background-color: var(--blue-600, #2563eb) !important;
                    color: var(--background-0, #fff) !important;

                    &:hover {
                        background-color: var(--blue-700, #1d4ed8) !important;
                    }

                    .icon-div {
                        color: var(--background-200) !important;
                    }

                    .labelz,
                    .subLabel {
                        color: var(--background-0, #fff);
                    }
                }

                .labelz,
                .subLabel {
                    color: var(--background-700);
                }

                .category {
                    width: 20px;
                    margin-right: 10px;
                    display: grid;
                    place-items: center;
                    border-radius: 5px;

                    &.UTILITY {
                        background-color: var(--blue-200);
                        color: var(--blue-600);
                    }

                    &.MARKETING {
                        background-color: var(--orange-200);
                        color: var(--red-b-500);
                    }
                }
            }

            .label_div {
                display: grid;
                grid-template-columns: auto 1fr auto;
                width: 100% !important;
                place-items: center start;
                gap: 10px;

                .icon-div {
                    color: var(--background-700) !important;
                }

                &:hover {
                    .icon-div {
                        color: var(--background-700) !important;
                    }
                }

                .subLabel {
                    color: var(--background-650);
                    padding-left: 1rem;
                    text-align: right;
                    width: 100%;
                    font-size: 0.85rem;
                }

                .labelz {
                    display: grid;
                    place-items: center;
                    color: var(--background-775);
                }

                img {
                    max-height: 20px;
                }
            }
        }
    }
}
</style>
