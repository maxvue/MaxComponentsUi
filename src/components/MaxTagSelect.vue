<template>
    <InputBase v-bind="{...props, ...attrs}" class="max-select-tag" >
        <div v-if="attrs.placeholder !== undefined && (!temp_value || temp_value === '')" class="placeholder-select">
            {{ attrs.placeholder }}
        </div>
        <Select v-bind="{...props, ...attrs}" v-model="temp_value" :filter="props.filter"  :loading="loading" @before-show="(before_show as any)" :options="options" :optionLabel="attrs.optionLabel" :optionValue="props.optionValue" :emptyMessage="attrs.emptyMessage ?? 'Nenhum registro encontrado'" :editable="attrs.editable ?? false" :disabled="props.disabled">
            <template #option="slotProps">
                <slot name="option" :option="slotProps.option" :selected="slotProps.selected" :index="slotProps.index">
                    <div class="label-tag-div" :style="getStyleColor(String(slotProps.option.background_color ?? slotProps.option.backgroundColor ?? slotProps.option.tag_color ?? slotProps.option.tagColor ?? slotProps.option['tag-color'] ?? slotProps.option['background-color'] ?? 'unset'), slotProps.option['hover'] ?? false)" @mouseenter="options.find(o => o['value'] === slotProps.option['value'])['hover'] = true" @mouseleave="options.find(o => o['value'] === slotProps.option['value'])['hover'] = false">
                        <Icon :icon="slotProps.option['icon']" v-if="slotProps.option['icon']" :size="slotProps.option?.['iconSize'] ?? '1'" :style="{ width: '30px' }" />
                        <div class="label-tag">
                            <div v-html="slotProps.option[attrs.optionLabel] ?? slotProps.option.label" :style="{ color: attrs.color }"></div>
                        </div>
                        <div class="sub-label-tag" v-html="slotProps.option?.sub_label ?? slotProps.option?.sub ?? slotProps.option?.subLabel"></div>
                        <img v-if="slotProps.option['img']" :src="`/media/images/${slotProps.option['img']}`" alt="Image" class="img-label" />
                    </div>
                </slot>
            </template>
            <template #value="value">
                <div class="value-div" :style="getStyleColor(String(option_selected?.background_color ?? option_selected?.backgroundColor ?? option_selected.tag_color ?? option_selected?.tagColor ?? option_selected?.['tag-color'] ?? option_selected?.['background-color'] ?? 'unset'))" >
                    <Icon :icon="option_selected?.icon ?? null" :size="option_selected?.icon_size ?? undefined" pr10/>
                    <span class="tag-value-text" elipsis>{{ option_selected?.[props.optionName] ?? option_selected?.name ?? option_selected?.label }}</span>
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

        }>(),
        { modelValue: null, done: undefined, optionValue: 'value', optionName: 'name', filter: false, optionLabel: 'label', error: undefined, caution: undefined, required: false, default: undefined, disabled: false }
    );

    const getStyleColor = (color_string: string, hover: boolean = false) => {

        const color = color_string === 'unset' ? getColorFromVar('var(--background-500)') : getColorFromVar(color_string);

        const background = hover ? (color.isDark() ? color.lighten(0.3).hexa() : color.darken(0.3).hexa()) : color.hexa();
        const text = contrastColor(background);

        return {
            backgroundColor: background,
            color: text,
            borderRadius: '6px',
            padding: '0 6px'
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
        height: 36px !important;

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

.value-div {
    display: grid;
    grid-template-columns: auto 1fr;
    place-items: center;
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

.tag-value-text {
    color: unset !important;
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
