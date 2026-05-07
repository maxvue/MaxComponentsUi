<template>
    <InputBase v-bind="props" class="if" :value="searchInput" :done="isDone" :error="error_msg" :caution="caution">
        <AutoComplete
            v-bind="attrs"
            optionLabel="label"
            :suggestions="filtered_values"
            @complete="search"
            :forceSelection="true"
            :virtualScrollerOptions="{ itemSize: 40 }"
            v-model="searchInput"
            :placeholder="attrs.placeholder ?? 'SELECIONE'"
            @blur="isDone = testIsDone()"
        >
            <template #option="slotProps">
                <div class="autocomplete-item-select">
                    <div class="autocomplete-item-select-label">{{ slotProps.option.sub_label }}</div>
                </div>
            </template>
            <template #content></template>
        </AutoComplete>
    </InputBase>
</template>

/**
 * Componente Autocomplete que busca sugestões de uma API.
 * Integra-se com as rotas do backend Max para busca dinâmica.
 */
<script setup lang="ts">
    import { hasContent, toSearchableString, apiGetRoute, toArray, isBlank, size } from '@maxvue/max-use';
    import type { Ref } from 'vue';
    import { useRouter } from 'vue-router';
    import { ref, computed, watch, useAttrs } from 'vue';
    import InputBase from './InputBase.vue';
    import AutoComplete from 'primevue/autocomplete';

    // @ts-ignore
    const router = typeof useRouter !== 'undefined' ? useRouter() : null;
    const attrs: any = useAttrs();

    const props = withDefaults(
        defineProps<{
            /** Valor selecionado */
            modelValue: any;
            /** Rota da API para busca */
            route: string;
            /** Dados adicionais para enviar no corpo da requisição */
            data?: any;
            /** Ícone opcional */
            icon?: string | undefined;
            /** Alias para o ícone */
            i?: string | undefined;
            /** Desabilita o campo */
            disabled?: boolean | undefined;
            /** Ativa estilo FloatLabel */
            float?: boolean | undefined;
            /** Mensagem de feedback (alias) */
            msg?: string | undefined;
            /** Mensagem de feedback */
            message?: string | undefined;
            /** Ícone da mensagem de feedback */
            iconMessage?: string | undefined;
            /** Rótulo do campo */
            label?: string | undefined;
            /** Estado de conclusão/validação manual */
            done?: boolean | undefined;
            /** Mensagem ou estado de erro */
            error?: string | boolean | undefined;
            /** Valor para comparação (opcional) */
            targetValue?: string;
            /** Mensagem ou estado de atenção */
            caution?: string | boolean | undefined;
            /** Define se o campo é obrigatório */
            required?: boolean;
        }>(),
        { modelValue: '', done: undefined, required: false, caution: undefined }
    );

    const searchInput: Ref = ref(props.modelValue);
    const list: Ref<any[]> = ref([]);

    watch(
        searchInput,
        async (value) => {
            if (hasContent(value)) {
                apiGetRoute(props.route, { ...(props.data ?? {}), input_value: searchInput.value }).then((res: any) => {
                    list.value = toArray(res) as any;
                    if (isBlank(list.value as any) || size(list.value as any) === 0) return;
                    search();
                });
                return;
            }
        },
        { deep: true }
    );

    const filtered_values: Ref<any[]> = ref([]);
    const emit = defineEmits(['update:modelValue']);

    const searchInput_string = computed(() => {
        if (searchInput.value && typeof searchInput.value === 'string') return searchInput.value;
        if (searchInput.value && typeof searchInput.value === 'object') return searchInput.value?.value ?? searchInput.value?.label ?? searchInput.value?.id ?? searchInput.value[attrs.optionValue ?? 'value'] ?? '';
        return '';
    });

    const isDone: Ref = ref(props.done ?? null);
    const isRequiredDone = computed(() => (props.required ? hasContent(searchInput_string.value) : null));

    const testIsDone = () => {
        if (props.done !== undefined) return props.done;
        if (isRequiredDone.value !== null) return isRequiredDone.value;
        if (props.caution !== undefined) return !props.caution;
        return null;
    };

    const caution = computed(() => (props.caution !== undefined ? props.caution && isDone.value === false : isDone.value === false));

    const error_msg = computed(() => {
        if (!caution.value) return null;
        const attrs_error_message = attrs.errMsg ?? attrs.error_message ?? attrs.error_msg ?? null;
        if (isRequiredDone.value === false) return attrs_error_message ?? 'Campo obrigatório';
        return attrs_error_message ?? 'Valor inválido';
    });

    watch(searchInput, () => {
        isDone.value = testIsDone();
        if (searchInput.value && typeof searchInput.value !== 'string') emit('update:modelValue', searchInput.value);
    });

    watch(
        () => props.modelValue,
        () => {
            searchInput.value = props.modelValue;
        }
    );

    const search = () => {
        if (hasContent(list.value as any)) filtered_values.value = (list.value as any[]).filter((item: any) => {
            const searchStr = (item.value ?? '') + (item.label ?? '') + (item.name ?? '') + (item[attrs.optionValue ?? 'value'] ?? '');
            return toSearchableString(searchStr).toLowerCase().includes(toSearchableString(searchInput_string.value));
        });

    };
</script>

<style lang="scss">
    .main-div-input-auto-complete-api {
        width: 100% !important;

        .p-autocomplete {
            width: 100% !important;
        }

        .p-inputtext {
            width: 100% !important;
        }

        .input-auto-complete-api {
            width: 100% !important;

            input {
                width: 100% !important;
            }
        }

        .icon-input-auto-complete-api {
            position: absolute !important;
            width: 20px;
            right: 8px;
            top: calc(50% + 1px);
            color: var(--background-500);
            transform: translateY(-50%);
            z-index: 9;
            pointer-events: none;
        }

        .p-autocomplete-option-group {
            position: sticky !important;
            top: 40px !important;
        }
    }

    .autocomplete-item-select {
        height: 40px;
        padding: 10px;
        position: relative;
        display: grid;
        place-items: center start;
        grid-template-columns: 1fr auto;
        gap: 25px;
        width: 100%;

        .autocomplete-item-select-label {
            font-size: 0.9rem;
            max-width: 100%;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .autocomplete-item-select-sub-label {
            display: grid;
            place-items: center;
            font-size: 0.8rem;
            min-width: 15px;
            color: var(--background-500);
        }
    }

    .p-autocomplete-overlay {
        width: auto !important;

        .p-virtualscroller {
            width: auto !important;
            overflow-x: hidden;
            contain: content !important;

            .p-virtualscroller-content {
                position: relative !important;
            }
        }
    }

    .text-centereds {
        input {
            padding-left: 32px !important;
        }
    }

    .ref-div {
        position: absolute;
        width: 0;
        height: 0;
        top: 0;
        left: 0;
        z-index: -10;
    }
</style>
