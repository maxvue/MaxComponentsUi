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
    import { ref, computed, watch, useAttrs } from 'vue';
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
        }>(),
        { modelValue: '', loading: false, done: undefined, required: false, caution: undefined }
    );

    const emit = defineEmits<{
        'update:modelValue': [value: string];
        'complete': [value: string];
    }>();

    // temp_value guarda o valor FORMATADO (ex.: '01001-000'), enquanto
    // props.modelValue e o emitido/recebido em formato cru (so digitos).
    // Por isso: `transform` desfaz a formatacao antes de emitir, e `compare`
    // normaliza ambos os lados para digitos antes de decidir se reatribui o
    // ref local — evita que a formatacao local seja descartada quando o
    // valor externo "equivalente" (mesmos digitos) volta via prop, o mesmo
    // guard que a Etapa 7c precisou preservar aqui manualmente.
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

    const explicitError = computed<string | null>(() =>
        (typeof props.error === 'string' ? props.error : null)
        ?? (props as any).errMsg
        ?? attrs.errMsg
        ?? (props as any).error_message
        ?? attrs.error_message
        ?? (props as any).error_msg
        ?? attrs.error_msg
        ?? null
    );

    const invalidMessage = computed(() => explicitError.value ?? 'CEP inválido');

    const validation = useInputValidation({
        value: temp_value,
        required: computed(() => props.required),
        caution: computed(() => props.caution),
        done: computed(() => props.done),
        validator: isValidCep,
        isComplete,
        invalidMessage,
        requiredMessage: computed(() => explicitError.value ?? 'Campo obrigatório')
    });

    const done = validation.done;
    const caution = computed(() => (explicitError.value ? true : validation.caution.value));
    const error_msg = computed(() => explicitError.value ?? validation.error.value);

    // Emite 'complete' quando o CEP se torna valido. A emissao de
    // 'update:modelValue' em si fica a cargo do useMirroredModel acima.
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
