<template>
    <InputBase v-bind="{...props, ...attrs}" class="max-select-tag" input-click no-dropdown >
        <tadiv v-if="attrs.placeholder !== undefined && (!temp_value || temp_value === '')" class="tab-placeholder-select">
            {{ attrs.placeholder }}
        </tadiv>
        <Select v-bind="{...props, ...attrs}" v-model="temp_value" :filter="props.filter"  :loading="loading" @before-show="(before_show as any)" :options="options" :optionLabel="attrs.optionLabel" :optionValue="props.optionValue" :emptyMessage="attrs.emptyMessage ?? 'Nenhum registro encontrado'" :editable="attrs.editable ?? false" :disabled="props.disabled">
            <template #option="slotProps">
                <slot name="option" :option="slotProps.option" :selected="slotProps.selected" :index="slotProps.index">
                    <div class="label-tag-div" :style="getStyleColor(slotProps.option, slotProps.option['hover'] ?? false, false)" @mouseenter="options.find(o => o['value'] === slotProps.option['value'])['hover'] = true" @mouseleave="options.find(o => o['value'] === slotProps.option['value'])['hover'] = false">
                        <MaxIcon :icon="slotProps.option['icon']" v-if="slotProps.option['icon']" :size="slotProps.option?.['iconSize'] ?? '1'" :style="{ width: '30px'}" :color="getStyleColor(slotProps.option, false, false).color"/>
                        <div class="label-tag">
                            <div v-html="slotProps.option[attrs.optionLabel] ?? slotProps.option.label" :style="{ color: attrs.color }"></div>
                        </div>
                        <div class="sub-label-tag" v-html="slotProps.option?.sub_label ?? slotProps.option?.sub ?? slotProps.option?.subLabel"></div>
                        <img v-if="slotProps.option['img']" :src="`/media/images/${slotProps.option['img']}`" alt="Image" class="img-label" />
                    </div>
                </slot>
            </template>
            <template #value="value">
                <div class="value-tag-div" :style="getStyleColor(option_selected, false, true)" :color-string="getColorString(option_selected)" v-if="! isButton" >
                    <MaxIcon :icon="option_selected?.icon ?? null" :size="option_selected?.icon_size ?? 1.4" pr10 v-if="option_selected.icon" :color="getStyleColor(option_selected, false, true).color" />
                    <div class="tag-value-text" :style="{color: getStyleColor(option_selected, false, true).color}" >{{ option_selected?.[props.optionName] ?? option_selected?.name ?? option_selected?.label }}</div>
                    <slot name="btn-right">
                    </slot>
                </div>
                <div v-else>
                    <MaxIconButton :icon="props.i ?? props.icon ?? props.iconLeft" :size="option_selected?.icon_size ?? 1.8" />
                </div>
            </template>
        </Select>
    </InputBase>
</template>

/**
 * Componente de seleção (dropdown).
 * Suporta opções simples, agrupadas e carregamento dinâmico via callback.
 */
<script setup lang="ts">
    import { ref, computed, watch, useAttrs, Ref } from 'vue';
    import InputBase from './InputBase.vue';
    import Select from 'primevue/select';
    import { SelectGroupOptions } from '../types';
    import { getColorFromVar, contrastColor, isBlank, watchDebounced } from '@maxvue/max-use';
    import MaxIcon from './MaxIcon.vue';

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
        if (color_string === 'unset' && ! is_value) {
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
    watch(() => props.modelValue, (val) => temp_value.value = val);

    const loading = ref(false);
    const optionsField: Ref<any[]> = ref([]);

    const options = computed(() => {
        const options = (optionsField.value && optionsField.value.length > 0) ? optionsField.value : (props.options ?? props.groupOptions ?? []);
        options?.map((option: any) => option.hover ??= false);

        return options;
    });

    const option_selected = computed(() => {
        const valueKey = props.optionValue;

        if (props.options) return props.options.find((opt: any) => opt[valueKey] === temp_value.value) ?? {};

        const groups = Object.values(options.value) as any[];
        for (const group of groups) {
            const found = group.items.find((opt: any) => opt[valueKey] === temp_value.value);
            if (found) return found;
        }
        return {};
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
    }

    .p-select-label {
        border: none !important;
        padding: 0 10px !important;
        display: grid;
        place-items: center start;
        outline: none !important;
        height: 32px !important;

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

.p-select-option {
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
    padding-bottom: 0 !important;
    z-index: 1 !important;
}


.p-select-overlay {
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
