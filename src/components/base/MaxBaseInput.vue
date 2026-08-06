<template>
    <input ref="inputRef" :class="inputClass" :value="modelValue" :disabled="disabled" :aria-invalid="invalid || undefined" @input="onInput" @blur="onBlur" @focus="onFocus" />
</template>

<script setup lang="ts">
    import { computed, ref } from 'vue';

    defineOptions({ inheritAttrs: true });

    const props = withDefaults(
        defineProps<{
            /** Valor atual do input */
            modelValue?: string | number | null;
            /** Tamanho do campo: reflete em p-inputtext-sm / p-inputtext-lg */
            size?: 'small' | 'large' | null;
            /** Estado de invalidade: reflete em p-invalid e aria-invalid */
            invalid?: boolean;
            /** Variante visual: reflete em p-variant-filled quando 'filled' */
            variant?: 'outlined' | 'filled' | null;
            /** Ocupa 100% da largura do container: reflete em p-inputtext-fluid */
            fluid?: boolean | null;
            /** Desabilita o campo */
            disabled?: boolean;
        }>(),
        { modelValue: '', size: null, invalid: false, variant: null, fluid: null, disabled: false }
    );

    const emit = defineEmits<{
        'update:modelValue': [value: string];
        input: [event: Event];
        blur: [event: FocusEvent];
        focus: [event: FocusEvent];
    }>();

    const inputRef = ref<HTMLInputElement | null>(null);

    const hasValue = computed(() => props.modelValue !== null && props.modelValue !== undefined && props.modelValue !== '');

    const inputClass = computed(() => ({
        'p-inputtext': true,
        'p-component': true,
        'p-filled': hasValue.value,
        'p-inputtext-sm': props.size === 'small',
        'p-inputtext-lg': props.size === 'large',
        'p-inputtext-fluid': props.fluid === true,
        'p-variant-filled': props.variant === 'filled',
        'p-invalid': props.invalid === true,
        'p-disabled': props.disabled === true
    }));

    const onInput = (event: Event) => {
        emit('update:modelValue', (event.target as HTMLInputElement).value);
        emit('input', event);
    };

    const onBlur = (event: FocusEvent) => emit('blur', event);
    const onFocus = (event: FocusEvent) => emit('focus', event);

    const unmaskedValue = ref('');

    defineExpose({ $el: inputRef, focus: () => inputRef.value?.focus(), unmaskedValue });
</script>
