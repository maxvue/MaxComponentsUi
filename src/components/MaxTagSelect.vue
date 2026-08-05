<template>
    <InputBase v-bind="{...props, ...attrs}" class="max-select-tag" input-click no-dropdown>
        <div v-if="attrs.placeholder !== undefined && (temp_value === null || temp_value === '' || temp_value === undefined)" class="tab-placeholder-select">
            {{ attrs.placeholder }}
        </div>

        <div
            ref="triggerRef"
            :class="['p-select', 'p-component', { 'p-disabled': props.disabled }]"
            role="combobox"
            :aria-expanded="overlayVisible"
            :aria-controls="panelId"
            aria-haspopup="listbox"
            :tabindex="props.disabled ? -1 : 0"
            @click="toggleOverlay"
            @keydown="onKeydown"
        >
            <span class="p-select-label">
                <slot name="value">
                    <div class="value-tag-div" :style="getStyleColor(option_selected, false, true)" :color-string="getColorString(option_selected)" v-if="!isButton">
                        <MaxIcon :icon="option_selected?.icon ?? null" :size="option_selected?.icon_size ?? 1.4" pr10 v-if="option_selected.icon" :color="getStyleColor(option_selected, false, true).color" />
                        <div class="tag-value-text" :style="{color: getStyleColor(option_selected, false, true).color}">{{ option_selected?.[props.optionName] ?? option_selected?.name ?? option_selected?.label }}</div>
                        <slot name="btn-right"></slot>
                    </div>
                    <div v-else>
                        <MaxIconButton :icon="props.i ?? props.icon ?? props.iconLeft" :size="option_selected?.icon_size ?? 1.8" />
                    </div>
                </slot>
            </span>
        </div>

        <MaxBaseOverlay
            v-model:visible="overlayVisible"
            :target="triggerRef"
            match-target-width
            @before-show="() => before_show()"
        >
            <div class="p-select-overlay p-component" :id="panelId">
                <div class="p-select-header" v-if="props.filter">
                    <MaxBaseInput
                        v-model="filterText"
                        :placeholder="attrs.filterPlaceholder ?? 'Buscar...'"
                        class="p-select-filter-input"
                    />
                </div>
                <div class="p-select-list-container">
                    <ul class="p-select-list" role="listbox">
                        <li
                            v-for="(opt, idx) in filteredOptions"
                            :key="idx"
                            :class="['p-select-option', { 'p-select-option-selected': isSelected(opt) }]"
                            role="option"
                            :aria-selected="isSelected(opt)"
                            @click.stop="selectOption(opt, $event)"
                        >
                            <slot name="option" :option="opt" :selected="isSelected(opt)" :index="idx">
                                <div class="label-tag-div" :style="getStyleColor(opt, opt['hover'] ?? false, false)" @mouseenter="opt['hover'] = true" @mouseleave="opt['hover'] = false">
                                    <MaxIcon :icon="opt['icon']" v-if="opt['icon']" :size="opt?.['iconSize'] ?? '1'" :style="{ width: '30px'}" :color="getStyleColor(opt, false, false).color"/>
                                    <div class="label-tag">
                                        <div v-html="opt[props.optionLabel] ?? opt.label" :style="{ color: attrs.color }"></div>
                                    </div>
                                    <div class="sub-label-tag" v-html="opt?.sub_label ?? opt?.sub ?? opt?.subLabel"></div>
                                    <img v-if="opt['img']" :src="`/media/images/${opt['img']}`" alt="Image" class="img-label" />
                                </div>
                            </slot>
                        </li>
                        <li v-if="filteredOptions.length === 0" class="p-select-empty-message">
                            {{ attrs.emptyMessage ?? 'Nenhum registro encontrado' }}
                        </li>
                    </ul>
                </div>
            </div>
        </MaxBaseOverlay>
    </InputBase>
</template>

