<template>
    <InputBase v-bind="{...props, ...attrs}" class="select_input_div">
        <div v-if="attrs.placeholder !== undefined && (temp_value === null || temp_value === '' || temp_value === undefined)" class="placeholder-select">
            {{ attrs.placeholder }}
        </div>

        <div
            ref="triggerRef"
            :class="['p-select', 'p-component', { 'p-disabled': props.disabled, 'p-select-open': overlayVisible }]"
            role="combobox"
            :aria-expanded="overlayVisible"
            :aria-controls="panelId"
            aria-haspopup="listbox"
            :tabindex="props.disabled ? -1 : 0"
            @click="toggleOverlay"
            @keydown="onKeydown"
        >
            <span class="p-select-label">
                <slot name="value" :value="temp_value" :placeholder="attrs.placeholder">
                    <div class="value-div" :style="{ color: option_selected_color }">
                        <Icon :icon="option_selected.icon ?? null" :size="option_selected.icon_size ?? option_selected.iconSize ?? undefined" :style="{ paddingRight: option_selected.icon ? '10px' : '0' }" />
                        <span class="value-text" elipsis>{{ option_selected[props.optionName] ?? option_selected.name ?? option_selected.label }}</span>
                    </div>
                </slot>
            </span>
            <div class="p-select-dropdown">
                <Icon v-if="loading" icon="loading" size="1" />
                <Icon v-else icon="mdi:chevron-down" size="1" />
            </div>
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
                        <!-- GRUPOS -->
                        <template v-if="props.groupOptions !== undefined">
                            <li v-for="(group, gIdx) in filteredGroupOptions" :key="`g-${gIdx}`" class="p-select-option-group" role="group">
                                <slot name="optiongroup" :option="group">
                                    <div class="label_div">
                                        <div class="labelz">
                                            <div>{{ group.label }}</div>
                                        </div>
                                    </div>
                                </slot>
                                <ul class="p-select-list">
                                    <li
                                        v-for="(item, iIdx) in group.items"
                                        :key="`g-${gIdx}-i-${iIdx}`"
                                        :class="['p-select-option', { 'p-select-option-selected': isSelected(item) }]"
                                        role="option"
                                        :aria-selected="isSelected(item)"
                                        @click.stop="selectOption(item, $event)"
                                    >
                                        <slot name="option" :option="item" :selected="isSelected(item)" :index="iIdx">
                                            <div class="label_div">
                                                <Icon :icon="item['icon']" v-if="item['icon']" :size="item['iconSize'] ?? '1'" :style="{ width: '30px' }" />
                                                <div class="labelz">
                                                    <div v-html="item.label" :style="{ color: attrs.color }"></div>
                                                </div>
                                                <div class="subLabel" v-html="item?.sub_label ?? item?.sub ?? item?.subLabel"></div>
                                            </div>
                                        </slot>
                                    </li>
                                </ul>
                            </li>
                        </template>

                        <!-- SIMPLES -->
                        <template v-else>
                            <li
                                v-for="(opt, idx) in filteredSimpleOptions"
                                :key="idx"
                                :class="['p-select-option', { 'p-select-option-selected': isSelected(opt) }]"
                                role="option"
                                :aria-selected="isSelected(opt)"
                                @click.stop="selectOption(opt, $event)"
                            >
                                <slot name="option" :option="opt" :selected="isSelected(opt)" :index="idx">
                                    <div :class="`category ${opt.category}`" v-if="attrs.category === true">{{ opt.category === 'UTILITY' ? 'A' : '' }}{{ opt.category === 'MARKETING' ? 'B' : '' }}</div>
                                    <div class="label_div">
                                        <Icon :icon="opt['icon']" v-if="opt['icon']" :size="opt?.['iconSize'] ?? '1'" :style="{ width: '30px' }" />
                                        <div class="labelz">
                                            <div v-html="opt[props.optionLabel] ?? opt.label ?? opt.name" :style="{ color: attrs.color }"></div>
                                        </div>
                                        <div class="subLabel" v-html="opt?.sub_label ?? opt?.sub ?? opt?.subLabel"></div>
                                        <img v-if="opt['img']" :src="`/media/images/${opt['img']}`" alt="Image" class="img-label" />
                                    </div>
                                </slot>
                            </li>
                        </template>

                        <li v-if="isEmpty" class="p-select-empty-message">
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
    import Icon from './MaxIcon.vue';
    import { SelectGroupOptions } from '../types';
    import { isBlank, watchDebounced, Random, toSearchableString } from '@maxvue/max-use';

    const attrs: any = useAttrs();
    const panelId = `p-select-panel-${Random()}`;
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
        }>(),
        { modelValue: null, done: undefined, optionValue: 'value', optionName: 'name', filter: false, optionLabel: 'label', error: undefined, caution: undefined, required: false, default: undefined, disabled: false }
    );

    const emit = defineEmits(['update:modelValue', 'before-show', 'change', 'blur', 'focus']);
    const temp_value = ref<any>(props.modelValue);

    watch(temp_value, (val) => emit('update:modelValue', val));
    watch(() => props.modelValue, (val) => temp_value.value = val);

    const loading = ref(false);
    const optionsField: Ref<any[]> = ref([]);

    const rawOptions = computed(() => {
        if (optionsField.value && optionsField.value.length > 0) return optionsField.value;
        if (props.options) return props.options;
        if (props.groupOptions) return props.groupOptions;
        return [];
    });

    const isSelected = (opt: any) => {
        const valueKey = props.optionValue;
        return opt && opt[valueKey] === temp_value.value;
    };

    const matchesFilter = (opt: any) => {
        if (!props.filter || !filterText.value.trim()) return true;
        const query = toSearchableString(filterText.value);
        const labelVal = opt[props.optionLabel] ?? opt.label ?? opt.name ?? '';
        return toSearchableString(String(labelVal)).includes(query);
    };

    const filteredSimpleOptions = computed(() => {
        if (props.groupOptions !== undefined) return [];
        return (rawOptions.value as any[]).filter(matchesFilter);
    });

    const filteredGroupOptions = computed(() => {
        if (props.groupOptions === undefined) return [];
        return (rawOptions.value as any[]).map((group) => ({
            ...group,
            items: (group.items ?? []).filter(matchesFilter)
        })).filter((group) => group.items.length > 0);
    });

    const isEmpty = computed(() => {
        if (props.groupOptions !== undefined) return filteredGroupOptions.value.length === 0;
        return filteredSimpleOptions.value.length === 0;
    });

    const option_selected = computed(() => {
        const valueKey = props.optionValue;

        if (props.options) return props.options.find((opt: any) => opt[valueKey] === temp_value.value) ?? {};

        const groups = Object.values(rawOptions.value) as any[];
        for (const group of groups) if (group && Array.isArray(group.items)) {
            const found = group.items.find((opt: any) => opt[valueKey] === temp_value.value);
            if (found) return found;
        }


        return {};
    });

    const option_selected_color = computed(() => {
        const opt = option_selected.value;
        return opt ? opt.color : undefined;
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
.select_input_div {
    &[small] {
        padding: 0 !important;

        .p-select {
            padding: 0 5px 0 0 !important;

            span {
                font-size: 0.85rem !important;

                // color: var(--background-600) !important;
            }
        }
    }

    .p-select {
        width: 100%;
        height: 36px !important;
        display: inline-flex;
        align-items: center;
        justify-content: space-between;
        cursor: pointer;
        user-select: none;
        position: relative;

        .p-select-dropdown {
            display: flex;
            align-items: center;
            justify-content: center;
            padding-right: 8px;
            color: var(--background-600);
        }
    }

    // Nos modos compactos a raiz do InputBase tem 20px; sem isto os 36px cravados
    // acima vazam da linha e encavalam no conteudo de cima
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
        width: 100%;

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

.p-select-overlay {
    background-color: var(--background-0, #fff);
    border: 1px solid var(--max-border-color, #e2e8f0);
    border-radius: 6px;
    box-shadow: 0 4px 12px rgb(0 0 0 / 10%);
    max-height: 250px;
    overflow-y: auto;
    z-index: 1000;
}

.p-select-list-container {
    .p-virtualscroller {
        max-height: 250px !important;
        overflow: hidden !important;
        overflow-y: auto !important;
    }
}

.p-select-list {
    list-style: none;
    margin: 0;
    padding: 4px 0;
}

.p-select-option-group {
    padding: 6px 12px;
    font-weight: bold;
    color: var(--background-600);
}

.p-select-option {
    padding: 8px 12px;
    cursor: pointer;

    &:hover {
        background-color: var(--background-300) !important;

        &.p-select-option-selected {
            background-color: var(--blue-700) !important;
            color: var(--background-0) !important;

            .icon-div {
                color: var(--background-200) !important;
            }

            .labelz,
            .subLabel {
                color: var(--background-0);
            }
        }
    }

    // SEM MOUSE EM CIMA
    &.p-select-option-selected {
        background-color: var(--blue-600) !important;

        &:hover {
            background-color: var(--blue-700) !important;
        }

        .icon-div {
            color: var(--background-200) !important;
        }

        .labelz,
        .subLabel {
            color: var(--background-0);
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

.p-select-empty-message {
    padding: 8px 12px;
    color: var(--background-500);
    text-align: center;
}

.p-select-header {
    box-shadow: 0 7px 12px 5px #fff !important;
    padding: 8px !important;
    z-index: 1 !important;
}

.p-select-overlay {
    &:has(.p-select-header) {
        .p-select-list-container {
            padding-top: 14px !important;
        }
    }
}

.p-select-list-container {
    scrollbar-width: thin;

    ::-webkit-scrollbar {
        width: 3px;  /* Define a largura como 0 */
        height: 3px; /* Altura da barra horizontal */
    }
}

[transparent] {
    .p-floatlabel, .p-select {
        background-color: transparent !important;
    }
}
</style>
