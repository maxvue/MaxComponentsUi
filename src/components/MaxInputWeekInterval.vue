<template>
    <MaxInputSelect class="max-input-week-interval" v-bind="forwardProps" :modelValue="props.modelValue" :options="resolvedOptions" :error="effectiveError" :caution="props.caution" :done="typeof props.done === 'boolean' ? props.done : undefined" @update:modelValue="onUpdateModelValue" />
</template>

<script setup lang="ts">
    import { computed } from 'vue';
    import MaxInputSelect from './MaxInputSelect.vue';
    import type { MaxInputWeekIntervalProps, WeekIntervalOption } from '../types/semanticInputs';

    defineOptions({
        name: 'MaxInputWeekInterval',
        inheritAttrs: false
    });

    const defaultOptions: WeekIntervalOption[] = [
        { name: 'Toda semana', value: 1 },
        { name: 'A cada 2 semanas (quinzenal)', value: 2 },
        { name: 'A cada 3 semanas', value: 3 },
        { name: 'A cada 4 semanas', value: 4 }
    ];

    const props = withDefaults(defineProps<MaxInputWeekIntervalProps>(), {
        modelValue: null,
        options: undefined,
        disabled: false,
        required: false,
        clearable: true,
        done: undefined,
        error: undefined,
        caution: undefined,
        noMessage: false,
        float: undefined,
        placeholder: undefined,
        invalidMessage: undefined,
        requiredMessage: undefined
    });

    const emit = defineEmits<{
        'update:modelValue': [value: number | null];
    }>();

    const resolvedOptions = computed<WeekIntervalOption[]>(() => {
        if (Array.isArray(props.options) && props.options.length > 0) return props.options;
        return defaultOptions;
    });

    const limitsError = computed(() => {
        if (props.modelValue === null || props.modelValue === undefined) return null;
        if (typeof props.modelValue !== 'number' || !Number.isSafeInteger(props.modelValue) || props.modelValue < 1) return props.invalidMessage ?? 'Intervalo de semanas deve ser um número inteiro positivo';
        return null;
    });

    const effectiveError = computed(() => {
        if (typeof props.error === 'string' && props.error !== '') return props.error;
        if (props.error === true) return true;
        if (limitsError.value) return limitsError.value;
        return undefined;
    });

    const forwardProps = computed(() => ({
        id: props.id,
        label: props.label,
        disabled: props.disabled,
        required: props.required,
        float: props.float,
        msg: props.msg,
        message: props.message,
        iconMessage: props.iconMessage,
        icon: props.icon,
        i: props.i,
        noMessage: props.noMessage,
        placeholder: props.placeholder,
        clearable: props.clearable
    }));

    const onUpdateModelValue = (val: any) => {
        if (val === null || val === undefined || val === '') {
            emit('update:modelValue', null);
            return;
        }
        const num = Number(val);
        if (Number.isNaN(num) || !Number.isSafeInteger(num) || num < 1) return;
        emit('update:modelValue', num);
    };
</script>

<style lang="scss" scoped>
.max-input-week-interval {
    width: 100%;
}
</style>
