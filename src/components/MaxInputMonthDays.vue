<template>
    <InputBase class="max-input-month-days" v-bind="forwardProps" :value="draftText" :done="props.done" :error="effectiveError" :caution="props.caution ?? validation.caution.value">
        <template #default="{ inputAttrs }">
            <input v-bind="inputAttrs" ref="inputRef" type="text" class="max-input-native max-month-days-input" :value="draftText" :placeholder="props.placeholder ?? 'Ex: 1, 15, 30'" :disabled="props.disabled" @input="onInput" @focus="onFocus" @blur="onBlur" />
        </template>
    </InputBase>
</template>

<script setup lang="ts">
    import { computed, ref, watch, useAttrs } from 'vue';
    import InputBase from './InputBase.vue';
    import { useInputValidation } from '../helpers/useInputValidation';
    import type { MaxInputMonthDaysProps } from '../types/semanticInputs';

    defineOptions({
        name: 'MaxInputMonthDays',
        inheritAttrs: false
    });

    const attrs = useAttrs();

    const props = withDefaults(defineProps<MaxInputMonthDaysProps>(), {
        modelValue: () => [],
        disabled: false,
        required: false,
        done: undefined,
        error: undefined,
        caution: undefined,
        noMessage: false,
        float: undefined,
        placeholder: undefined,
        invalidMessage: undefined,
        requiredMessage: undefined,
        suggestions: false
    });

    const emit = defineEmits<{
        'update:modelValue': [value: number[]];
        'focus': [event: FocusEvent];
        'blur': [event: FocusEvent];
    }>();

    const inputRef = ref<HTMLInputElement | null>(null);
    const isFocused = ref(false);
    const internalError = ref<string | null>(null);

    function formatDays(days: number[] | null | undefined): string {
        if (!Array.isArray(days) || days.length === 0) return '';
        return days.join(', ');
    }

    function parseDays(raw: string): { valid: boolean; value: number[]; error?: string } {
        const trimmed = raw.trim();
        if (trimmed === '') return { valid: true, value: [] };

        const parts = trimmed.split(',');
        const result: number[] = [];
        const seen = new Set<number>();

        for (let i = 0; i < parts.length; i++) {
            const part = parts[i].trim();
            if (part === '') return { valid: false, value: [], error: props.invalidMessage ?? 'Formato inválido: vírgula sem dia correspondente' };

            if (!/^\d+$/.test(part)) {
                if (part.includes('.') || part.includes(',')) return { valid: false, value: [], error: props.invalidMessage ?? 'Valores decimais não são permitidos' };
                return { valid: false, value: [], error: props.invalidMessage ?? `Valor '${part}' não é um dia válido` };
            }

            const day = Number(part);
            if (!Number.isSafeInteger(day) || day < 1 || day > 31) return { valid: false, value: [], error: props.invalidMessage ?? 'Dias devem ser entre 1 e 31' };

            if (!seen.has(day)) {
                seen.add(day);
                result.push(day);
            }
        }

        return { valid: true, value: result };
    }

    function validateInitial(days: number[] | null | undefined): string | null {
        if (!days || days.length === 0) return null;
        for (const d of days) if (typeof d !== 'number' || !Number.isSafeInteger(d) || d < 1 || d > 31) return props.invalidMessage ?? 'Dias devem ser entre 1 e 31';
        return null;
    }

    const draftText = ref<string>(formatDays(props.modelValue));
    internalError.value = validateInitial(props.modelValue);

    const validation = useInputValidation({
        value: computed(() => (internalError.value ? 'invalid' : props.modelValue)),
        required: computed(() => props.required),
        caution: computed(() => (props.caution === null ? undefined : props.caution)),
        done: computed(() => (typeof props.done === 'boolean' ? props.done : undefined)),
        validator: () => internalError.value === null && (!props.required || (Array.isArray(props.modelValue) && props.modelValue.length > 0)),
        invalidMessage: computed(() => internalError.value ?? props.invalidMessage ?? 'Valor inválido'),
        requiredMessage: computed(() => props.requiredMessage ?? 'Campo obrigatório')
    });

    const effectiveError = computed(() => {
        if (typeof props.error === 'string' && props.error !== '') return props.error;
        if (props.error === true) return true;
        if (internalError.value && (validation.dirty.value || validation.touched.value || (props.modelValue && props.modelValue.length > 0))) return internalError.value;
        return validation.error.value;
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
        suggestions: props.suggestions,
        autocomplete: (attrs as any).autocomplete
    }));

    const onInput = (event: Event) => {
        const raw = (event.target as HTMLInputElement).value;
        draftText.value = raw;
        validation.onInput(raw);

        const parsed = parseDays(raw);
        if (parsed.valid) {
            internalError.value = null;
            emit('update:modelValue', parsed.value);
        } else internalError.value = parsed.error ?? 'Valor inválido';
    };

    const onFocus = (event: FocusEvent) => {
        isFocused.value = true;
        emit('focus', event);
    };

    const onBlur = (event: FocusEvent) => {
        isFocused.value = false;
        if (!internalError.value) draftText.value = formatDays(props.modelValue);
        validation.onBlur();
        emit('blur', event);
    };

    watch(() => props.modelValue, (newVal) => {
        internalError.value = validateInitial(newVal);
        if (!isFocused.value) draftText.value = formatDays(newVal);
    }, { deep: true });
</script>

<style lang="scss" scoped>
.max-input-month-days {
    width: 100%;
}
</style>
