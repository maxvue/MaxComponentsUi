<template>
    <InputBase v-bind="props" class="input-base-cep-main-div" :value="temp_value" :done="done ?? undefined" :caution="caution" :error="error_msg ?? undefined" :icon-right="loading ? 'loading' : undefined">
        <input type="text" class="p-inputtext p-component" v-model="temp_value" v-maska="maskValue" placeholder="00000-000" />
    </InputBase>
</template>

/**
 * Componente de entrada para CEP (Código de Endereçamento Postal).
 * Possui máscara automática (00000-000) e validação integrada.
 */
<script setup lang="ts">
    import { formatCep, onlyNumbers, cepIsValid } from '@maxvue/max-use';
    import { computed, watch, useAttrs } from 'vue';
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
        }>(),
        { modelValue: '', loading: false, done: undefined, required: false, caution: undefined }
    );

    const emit = defineEmits(['update:modelValue', 'complete']);

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

    const isValidCep = computed(() => cepIsValid(temp_value_numbers.value));

    const done = computed(() => {
        if (props.done !== undefined) return props.done ?? null;
        if (temp_value_numbers.value.length > 0) return isValidCep.value;
        return null;
    });

    const caution = computed(() => {
        if (props.caution !== undefined) return props.caution;
        return done.value === false && temp_value_numbers.value.length > 0;
    });

    const error_msg = computed(() => {
        if (!caution.value) return null;
        const attrs_error_message = attrs.errMsg ?? attrs.error_message ?? attrs.error_msg ?? null;
        if (temp_value_numbers.value.length === 0 && props.required) return attrs_error_message ?? 'Campo obrigatório';
        return attrs_error_message ?? 'CEP inválido';
    });

    // Emite 'complete' quando o CEP se torna valido. A emissao de
    // 'update:modelValue' em si fica a cargo do useMirroredModel acima.
    watch(temp_value, () => {
        if (isValidCep.value) emit('complete', temp_value_numbers.value);
    });
</script>

<style lang="scss" scoped>
    input {
        grid-column: 2;
        position: relative;
    }
</style>
