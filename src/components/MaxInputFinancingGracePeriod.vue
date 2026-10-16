<template>
    <MaxDomainSelect v-bind="attrs" class="max-input-financing-grace-period" :options="resolvedOptions" :modelValue="props.modelValue" :label="props.label ?? 'Carência da primeira parcela'" :placeholder="props.placeholder" :filter="props.filter" :disabled="props.disabled" :required="props.required" :clearable="props.clearable" :showClear="props.showClear" :done="props.done" :error="props.error" :caution="props.caution" :noMessage="props.noMessage" @update:modelValue="(val: number | null) => emit('update:modelValue', val)" @change="(val: number | null) => emit('change', val)" @clear="() => emit('clear')">
        <template v-if="slots.value" #value="slotProps">
            <slot name="value" v-bind="slotProps" />
        </template>
        <template v-if="slots.option" #option="slotProps">
            <slot name="option" v-bind="slotProps" />
        </template>
    </MaxDomainSelect>
</template>

<script setup lang="ts">
    import { computed, useAttrs, useSlots } from 'vue';
    import MaxDomainSelect from './base/MaxDomainSelect.vue';
    import { FINANCING_GRACE_PERIOD_OPTIONS } from '../constants/financingInputs';
    import type { DomainSelectOption } from '../types/domainInputs';
    import type { MaxInputFinancingGracePeriodProps } from '../types/specializedInputs';

    defineOptions({
        inheritAttrs: false
    });

    const attrs = useAttrs();
    const slots = useSlots();

    const props = withDefaults(defineProps<MaxInputFinancingGracePeriodProps>(), {
        modelValue: null,
        options: undefined,
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
        'update:modelValue': [value: number | null];
        'change': [value: number | null];
        'clear': [];
    }>();

    const resolvedOptions = computed<readonly DomainSelectOption<number>[]>(() => {
        if (props.options !== undefined) return props.options;
        return FINANCING_GRACE_PERIOD_OPTIONS;
    });
</script>

<style lang="scss" scoped>
    .max-input-financing-grace-period {
        width: 100%;
    }
</style>
