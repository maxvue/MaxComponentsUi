<template>
    <InputBase v-bind="{ ...props, ...attrsWithoutModelProps }" class="select_input_div">
        <div v-if="showPlaceholder" class="placeholder-select">
            {{ placeholderText }}
        </div>

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
                        <span class="value-text" elipsis>{{ option_selected[props.optionName] ?? option_selected.name ?? option_selected.label }}</span>
                    </div>
                </slot>
            </div>

            <div class="p-select-dropdown" aria-hidden="true">
                <MaxIcon icon="lucide:chevron-down" size="1" />
            </div>
        </div>

        <Teleport to="body">
            <div v-if="isOpen" class="max-select-backdrop" @click="hide">
                <div
                    ref="overlayEl"
                    class="p-select-overlay"
                    role="listbox"
                    :style="{ top: position.top + 'px', left: position.left + 'px', width: position.width }"
                    @click.stop
                >
                    <div v-if="props.filter" class="p-select-header">
                        <div class="p-select-filter-container">
                            <input
                                ref="filterInputEl"
                                type="text"
                                class="p-select-filter"
                                v-model="searchQuery"
                                placeholder="Pesquisar..."
                                autofocus
                                @click.stop
                            />
                        </div>
                    </div>

                    <div class="p-select-list-container">
                        <div v-if="loading" class="p-select-empty-message">
                            Carregando...
                        </div>
                        <template v-else-if="props.groupOptions !== undefined">
                            <template v-if="hasOptions">
                                <div v-for="(group, gIdx) in (filteredOptions as any[])" :key="gIdx" class="p-select-option-group-wrapper">
                                    <slot name="optiongroup" :option="group">
                                        <div class="label_div p-select-option-group">
                                            <div class="labelz">
                                                <div>{{ group.label }}</div>
                                            </div>
                                        </div>
                                    </slot>
                                    <div
                                        v-for="(option, oIdx) in group.items"
                                        :key="oIdx"
                                        class="p-select-option"
                                        :class="{ 'p-select-option-selected': option[props.optionValue] === temp_value }"
                                        :style="{ height: itemHeight }"
                                        role="option"
                                        :aria-selected="option[props.optionValue] === temp_value"
                                        @click.stop="selectOption(option)"
                                    >
                                        <slot name="option" :option="option" :selected="option[props.optionValue] === temp_value" :index="oIdx">
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
                            <div v-else class="p-select-empty-message">
                                {{ attrs.emptyMessage ?? 'Nenhum registro encontrado' }}
                            </div>
                        </template>
                        <template v-else>
                            <template v-if="hasOptions">
                                <div
                                    v-for="(option, index) in (filteredOptions as any[])"
                                    :key="index"
                                    class="p-select-option"
                                    :class="{ 'p-select-option-selected': option[props.optionValue] === temp_value }"
                                    :style="{ height: itemHeight }"
                                    role="option"
                                    :aria-selected="option[props.optionValue] === temp_value"
                                    @click.stop="selectOption(option)"
                                >
                                    <slot name="option" :option="option" :selected="option[props.optionValue] === temp_value" :index="index">
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
                            <div v-else class="p-select-empty-message">
                                {{ attrs.emptyMessage ?? 'Nenhum registro encontrado' }}
                            </div>
                        </template>
                    </div>
                </div>
            </div>
        </Teleport>
    </InputBase>
</template>

/**
 * Componente de seleção (dropdown).
 * Suporta opções simples, agrupadas e carregamento dinâmico via callback.
 */
