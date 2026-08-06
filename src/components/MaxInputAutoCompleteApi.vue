<template>
    <InputBase v-bind="props" :done="isDone" :error="props.error" :caution="props.caution">
        <MaxInputAutoComplete optionLabel="label" :options="filtered_values" @complete="search" v-model="temp_value" :placeholder="props.placeholder ?? 'SELECIONE'" @blur="isDone = testIsDone()">
            <template #option="slotProps">
                <div class="autocomplete-item-select">
                    <div class="autocomplete-item-select-label">{{ slotProps.option.model ?? slotProps.option.label }}</div>
                    <div class="autocomplete-item-select-sub-label">{{ slotProps.option.sub_label }}</div>
                </div>
            </template>
        </MaxInputAutoComplete>
    </InputBase>
</template>

<script setup lang="ts">
    /**
     * Componente Autocomplete que busca sugestões de uma API.
     * Integra-se com as rotas do backend Max para busca dinâmica.
     */
    import { hasContent, toSearchableString, getCachedApiIDB, keyExists, isBlank, size, isEqual } from '@maxvue/max-use';
    import type { Ref } from 'vue';
    import { ref, computed, watch } from 'vue';
    import InputBase from './InputBase.vue';
    import MaxInputAutoComplete from './MaxInputAutoComplete.vue';

    interface props {
        route: string;
        i?: string | undefined;
        data?: any;
        icon?: string | undefined;
        msg?: string | undefined;
        message?: string | undefined;
        iconMessage?: string | undefined;
        done?: string | boolean | null | undefined;
        error?: string | boolean | null | undefined;
        caution?: string | boolean | null | undefined;
        required?: boolean | null | undefined;
        optionValue?: string | undefined;
        optionLabel?: string | undefined;
        modelValue?: any;
        placeholder?: string | undefined;
        disabled?: boolean | undefined;
        dropdownMode?: string | undefined;
        multiple?: boolean | undefined;
        variant?: any;
        minLength?: number | undefined;
        delay?: number | undefined;
        forceSelection?: boolean | undefined;
    }

    const props = withDefaults(defineProps<props>(), {
        modelValue: '',
        done: undefined,
        data: {},
        required: false,
        caution: undefined,
        dropdownMode: 'blank',
        optionLabel: 'label',
        multiple: false,
        variant: null,
        minLength: 1,
        delay: 300,
        forceSelection: false
    });

    const temp_value: Ref = ref(props.modelValue);
    const list: Ref<any[]> = ref([]);

    watch(() => props.data, (newValue, oldValue) => {
        if ((isBlank(props.data) && isBlank(newValue)) || isEqual(newValue, oldValue)) return;

        const data_sent = keyExists(['files', 'file'], temp_value.value) ? { ...temp_value.value } : temp_value.value;
        if (keyExists(['files', 'file'], temp_value.value)) {
            data_sent['files'] = [];
            data_sent['file'] = [];
        }

        const applyList = (res: any) => {
            if (isBlank(res) || size(res) === 0) return;
            list.value = res;
        };

        getCachedApiIDB(props.route, { ...(props.data ?? {}), input_value: data_sent }, null, undefined, applyList).then(applyList);
    }, { deep: true, immediate: true });

    const filtered_values: Ref<any[]> = ref([]);
    const emit = defineEmits(['update:modelValue']);

    const temp_value_string = computed(() => {
        if (temp_value.value && typeof temp_value.value === 'string') return temp_value.value;
        if (temp_value.value && typeof temp_value.value === 'object') return temp_value.value?.value ?? temp_value.value?.label ?? temp_value.value?.id ?? temp_value.value[props.optionValue ?? 'value'] ?? '';
        return '';
    });

    const isDone = ref<string | boolean | null | undefined>(props.done ?? null);
    const isRequiredDone = computed(() => (props.required ? hasContent(temp_value_string.value) : null));

    const testIsDone = () => {
        if (props.done !== undefined) return props.done;
        if (isRequiredDone.value !== null) return isRequiredDone.value;
        if (props.caution !== undefined) return !props.caution;
        return null;
    };

    watch(temp_value, () => {
        search();
        isDone.value = testIsDone();
        if (temp_value.value && typeof temp_value.value !== 'string') emit('update:modelValue', temp_value.value);
    });

    const search = () => {
        if (hasContent(list.value as any)) filtered_values.value = (list.value as any[]).filter((item: any) => {
            const searchStr = (item.value ?? '') + (item.label ?? '') + (item.sub_label ?? '') + (item.name ?? '') + (item[props.optionValue ?? 'value'] ?? '');
            return toSearchableString(searchStr).toLowerCase().includes(toSearchableString(temp_value_string.value));
        });
    };
</script>

<style lang="scss">
.autocomplete-item-select-sub-label {
    font-size: 0.9em;
}
</style>
