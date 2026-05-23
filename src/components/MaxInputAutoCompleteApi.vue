<template>
    <InputBase v-bind="props" :done="isDone" :error="props.error" :caution="props.caution">
        <AutoComplete optionLabel="label" :suggestions="filtered_values" @complete="search" :virtualScrollerOptions="{ itemSize: 40 }" v-model="temp_value" :placeholder="props.placeholder ?? 'SELECIONE'" @blur="isDone = testIsDone()" >
            <template #option="slotProps">
                <div class="autocomplete-item-select">
                    <div class="autocomplete-item-select-label">{{ slotProps.option.model }}</div>
                    <div class="autocomplete-item-select-sub-label">{{ slotProps.option.sub_label }}</div>
                </div>
            </template>
            <template #content></template>
        </AutoComplete>
    </InputBase>
</template>

<script setup lang="ts">
    /**
     * Componente Autocomplete que busca sugestões de uma API.
     * Integra-se com as rotas do backend Max para busca dinâmica.
     */
    import { hasContent, toSearchableString, getCachedApi, toArray, isBlank, size } from '@maxvue/max-use';
    import type { Ref } from 'vue';
    import { ref, computed, watch } from 'vue';
    import InputBase from './InputBase.vue';
    import AutoComplete from 'primevue/autocomplete';
    import type { AutoCompleteProps } from 'primevue/autocomplete';

    interface props extends AutoCompleteProps {
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
    }

    const props = withDefaults( defineProps<props>(),{
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

    watch( () => props.data, (value) => {
        if (hasContent(value)) {
            console.log('changed here');

            getCachedApi(props.route, { ...(props.data ?? {}), input_value: temp_value.value }).then((res: any) => {
                console.log('Is Done here');
                if (isBlank(res) || size(res) === 0) return;
                list.value = res;
            });
            return;
        }
    }, { deep: true, immediate: true } );

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
        console.log(temp_value.value);
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
