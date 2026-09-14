<template>
    <InputBase v-bind="props" class="max-input-cep input-base-cep-main-div" :value="temp_value" :done="done ?? undefined" :caution="caution" :error="resolvedError" :icon-right="loading ? 'line-md:loading-loop' : undefined">
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
                @blur="onBlur"
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

    const hasBeenTouched = ref(false);
    const isSubmitted = ref(false);

    const onBlur = () => {
        hasBeenTouched.value = true;
    };

    const submit = (): boolean => {
        isSubmitted.value = true;
        hasBeenTouched.value = true;
        return done.value === true;
    };

    const reset = (): void => {
        hasBeenTouched.value = false;
        isSubmitted.value = false;
    };

    watch(
        () => props.modelValue,
        (newVal) => {
            const numbers = onlyNumbers(newVal ?? '');
            if (!numbers) reset();

        }
    );

    const isValidCep = computed(() => cepIsValid(temp_value_numbers.value));

    const done = computed(() => {
        if (props.done !== undefined) return props.done ?? null;
        if (temp_value_numbers.value.length > 0) return isValidCep.value;
        return null;
    });

    const caution = computed(() => {
        if (props.caution !== undefined) return Boolean(props.caution);
        if (temp_value_numbers.value.length === 0) return Boolean(props.required && (hasBeenTouched.value || isSubmitted.value));

        return done.value === false;
    });

    const error_msg = computed(() => {
        if (!caution.value) return null;
        const attrs_error_message = (props as any).errMsg
            ?? attrs.errMsg
            ?? (props as any).error_message
            ?? attrs.error_message
            ?? (props as any).error_msg
            ?? attrs.error_msg
            ?? null;
        if (temp_value_numbers.value.length === 0 && props.required) return attrs_error_message ?? 'Campo obrigatório';
        if (temp_value_numbers.value.length > 0 && !isValidCep.value) return attrs_error_message ?? 'CEP inválido';
        return attrs_error_message;
    });

    const resolvedError = computed<string | boolean | null | undefined>(() => {
        if (props.error !== undefined) {
            if (props.error === false || props.error === null) return undefined;
            if (props.error === true) return true;
            if (typeof props.error === 'string') return props.error;
        }

        return error_msg.value ?? undefined;
    });

    // Emite 'complete' quando o CEP se torna valido. A emissao de
    // 'update:modelValue' em si fica a cargo do useMirroredModel acima.
    watch(temp_value, () => {
        if (isValidCep.value) emit('complete', temp_value_numbers.value);
    });

    defineExpose({
        temp_value,
        temp_value_numbers,
        done,
        caution,
        error_msg,
        resolvedError,
        maskValue,
        onBlur,
        submit,
        reset
    });
</script>
