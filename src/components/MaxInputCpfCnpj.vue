<template>
    <InputBase
        class="max-input-cpf-cnpj"
        v-bind="props"
        :error="error_msg ?? undefined"
        :caution="caution"
        :done="done ?? undefined"
    >
        <template #default="{ inputAttrs }">
            <input
                v-bind="inputAttrs"
                type="text"
                inputmode="numeric"
                class="max-input-native max-cpf-cnpj-input"
                :value="masked_value"
                v-maska="maskValue"
                :disabled="props.disabled"
                @input="onUserInput"
                @blur="validation.onBlur"
            />
        </template>
    </InputBase>
</template>

<script setup lang="ts">
    /**
     * Componente de entrada para CPF ou CNPJ.
     * Detecta automaticamente o tipo de documento pelo tamanho ou pode ser fixado via props.
     * Possui máscara dinâmica e validação de dígito verificador.
     */
    import { cnpjIsValid, cpfIsValid, onlyNumbers } from '@maxvue/max-use';
    import { ref, computed, watch, useAttrs } from 'vue';
    import InputBase from './InputBase.vue';
    import { vMaska } from 'maska/vue';
    import { useMirroredModel } from '../helpers/useMirroredModel';
    import { useInputValidation } from '../helpers/useInputValidation';
    import type { InputBaseProps } from '../types';

    const attrs: any = useAttrs();

    const props = withDefaults(
        defineProps<InputBaseProps & {
            /** Valor do documento (apenas números) */
            modelValue: string | null;
            /** Força a máscara e validação de CPF */
            cpf?: boolean;
            /** Força a máscara e validação de CNPJ */
            cnpj?: boolean;
            /** Mensagem ou estado booleano de erro */
            error?: string | boolean | null | undefined;
        }>(),
        { modelValue: '', done: undefined, required: false, caution: undefined, error: undefined }
    );

    const emit = defineEmits<{
        'update:modelValue': [value: string];
        'complete': [value: string];
    }>();

    const temp_value = useMirroredModel(
        { get modelValue() { return props.modelValue ?? ''; } },
        emit as (event: 'update:modelValue', value: string) => void,
        { transform: (value: string) => onlyNumbers(value), immediate: true }
    );

    const masked_value = ref('');

    const onUserInput = (event: Event) => {
        const el = event.target as HTMLInputElement;
        if (masked_value.value !== el.value) masked_value.value = el.value;
        const numbers = onlyNumbers(el.value);
        if (temp_value.value !== numbers) temp_value.value = numbers;
        validation.onInput();
    };

    watch(temp_value, (value) => {
        if (onlyNumbers(masked_value.value) !== onlyNumbers(value ?? '')) masked_value.value = value ?? '';
    }, { immediate: true });

    const type_mask = computed<'cpf' | 'cnpj'>(() => {
        if (props.cpf) return 'cpf';
        if (props.cnpj) return 'cnpj';
        const only_numbers = onlyNumbers(temp_value.value ?? '');
        return only_numbers.length > 11 ? 'cnpj' : 'cpf';
    });

    // CALCULA A MÁSCARA DO INPUT
    const maskValue = computed(() => {
        if (props.cpf) return {
            tokens: { '#': { pattern: /[0-9]/ } },
            mask: '###.###.###-##'
        };

        if (props.cnpj) return {
            tokens: { '#': { pattern: /[0-9]/ } },
            mask: '##.###.###/####-##'
        };

        return {
            tokens: { '#': { pattern: /[0-9]/ } },
            mask: ['###.###.###-##', '##.###.###/####-##']
        };
    });

    const isComplete = (val: any) => {
        const only_numbers = onlyNumbers(val ?? '');
        return (type_mask.value === 'cpf' && only_numbers.length === 11) ||
            (type_mask.value === 'cnpj' && only_numbers.length === 14);
    };

    const isDocumentValid = (raw: any): boolean => {
        const only_numbers = onlyNumbers(raw ?? '');
        if (only_numbers.length === 0) return false;
        if (props.cpf) return only_numbers.length === 11 && cpfIsValid(only_numbers);
        if (props.cnpj) return only_numbers.length === 14 && cnpjIsValid(only_numbers);
        if (only_numbers.length === 11) return cpfIsValid(only_numbers);
        if (only_numbers.length === 14) return cnpjIsValid(only_numbers);
        return false;
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

    const invalidMessage = computed(() => {
        if (explicitErrorMsg.value) return explicitErrorMsg.value;
        if (type_mask.value === 'cpf') return 'CPF inválido';
        if (type_mask.value === 'cnpj') return 'CNPJ inválido';
        return 'Documento inválido';
    });

    const validation = useInputValidation({
        value: temp_value,
        required: computed(() => props.required),
        caution: computed(() => props.caution),
        done: computed(() => props.done),
        validator: isDocumentValid,
        isComplete,
        invalidMessage,
        requiredMessage: computed(() => explicitErrorMsg.value ?? 'Campo obrigatório')
    });

    const done = validation.done;
    const caution = computed(() => hasExplicitBooleanError.value || (explicitErrorMsg.value ? true : validation.caution.value));
    const error_msg = computed(() => {
        if (explicitErrorMsg.value) return explicitErrorMsg.value;
        if (hasExplicitBooleanError.value) return true;
        return validation.error.value;
    });

    watch(temp_value, () => {
        const only_numbers: string = onlyNumbers(temp_value.value);
        if ((only_numbers.length === 11 || only_numbers.length === 14) && done.value) emit('complete', only_numbers);
    }, { immediate: true });

    defineExpose({
        temp_value,
        masked_value,
        maskValue,
        done,
        caution,
        error_msg,
        validation,
        submit: validation.submit,
        reset: validation.reset
    });
</script>

<style lang="scss" scoped>
.max-input-cpf-cnpj {
    :deep(.max-cpf-cnpj-input) {
        letter-spacing: 2.5px;
    }
}
</style>