<script setup lang="ts">
    import { ref, computed, watch, useAttrs, onBeforeUnmount, nextTick, Ref } from 'vue';
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
            listHeight: 27
        }
    );

    const emit = defineEmits(['update:modelValue', 'before-show']);
    const temp_value = ref<any>(props.modelValue);

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

    watch(temp_value, (val) => emit('update:modelValue', val));
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

    const hasOptions = computed(() => {
        if (props.groupOptions !== undefined) return filteredOptions.value.some((g: any) => g?.items?.length > 0);

        return filteredOptions.value.length > 0;
    });

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
            if (props.filter) {
                await nextTick();
                filterInputEl.value?.focus();
            }
        } else hide();

    };

    const hide = () => {
        isOpen.value = false;
    };

    const selectOption = (opt: any) => {
        const val = opt?.[props.optionValue] ?? opt;
        temp_value.value = val;
        hide();
    };

    const onKeydown = (event: KeyboardEvent) => {
        if (event.key === 'Escape' && isOpen.value) hide();

    };

    if (typeof window !== 'undefined') window.addEventListener('keydown', onKeydown);


    onBeforeUnmount(() => {
        if (typeof window !== 'undefined') window.removeEventListener('keydown', onKeydown);

    });

    watch(isOpen, async (open) => {
        if (open && props.filter) {
            await nextTick();
            filterInputEl.value?.focus();
        }
    });

    watch(
        () => props.modelValue,
        () => {
            if (isBlank(props.modelValue) && props.default !== undefined) temp_value.value = props.default;
        },
        { deep: true }
    );
</script>

<style lang="scss">
.select_input_div {
    &[small] {
        padding: 0 !important;

        .p-select {
            padding: 0 5px 0 0 !important;

            span {
                font-size: 0.85rem !important;
            }
        }
    }

    .placeholder-select{
        padding-left: 7px !important;
    }

    .p-select {
        width: 100%;
        height: 36px !important;
        display: flex;
        align-items: center;
        justify-content: space-between;
        cursor: pointer;
        outline: none;

        .p-select-dropdown {
            padding-right: 8px;
            display: flex;
            align-items: center;
            color: var(--background-600, #94a3b8);
        }
    }

    &.in-line, &[input-click]:not([input-click='false']) {
        .p-select, .p-select-label {
            height: 20px !important;
            min-height: 20px !important;
        }
    }

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
    }

    .placeholder-select {
        position: absolute;
        color: var(--background-600);
        font-size: 0.9rem;
    }
}

.max-select-backdrop {
    position: fixed;
    inset: 0;
    z-index: 1100;
    background: transparent;
}

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
}

.p-select-header {
    padding: 6px;
    border-bottom: 1px solid var(--surface-border, #e2e8f0);
    background: var(--background-0, #fff);
    box-shadow: none !important;

    .p-select-filter-container {
        width: 100%;

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

.p-select-list-container {
    overflow-y: auto;
    max-height: 240px;
    scrollbar-width: thin;

    ::-webkit-scrollbar {
        width: 3px;
        height: 3px;
    }
}

.p-select-empty-message {
    padding: 8px 12px;
    color: var(--background-500, #64748b);
    font-size: 0.85rem;
}

.p-select-option-group {
    font-weight: 600;
    padding: 6px 10px;
    font-size: 0.8rem;
    color: var(--background-500, #64748b);
    background: var(--background-50, #f8fafc);
}

.p-select-option {
    display: flex;
    align-items: center;
    padding: 0 10px;
    min-height: 27px;
    box-sizing: border-box;
    cursor: pointer;
    font-size: 0.85rem;
    color: var(--text-c);

    &:hover {
        background-color: var(--background-100, #f1f5f9) !important;

        &.p-select-option-selected {
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

    &.p-select-option-selected {
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
        color: var(--background-650);
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
        color: var(--background-650) !important;
    }

    &:hover {
        .icon-div {
            color: var(--background-650) !important;
        }
    }

    .subLabel {
        color: var(--background-600);
        padding-left: 1rem;
        text-align: right;
        width: 100%;
        font-size: 0.85rem;
    }

    .labelz {
        display: grid;
        place-items: center;
        color: var(--background-750);
    }

    img {
        max-height: 20px;
    }
}

.value-div {
    display: grid;
    grid-template-columns: auto 1fr;
    place-items: center;

    .value-text {
        color: var(--background-750);
    }
}

[transparent] {
    .p-floatlabel, .p-select {
        background-color: transparent !important;
    }
}
</style>
