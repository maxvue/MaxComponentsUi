<template>
    <InputBase v-bind="props" class="if" :value="temp_value" :done="isDone" :error="props.error" :caution="caution">
        <AutoComplete v-bind="props" optionLabel="name" :suggestions="filtered_values" @complete="search" :forceSelection="true" :virtualScrollerOptions="{ itemSize: 40 }" v-model="temp_value" :placeholder="props.placeholder ?? 'SELECIONE'" @blur="isDone = testIsDone()" >
            <template #option="slotProps">
                <div class="autocomplete-item-select">
                    <div class="autocomplete-item-select-label">{{ slotProps.option[props.optionLabel ?? 'label'] ?? slotProps.option.label }}</div>
                    <div class="autocomplete-item-select-sub-label">{{ slotProps.option.subLabel ?? slotProps.option.sublabel ?? slotProps.option['sub-label'] }}</div>
                </div>
            </template>
            <template #content></template>
        </AutoComplete>
    </InputBase>
</template>

<script setup lang="ts">
    import { hasContent, toSearchableString } from '@maxvue/max-use';
    import type { Ref } from 'vue';
    import { ref, computed, watch } from 'vue';
    import InputBase from './InputBase.vue';
    import AutoComplete from 'primevue/autocomplete';

    const props = withDefaults(
        defineProps<{
            modelValue: any;
            options: any;
            icon?: string | undefined;
            i?: string | undefined;
            disabled?: boolean | undefined;
            optionLabel?: string | undefined;
            optionValue?: string | undefined;
            float?: boolean | undefined;
            msg?: string | undefined;
            message?: string | undefined;
            iconMessage?: string | undefined;
            placeholder?: string | undefined;
            label?: string | undefined;
            done?: boolean | undefined;
            error?: string | boolean | undefined;
            targetValue?: string;
            caution?: string | boolean | undefined;
            required?: boolean;
        }>(),
        { modelValue: '', options: () => [], done: undefined, error: undefined, required: false, caution: undefined }
    );

    const list = computed(() => props.options ?? []);
    const temp_value: Ref = ref(props.modelValue);
    const filtered_values: Ref = ref([]);

    const temp_value_string = computed(() => {
        if (temp_value.value && typeof temp_value.value === 'string') return temp_value.value;
        if (temp_value.value && typeof temp_value.value === 'object') return temp_value.value?.value ?? temp_value.value?.label ?? temp_value.value?.id ?? temp_value.value[props.optionValue ?? 'value'] ?? '';
        return '';
    });

    const isDone: Ref = ref(props.done ?? null);
    const isRequiredDone = computed(() => (props.required ? hasContent(temp_value_string.value) : null));

    const testIsDone = () => {
        if (props.done !== undefined) return props.done;
        if (isRequiredDone.value !== null) return isRequiredDone.value;
        if (props.caution !== undefined) return !props.caution;
        return null;
    };

    const caution = computed(() => (props.caution !== undefined ? props.caution && isDone.value === false : isDone.value === false));

    const emit = defineEmits(['update:modelValue']);

    watch(temp_value, () => {
        isDone.value = testIsDone();
        if (temp_value.value && typeof temp_value.value !== 'string') emit('update:modelValue', temp_value.value);
    });

    watch( () => props.modelValue, () => temp_value.value = props.modelValue );

    const search = () => {
        filtered_values.value = list.value.filter((item: any) => {
            const search = (item.value ?? '') + (item.label ?? '') + (item.name ?? '') + (item[props.optionValue ?? 'value'] ?? '');
            return toSearchableString(search).toLowerCase().includes(toSearchableString(temp_value_string.value));
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
