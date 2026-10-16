<template>
    <MaxInputText v-bind="forwardedAttrs" class="max-input-consumer-unit" :modelValue="props.modelValue ?? ''" :label="resolvedLabel" :placeholder="props.placeholder" :disabled="props.disabled" :required="props.required" :done="props.done" :error="resolvedError ?? undefined" :caution="props.caution ?? undefined" :noMessage="props.noMessage" @update:modelValue="onUpdateValue" />
</template>

<script setup lang="ts">
    import { computed, useAttrs } from 'vue';
    import MaxInputText from './MaxInputText.vue';
    import type { MaxInputConsumerUnitProps } from '../types/specializedInputs';

    defineOptions({
        inheritAttrs: false
    });

    const attrs = useAttrs();

    const props = withDefaults(defineProps<MaxInputConsumerUnitProps>(), {
        modelValue: null,
        label: undefined,
        placeholder: undefined,
        maxLength: 50,
        disabled: false,
        required: false,
        done: undefined,
        error: undefined,
        caution: undefined,
        noMessage: false
    });

    const emit = defineEmits<{
        'update:modelValue': [value: string | null];
        'change': [value: string | null];
    }>();

    const resolvedLabel = computed<string>(() => {
        if (props.label !== undefined) return props.label;
        return 'Unidade consumidora (UC)';
    });

    const resolvedError = computed<string | boolean | null | undefined>(() => {
        if (props.error !== undefined && props.error !== null) return props.error;
        if (props.modelValue && props.modelValue.length > props.maxLength) return `Limite de ${props.maxLength} caracteres excedido`;

        if (props.required && (props.modelValue === null || props.modelValue === '')) return 'Campo obrigatório';

        return undefined;
    });

    const forwardedAttrs = computed(() => {
        const { class: _cls, ...rest } = attrs;
        return rest;
    });

    const onUpdateValue = (val: any) => {
        const strVal = (val === null || val === undefined || val === '') ? null : String(val);
        if (strVal === props.modelValue) return;
        emit('update:modelValue', strVal);
        emit('change', strVal);
    };
</script>

<style lang="scss" scoped>
    .max-input-consumer-unit {
        width: 100%;
    }
</style>
