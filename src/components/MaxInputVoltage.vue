<template>
    <MaxInputSelect v-if="hasOptions" class="max-input-voltage max-input-voltage-select" v-bind="selectForwardProps" :modelValue="props.modelValue" :options="props.options" :error="effectiveError" :caution="props.caution" :done="typeof props.done === 'boolean' ? props.done : undefined" @update:modelValue="onSelectUpdate" />
    <MaxBaseQuantity v-else class="max-input-voltage max-input-voltage-numeric" v-bind="{ ...props, ...attrs }" :min="resolvedMin" suffix="V" :error="effectiveError" @update:modelValue="onNumericUpdate" @focus="onFocus" @blur="onBlur">
        <template #prefix><slot name="prefix" /></template>
        <template #suffix><slot name="suffix" /></template>
    </MaxBaseQuantity>
</template>

<script setup lang="ts">
    import { computed, useAttrs } from 'vue';
    import MaxBaseQuantity from './base/MaxBaseQuantity.vue';
    import MaxInputSelect from './MaxInputSelect.vue';
    import type { MaxInputVoltageProps } from '../types/semanticInputs';

    defineOptions({
        name: 'MaxInputVoltage',
        inheritAttrs: false
    });

    const attrs = useAttrs();

    const props = withDefaults(defineProps<MaxInputVoltageProps>(), {
        modelValue: null,
        min: 0,
        minFractionDigits: 0,
        maxFractionDigits: 2,
        options: undefined,
        disabled: false,
        required: false,
        textRight: false,
        textCenter: false
    });

    const emit = defineEmits<{
        'update:modelValue': [value: number | null];
        'focus': [event: FocusEvent];
        'blur': [event: FocusEvent];
    }>();

    defineSlots<{
        prefix?(): any;
        suffix?(): any;
    }>();

    const hasOptions = computed(() => Array.isArray(props.options) && props.options.length > 0);
    const resolvedMin = computed(() => props.min ?? 0);

    const limitsError = computed(() => {
        if (props.modelValue === null || props.modelValue === undefined) return null;
        if (typeof props.modelValue !== 'number' || !Number.isFinite(props.modelValue)) return 'Número inválido';
        if (resolvedMin.value !== undefined && props.modelValue < resolvedMin.value) return `Valor mínimo permitido é ${resolvedMin.value}`;
        if (props.max !== undefined && props.modelValue > props.max) return `Valor máximo permitido é ${props.max}`;
        return null;
    });

    const effectiveError = computed(() => {
        if (typeof props.error === 'string' && props.error !== '') return props.error;
        if (props.error === true) return true;
        if (limitsError.value) return limitsError.value;
        return undefined;
    });

    const selectForwardProps = computed(() => ({
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
        clearable: true
    }));

    const onNumericUpdate = (val: number | null) => {
        emit('update:modelValue', val);
    };

    const onSelectUpdate = (val: any) => {
        if (val === null || val === undefined || val === '') {
            emit('update:modelValue', null);
            return;
        }
        const num = Number(val);
        if (Number.isNaN(num)) return;
        if (resolvedMin.value !== undefined && num < resolvedMin.value) return;
        if (props.max !== undefined && num > props.max) return;
        emit('update:modelValue', num);
    };

    const onFocus = (event: FocusEvent) => {
        emit('focus', event);
    };

    const onBlur = (event: FocusEvent) => {
        emit('blur', event);
    };
</script>

<style lang="scss" scoped>
.max-input-voltage {
    width: 100%;
}
</style>
