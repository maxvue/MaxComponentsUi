<template>
    <InputBase
        v-bind="props"
        class="max-input-cep input-base-cep-main-div"
        :value="temp_value"
        :done="done ?? undefined"
        :caution="caution"
        :error="error_msg ?? undefined"
        :icon-right="loading ? 'line-md:loading-loop' : undefined"
    >
        <template #default="{ inputAttrs }">
            <input
                v-bind="inputAttrs"
                type="text"
                inputmode="numeric"
                class="max-input-native"
                v-model="temp_value"
                v-maska="maskValue"
                placeholder="00000-000"
                :disabled="props.disabled"
                @input="validation.onInput"
                @blur="validation.onBlur"
            />
        </template>
    </InputBase>
</template>

<script setup lang="ts">
    /**
     * Componente de entrada para CEP (Código de Endereçamento Postal).
     * Possui máscara automática (00000-000) e validação integrada.
     */
    import { formatCep, onlyNumbers, cepIsValid } from '@maxvue/max-use';
    import { computed, watch, useAttrs } from 'vue';
    import InputBase from './InputBase.vue';
    import { vMaska } from 'maska/vue';
    import { useMirroredModel } from '../helpers/useMirroredModel';
    import { useInputValidation } from '../helpers/useInputValidation';
    import type { InputBaseProps } from '../types';

    const attrs: any = useAttrs();

    const props = withDefaults(
        defineProps<InputBaseProps & {
            /** Valor do CEP (apenas números) */
            modelValue: any;
            /** Estado de carregamento */
            loading?: boolean;
            /** Mensagem ou estado booleano de erro */
            error?: string | boolean | null | undefined;
        }>(),
        { modelValue: '', loading: false, done: undefined, required: false, caution: undefined, error: undefined }
    );

    const emit = defineEmits<{
        'update:modelValue': [value: string];
        'complete': [value: string];
    }>();

    const temp_value = useMirroredModel(
        { get modelValue() { return formatCep(props.modelValue); } },
        emit as (event: 'update:modelValue', value: string) => void,
        {
            transform: (value: string) => onlyNumbers(value ?? ''),
            compare: (a: string, b: string) => onlyNumbers(a ?? '') === onlyNumbers(b ?? '')
        }
    );
    const temp_value_numbers = computed(() => onlyNumbers(temp_value.value ?? ''));
    const maskValue = computed(() => ({ tokens: { '#': { pattern: /[0-9]/ } }, mask: '#####-###' }));

    const isValidCep = (raw: any): boolean => {
        const numbers = onlyNumbers(raw ?? '');
        return cepIsValid(numbers);
    };

    const isComplete = (raw: any): boolean => {
        const numbers = onlyNumbers(raw ?? '');
        return numbers.length === 8;
    };

    const explicitErrorMsg = computed<string | null>(() =>
        (typeof props.error === 'string' ? props.error : null)
        ?? (props as any).errMsg
        ?? attrs.errMsg
        ?? (props as any).error_message
        ?? attrs.error_message
        ?? (props as any).error_msg
        ?? attrs.error_msg
        ?? null
    );

    const hasExplicitBooleanError = computed(() => props.error === true || attrs.error === true || attrs.error === '');

    const invalidMessage = computed(() => explicitErrorMsg.value ?? 'CEP inválido');

    const validation = useInputValidation({
        value: temp_value,
        required: computed(() => props.required),
        caution: computed(() => props.caution),
        done: computed(() => props.done),
        validator: isValidCep,
        isComplete,
        invalidMessage,
        requiredMessage: computed(() => explicitErrorMsg.value ?? 'Campo obrigatório')
    });

    const done = validation.done;
    const caution = computed(() => {
        if (props.caution !== undefined) return Boolean(props.caution);
        if (hasExplicitBooleanError.value || explicitErrorMsg.value) return true;
        if (temp_value_numbers.value.length > 0 && !isValidCep(temp_value.value)) return true;
        return validation.caution.value;
    });
    const error_msg = computed(() => {
        if (explicitErrorMsg.value) return explicitErrorMsg.value;
        if (hasExplicitBooleanError.value) return true;
        if (temp_value_numbers.value.length > 0 && !isValidCep(temp_value.value)) return invalidMessage.value;
        return validation.error.value;
    });

    watch(temp_value, () => {
        if (isValidCep(temp_value.value)) emit('complete', temp_value_numbers.value);
    });

    defineExpose({
        temp_value,
        maskValue,
        done,
        caution,
        error_msg,
        validation,
        submit: validation.submit,
        reset: validation.reset
    });
</script>
