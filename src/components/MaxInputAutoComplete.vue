<template>
    <InputBase v-bind="props" class="if" :value="search_value" :done="isDone" :error="error_msg" :caution="caution">
        <AutoComplete
            v-bind="attrs"
            optionLabel="name"
            :suggestions="filtered_values"
            @complete="search"
            :forceSelection="true"
            :virtualScrollerOptions="{ itemSize: 40 }"
            v-model="search_value"
            :placeholder="attrs.placeholder ?? 'SELECIONE'"
            @blur="isDone = testIsDone()"
        >
            <template #option="slotProps">
                <div class="autocomplete-item-select">
                    <div class="autocomplete-item-select-label">{{ slotProps.option[attrs.optionLabel ?? 'label'] ?? slotProps.option.label }}</div>
                    <div class="autocomplete-item-select-sub-label">{{ slotProps.option.subLabel ?? slotProps.option.sublabel ?? slotProps.option['sub-label'] }}</div>
                </div>
            </template>
            <template #content></template>
        </AutoComplete>
    </InputBase>
</template>

<script setup lang="ts">
    const attrs: any = useAttrs();

    const props = withDefaults(
        defineProps<{
            modelValue: any;
            options: Record<string, any>[];
            icon?: string | undefined;
            i?: string | undefined;
            disabled?: boolean | undefined;
            float?: boolean | undefined;
            msg?: string | undefined;
            message?: string | undefined;
            iconMessage?: string | undefined;
            label?: string | undefined;
            done?: boolean | undefined;
            error?: string | boolean | undefined;
            targetValue?: string;
            caution?: string | boolean | undefined;
            required?: boolean;
        }>(),
        { modelValue: '', options: () => [], done: undefined, required: false, caution: undefined }
    );

    const list = computed(() => props.options ?? []);
    const search_value: Ref = ref(props.modelValue);
    const filtered_values: Ref = ref([]);
    
    const search_value_string = computed(() => {
        if (search_value.value && typeof search_value.value === 'string') return search_value.value;
        if (search_value.value && typeof search_value.value === 'object') return search_value.value?.value ?? search_value.value?.label ?? search_value.value?.id ?? search_value.value[attrs.optionValue ?? 'value'] ?? '';
        return '';
    });

    const isDone: Ref = ref(props.done ?? null);
    const isRequiredDone = computed(() => (props.required ? hasContent(search_value_string.value) : null));

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

    const emit = defineEmits(['update:modelValue']);
    
    watch(search_value, () => {
        isDone.value = testIsDone();
        if (search_value.value && typeof search_value.value !== 'string') emit('update:modelValue', search_value.value);
    });

    watch(
        () => props.modelValue,
        () => {
            search_value.value = props.modelValue;
        }
    );

    const search = () => {
        filtered_values.value = list.value.filter((item: any) => {
            const search = (item.value ?? '') + (item.label ?? '') + (item.name ?? '') + (item[attrs.optionValue ?? 'value'] ?? '');
            return toSearchableString(search).toLowerCase().includes(toSearchableString(search_value_string.value));
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