<script setup lang="ts">
    import { ref, computed, watch, useAttrs, Ref } from 'vue';
    import InputBase from './InputBase.vue';
    import MaxBaseOverlay from './base/MaxBaseOverlay.vue';
    import MaxBaseInput from './base/MaxBaseInput.vue';
    import MaxIcon from './MaxIcon.vue';
    import MaxIconButton from './MaxIconButton.vue';
    import { SelectGroupOptions } from '../types';
    import { getColorFromVar, contrastColor, isBlank, watchDebounced, Random, toSearchableString } from '@maxvue/max-use';

    const attrs: any = useAttrs();
    const panelId = `p-tag-select-panel-${Random()}`;
    const triggerRef = ref<HTMLElement | null>(null);
    const overlayVisible = ref(false);
    const filterText = ref('');

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
        { modelValue: null, done: undefined, optionValue: 'value', optionName: 'name', filter: false, optionLabel: 'label', error: undefined, caution: undefined, required: false, default: undefined, disabled: false, isButton: false, backgroundColor: 'var(--background-500)' }
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

    const emit = defineEmits(['update:modelValue', 'before-show', 'change']);
    const temp_value = ref<any>(props.modelValue);

    watch(temp_value, (val) => emit('update:modelValue', val));
    watch(() => props.modelValue, (val) => temp_value.value = val);

    const loading = ref(false);
    const optionsField: Ref<any[]> = ref([]);

    const options = computed(() => {
        const opts = (optionsField.value && optionsField.value.length > 0) ? optionsField.value : (props.options ?? props.groupOptions ?? []);
        opts?.forEach((option: any) => option.hover ??= false);
        return opts;
    });

    const isSelected = (opt: any) => {
        const valueKey = props.optionValue;
        return opt && opt[valueKey] === temp_value.value;
    };

    const filteredOptions = computed(() => {
        if (!props.filter || !filterText.value.trim()) return options.value;
        const query = toSearchableString(filterText.value);
        return options.value.filter((opt) => {
            const labelVal = opt[props.optionLabel] ?? opt.label ?? opt.name ?? '';
            return toSearchableString(String(labelVal)).includes(query);
        });
    });

    const option_selected = computed(() => {
        const valueKey = props.optionValue;

        if (props.options) return props.options.find((opt: any) => opt[valueKey] === temp_value.value) ?? {};

        const groups = Object.values(options.value) as any[];
        for (const group of groups) if (group && Array.isArray(group.items)) {
            const found = group.items.find((opt: any) => opt[valueKey] === temp_value.value);
            if (found) return found;
        }

        return {};
    });

    async function before_show(event?: any) {
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

    const toggleOverlay = () => {
        if (props.disabled) return;
        overlayVisible.value = !overlayVisible.value;
    };

    const selectOption = (opt: any, event?: Event) => {
        if (props.disabled) return;
        const val = opt ? opt[props.optionValue] : null;
        temp_value.value = val;
        emit('change', { value: val, originalEvent: event });
        overlayVisible.value = false;
    };

    const onKeydown = (event: KeyboardEvent) => {
        if (props.disabled) return;
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            toggleOverlay();
        } else if (event.key === 'Escape') overlayVisible.value = false;

    };

    watchDebounced(() => props.modelValue, () => {
        if (isBlank(props.modelValue) && props.default !== undefined) temp_value.value = props.default;
    }, { deep: true, debounce: 500 });
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
    }

    .p-select-label {
        border: none !important;
        padding: 0 10px !important;
        display: grid;
        place-items: center start;
        outline: none !important;
        height: 32px !important;
        width: 100%;

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
        pointer-events: none; /* O clique atravessa a div */
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
    grid-template-columns: auto 1fr auto;
    place-items: center;
    padding: unset;
    display: grid;
    overflow: hidden;
    position: relative;

    .tag-value-text {
        width: 100% !important;
        max-width: 100% !important;
        position: relative;
    }
}

.p-select-overlay {
    background-color: var(--background-0, #fff);
    border: 1px solid var(--max-border-color, #e2e8f0);
    border-radius: 6px;
    box-shadow: 0 4px 12px rgb(0 0 0 / 10%);
    transform: translateY(-10px);

    &:has(.label-tag-div) {
        .p-select-option {
            padding: 0 !important;
        }

        .p-select-list {
            gap: 5px !important;
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

.p-select-list {
    list-style: none;
    margin: 0;
    padding: 4px 0;
}

.p-select-option {
    padding: 4px 8px;
    cursor: pointer;

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
    padding: 8px !important;
    z-index: 1 !important;
}

.p-select-list-container {
    scrollbar-width: thin;

    ::-webkit-scrollbar {
        width: 3px;  /* Define a largura como 0 */
        height: 3px; /* Altura da barra horizontal */
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
