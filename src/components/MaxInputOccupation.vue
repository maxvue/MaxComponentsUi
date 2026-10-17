<template>
    <MaxDomainSelect v-bind="attrs" class="max-input-occupation" :options="resolvedOptions" :modelValue="props.modelValue" :label="props.label ?? 'Ocupação'" :placeholder="props.placeholder" :filter="props.filter" :disabled="props.disabled" :required="props.required" :clearable="props.clearable" :showClear="props.showClear" :done="props.done" :error="props.error" :caution="props.caution" :noMessage="props.noMessage" @update:modelValue="(val: string | null) => emit('update:modelValue', val)" @change="(val: string | null) => emit('change', val)" @clear="() => emit('clear')">
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
    import { OCCUPATION_OPTIONS } from '../constants/financingInputs';
    import type { DomainSelectOption } from '../types/domainInputs';
    import type { MaxInputOccupationProps } from '../types/specializedInputs';

    defineOptions({
        inheritAttrs: false
    });

    const attrs = useAttrs();
    const slots = useSlots();

    const props = withDefaults(defineProps<MaxInputOccupationProps>(), {
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
        'update:modelValue': [value: string | null];
        'change': [value: string | null];
        'clear': [];
    }>();

    const resolvedOptions = computed<readonly DomainSelectOption<string>[]>(() => {
        if (props.options !== undefined) return props.options;
        return OCCUPATION_OPTIONS;
    });
</script>

<style lang="scss" scoped>
    .max-input-occupation {
        width: 100%;
    }
</style>
