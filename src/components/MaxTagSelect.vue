<template>
    <InputBase v-bind="{ ...props, ...attrs }" class="max-select-tag" input-click no-dropdown>
        <div v-if="attrs.placeholder !== undefined && (!temp_value || temp_value === '')" class="tab-placeholder-select">
            {{ attrs.placeholder }}
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
                <slot name="value">
                    <div
                        class="value-tag-div"
                        :style="getStyleColor(option_selected, false, true)"
                        :color-string="getColorString(option_selected)"
                        v-if="!isButton"
                    >
                        <MaxIcon
                            :icon="option_selected?.icon ?? null"
                            :size="option_selected?.icon_size ?? 1.4"
                            pr10
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
                    <div v-else>
                        <MaxIconButton :icon="props.i ?? props.icon ?? props.iconLeft" :size="option_selected?.icon_size ?? 1.8" />
                    </div>
                </slot>
            </div>
        </div>

        <Teleport to="body">
            <div v-if="isOpen" class="max-select-backdrop" @click="hide">
                <div
                    ref="overlayEl"
                    class="p-select-overlay"
                    role="listbox"
                    :style="{ top: position.top + 'px', left: position.left + 'px', minWidth: position.minWidth }"
                    @click.stop
                >
                    <div v-if="props.filter" class="p-select-header">
                        <div class="p-select-filter-container">
                            <input
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
                        <template v-else-if="filteredOptions.length > 0">
                            <div class="p-select-list">
                                <div
                                    v-for="(option, index) in (filteredOptions as any[])"
                                    :key="index"
                                    class="p-select-option"
                                    :class="{ 'p-select-option-selected': option[props.optionValue] === temp_value }"
                                    role="option"
                                    :aria-selected="option[props.optionValue] === temp_value"
                                    @click.stop="selectOption(option)"
                                >
                                    <slot name="option" :option="option" :selected="option[props.optionValue] === temp_value" :index="index">
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
                                                <div v-text="option[props.optionLabel] ?? option.label" :style="{ color: attrs.color }"></div>
                                            </div>
                                            <div class="sub-label-tag" v-text="option?.sub_label ?? option?.sub ?? option?.subLabel"></div>
                                            <img v-if="option['img']" :src="`/media/images/${option['img']}`" alt="Image" class="img-label" />
                                        </div>
                                    </slot>
                                </div>
                            </div>
                        </template>
                        <div v-else class="p-select-empty-message">
                            {{ attrs.emptyMessage ?? 'Nenhum registro encontrado' }}
                        </div>
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
    import { ref, computed, watch, useAttrs, onBeforeUnmount, Ref } from 'vue';
    import InputBase from './InputBase.vue';
    import { SelectGroupOptions } from '../types';
    import { getColorFromVar, contrastColor, isBlank, watchDebounced, useElementBounding, useElementSize, useWindowSize } from '@maxvue/max-use';
    import MaxIcon from './MaxIcon.vue';
    import MaxIconButton from './MaxIconButton.vue';

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
            text = hover ? 'var(--background-600)' : 'var(--background-650)';
        }

        return {
            backgroundColor: background,
            color: text,
            borderRadius: '6px',
            padding: '0 6px !important',
            gap: 0
        };
    };

    const emit = defineEmits(['update:modelValue', 'before-show']);
    const temp_value = ref<any>(props.modelValue);

    watch(temp_value, (val) => emit('update:modelValue', val));
    watch(() => props.modelValue, (val) => (temp_value.value = val));

    const isOpen = ref(false);
    const loading = ref(false);
    const optionsField: Ref<any[]> = ref([]);
    const searchQuery = ref('');

    const triggerEl = ref<HTMLElement | null>(null);
    const overlayEl = ref<HTMLElement | null>(null);

    const { x, y, width: width_btn, height: height_btn } = useElementBounding(triggerEl as any);
    const { width: width_el, height: height_el } = useElementSize(overlayEl as any);
    const { width: window_width, height: window_height } = useWindowSize();

    const position = computed(() => {
        const targetX = x.value;
        const targetY = y.value;
        const targetW = width_btn.value;
        const targetH = height_btn.value;

        let top = targetY + targetH + 2;
        let left = targetX;
        const minW = Math.max(targetW, 140);

        if (top + (height_el.value || 200) > window_height.value && targetY - (height_el.value || 200) > 0) top = targetY - (height_el.value || 200) - 2;


        if (left + (width_el.value || minW) > window_width.value) left = Math.max(10, window_width.value - (width_el.value || minW) - 10);


        return {
            top,
            left,
            minWidth: minW + 'px'
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
        hide();
    };

    const onKeydown = (event: KeyboardEvent) => {
        if (event.key === 'Escape' && isOpen.value) hide();

    };

    if (typeof window !== 'undefined') window.addEventListener('keydown', onKeydown);


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

<style lang="scss">
.max-select-tag {
    &[small] {
        padding: 0 !important;

        .p-select {
            padding: 0 5px 0 0 !important;

            span {
                font-size: 0.85rem !important;
            }
        }
    }

    .p-select {
        width: 100%;
        height: 36px !important;
        cursor: pointer;
        display: flex;
        align-items: center;
        outline: none;
    }

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

    &[flex], &[full] {
        .p-select, .p-select-label, .value-tag-div, .tag-value-text {
            height: 100% !important;
            max-height: 100% !important;
            display: grid;
        }

        .tag-value-text {
            display: grid;
            place-items: center start;
        }
    }
}

.label-tag-div {
    display: grid;
    grid-template-columns: auto 1fr auto;
    width: 100% !important;
    place-items: center start;
    gap: 10px;
    height: 30px;

    .sub-label-tag {
        padding-left: 1rem;
        text-align: right;
        width: 100%;
        font-size: 0.85rem;
    }

    .label-tag {
        display: grid;
        place-items: center;
    }

    img {
        max-height: 20px;
    }
}

.value-tag-div {
    grid-template-columns: auto auto auto;
    place-items: center;
    padding: unset;
    display: grid;
    overflow: hidden;
    position: relative;
    width: fit-content;
    max-width: 100%;

    .tag-value-text {
        max-width: 100% !important;
        position: relative;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
}

.p-select-option {
    cursor: pointer;
    padding: 2px 4px;

    .category {
        width: 20px;
        margin-right: 10px;
        display: grid;
        place-items: center;
        border-radius: 5px;
    }
}

.p-select-header {
    box-shadow: 0 7px 12px 5px #fff !important;
    padding: 6px !important;
    z-index: 1 !important;

    .p-select-filter-container {
        width: 100%;

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

    &:has(.label-tag-div) {
        .p-select-option {
            padding: 0 !important;
        }

        .p-select-list {
            gap: 5px !important;
            display: flex;
            flex-direction: column;
        }

        .p-select-list-container {
            max-height: 635px !important;
        }

        &:has(.p-select-header) {
            .p-select-list-container {
                padding-top: 14px !important;
            }
        }
    }
}

.p-select-list-container {
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
}

[transparent] {
    .p-floatlabel, .p-select {
        background-color: transparent !important;
    }
}
</style>
