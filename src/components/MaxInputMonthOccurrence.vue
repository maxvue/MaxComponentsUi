<template>
    <MaxDomainSelect v-bind="attrs" class="max-input-month-occurrence" :options="MONTH_OCCURRENCE_OPTIONS" :modelValue="props.modelValue" :label="props.label ?? 'Ocorrência no mês'" :placeholder="props.placeholder" :filter="props.filter" :disabled="props.disabled" :required="props.required" :clearable="props.clearable" :showClear="props.showClear" :done="props.done" :error="props.error" :caution="props.caution" :noMessage="props.noMessage" @update:modelValue="(val: MonthOccurrenceValue | null) => emit('update:modelValue', val)" @change="(val: MonthOccurrenceValue | null) => emit('change', val)" @clear="() => emit('clear')">
        <template v-if="slots.value" #value="slotProps">
            <slot name="value" v-bind="slotProps" />
        </template>
        <template v-if="slots.option" #option="slotProps">
            <slot name="option" v-bind="slotProps" />
        </template>
    </MaxDomainSelect>
</template>

<script setup lang="ts">
    import { useAttrs, useSlots } from 'vue';
    import MaxDomainSelect from './base/MaxDomainSelect.vue';
    import { MONTH_OCCURRENCE_OPTIONS } from '../constants/editorialInputs';
    import type { MaxInputMonthOccurrenceProps, MonthOccurrenceValue } from '../types/domainInputs';

    defineOptions({
        inheritAttrs: false
    });

    const attrs = useAttrs();
    const slots = useSlots();

    const props = withDefaults(defineProps<MaxInputMonthOccurrenceProps>(), {
        modelValue: null,
        label: undefined,
        placeholder: undefined,
        filter: false,
        disabled: false,
        required: false,
        clearable: false,
        showClear: false,
        done: undefined,
        error: undefined,
        caution: undefined,
        noMessage: false
    });

    const emit = defineEmits<{
        'update:modelValue': [value: MonthOccurrenceValue | null];
        'change': [value: MonthOccurrenceValue | null];
        'clear': [];
    }>();
</script>

<style lang="scss" scoped>
    .max-input-month-occurrence {
        width: 100%;
    }
</style>
