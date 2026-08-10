<template>
    <input ref="inputRef" :class="inputClass" :value="modelValue" :disabled="disabled" :aria-invalid="invalid || undefined" @input="onInput" @blur="onBlur" @focus="onFocus" />
</template>

<script setup lang="ts">;
    import { computed, ref } from 'vue';

    defineOptions({ inheritAttrs: true });

    const props = withDefaults(
        defineProps<{
            /** Valor atual do input */
            modelValue?: string | number | null;
            /** Tamanho do campo: reflete em max-input-sm / max-input-lg */
            size?: 'small' | 'large' | null;
            /** Estado de invalidade: reflete em max-input-invalid e aria-invalid */
            invalid?: boolean;
            /** Variante visual: reflete em max-input-filled quando 'filled' */
            variant?: 'outlined' | 'filled' | null;
            /** Ocupa 100% da largura do container: reflete em max-input-fluid */
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
        'max-input': true,
        'max-input-has-value': hasValue.value,
        'max-input-sm': props.size === 'small',
        'max-input-lg': props.size === 'large',
        'max-input-fluid': props.fluid === true,
        'max-input-filled': props.variant === 'filled',
        'max-input-invalid': props.invalid === true,
        'max-input-disabled': props.disabled === true
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

<style lang="scss" scoped>
    .max-input {
        width: 100%;
        padding: 0.5rem 0.75rem;
        border: 1px solid var(--background-400);
        border-radius: 6px;
        background: var(--background-100);
        color: var(--text-color);
        font-family: inherit;
        font-size: 1rem;
        transition: border-color 0.2s, box-shadow 0.2s, background-color 0.2s;

        &::placeholder {
            color: var(--text-color-secondary);
            opacity: 1;
        }

        &:enabled:hover {
            border-color: var(--max-primary-400);
        }

        &:enabled:focus {
            outline: 0 none;
            border-color: var(--max-primary-500);
            box-shadow: 0 0 0 2px var(--max-primary-200);
        }

        &:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            background: var(--background-200);
        }
    }

    .max-input-sm {
        padding: 0.35rem 0.55rem;
        font-size: 0.875rem;
    }

    .max-input-lg {
        padding: 0.65rem 0.95rem;
        font-size: 1.125rem;
    }

    .max-input-fluid {
        width: 100%;
    }

    .max-input-filled {
        background: var(--background-200);
    }

    .max-input-invalid {
        border-color: var(--red-500);

        &:enabled:focus {
            border-color: var(--red-500);
            box-shadow: 0 0 0 2px var(--red-200);
        }
    }
</style>
