<template>
    <InputBase v-bind="props" :error="error_msg" :caution="caution" :done="done">
        <InputText ref="el" type="text" v-model="temp_value" v-maska="maskValue" autoClear="false" :style="`letter-spacing: 2.5px;`" />
    </InputBase>
</template>

/**
 * Componente de entrada para CPF ou CNPJ.
 * Detecta automaticamente o tipo de documento pelo tamanho ou pode ser fixado via props.
 * Possui máscara dinâmica e validação de dígito verificador.
 */
<script setup lang="ts">
    import { cnpjIsValid, cpfCnpjIsValid, cpfIsValid, onlyNumbers } from '@maxvue/max-use';
    import type { Ref } from 'vue';
    import { ref, computed, watch, useAttrs } from 'vue';
    import InputBase from './InputBase.vue';
    import InputText from 'primevue/inputtext';
    import { vMaska } from 'maska/vue';
    import { useMirroredModel } from '../helpers/useMirroredModel';

    const attrs: any = useAttrs();

    const props = withDefaults(
        defineProps<{
            /** Valor do documento (apenas números) */
            modelValue: string | null;
            /** Força a máscara e validação de CPF */
            cpf?: boolean;
            /** Força a máscara e validação de CNPJ */
            cnpj?: boolean;
            /** Ícone opcional */
            icon?: string | undefined;
            /** Alias para o ícone */
            i?: string | undefined;
            /** Desabilita o campo */
            disabled?: boolean | undefined;
            /** Estilo FloatLabel */
            float?: boolean | undefined;
            /** Mensagem de feedback (alias) */
            msg?: string | undefined;
            /** Mensagem de feedback */
            message?: string | undefined;
            /** Ícone da mensagem de feedback */
            iconMessage?: string | undefined;
            /** Rótulo do campo */
            label?: string | undefined;
            /** Estado de conclusão/validação manual */
            done?: boolean | undefined;
            /** Mensagem ou estado de erro */
            error?: string | boolean | undefined;
            /** Valor para comparação (opcional) */
            targetValue?: string;
            /** Mensagem ou estado de atenção */
            caution?: string | boolean | undefined;
            /** Define se o campo é obrigatório */
            required?: boolean;
        }>(),
        { modelValue: '', done: undefined, required: false, caution: undefined }
    );

    const emit = defineEmits(['update:modelValue', 'complete']);

    // O modelValue e sempre normalizado para "so digitos" antes de emitir e
    // ao receber um valor externo, entao a igualdade estrita (default) ja
    // e o guard correto aqui — nao ha formatacao local a preservar. Usa
    // `immediate: true` para preservar o comportamento corrigido na Etapa 6
    // (achado 10): o watch de emissao sempre rodou desde o mount, garantindo
    // que um `modelValue` inicial ja normalizado seja reemitido/consistente
    // e que a logica de `complete` (abaixo) tambem avalie o valor inicial.
    const temp_value = useMirroredModel(
        // Getter preserva a reatividade a props.modelValue (que useMirroredModel
        // le via `props.modelValue` internamente) e normaliza `null` para ''
        // como o codigo anterior fazia com `props.modelValue ?? ''`.
        { get modelValue() { return props.modelValue ?? ''; } },
        emit as (event: 'update:modelValue', value: string) => void,
        { transform: (value: string) => onlyNumbers(value), immediate: true }
    );

    const type_mask: Ref = ref(null);

    // CALCULA A MÁSCARA DO INPUT
    const maskValue = computed(() => {
        let mask_string: string = '@';

        if (props.cpf) {
            mask_string = '###.###.###-##@';
            type_mask.value = 'cpf';
        } else if (props.cnpj) {
            mask_string = '##.###.###/####-##';
            type_mask.value = 'cnpj';
        } else {
            const only_numbers: string = onlyNumbers(temp_value.value);
            if (only_numbers.length > 11) {
                mask_string = '##.###.###/####-##';
                type_mask.value = 'cnpj';
            } else {
                mask_string = '###.###.###-##@';
                type_mask.value = 'cpf';
            }
        }

        return {
            tokens: { '#': { pattern: /[0-9]/ }, '@': { pattern: /[0-9]/, optional: true, recursive: true } },
            mask: mask_string
        };
    });

    const done = computed(() => {
        if (props.done !== undefined) return props.done;
        if (props.cpf) return cpfIsValid(temp_value.value);
        if (props.cnpj) return cnpjIsValid(temp_value.value);
        return cpfCnpjIsValid(temp_value.value);
    });

    const caution = computed(() => {
        if (props.caution !== undefined) return props.caution;
        const only_numbers: string = onlyNumbers(temp_value.value);
        if (only_numbers.length === 0) return false;
        return !done.value;
    });

    const error_msg = computed(() => {
        if (!caution.value) return null;
        const attrs_error_message = attrs.errMsg ?? attrs.error_message ?? attrs.error_msg ?? null;
        if (onlyNumbers(temp_value.value).length === 0 && props.required) return attrs_error_message ?? 'Campo obrigatório';
        if (type_mask.value === 'cpf') return attrs_error_message ?? 'CPF inválido';
        if (type_mask.value === 'cnpj') return attrs_error_message ?? 'CNPJ inválido';
        return attrs_error_message ?? 'Documento inválido';
    });

    // Emite 'complete' quando o documento atinge 11 (CPF) ou 14 (CNPJ)
    // digitos e passa na validacao. A emissao de 'update:modelValue' em si
    // fica a cargo do useMirroredModel acima.
    watch(temp_value, () => {
        const only_numbers: string = onlyNumbers(temp_value.value);
        if ((only_numbers.length === 11 || only_numbers.length === 14) && done.value) emit('complete', only_numbers);
    }, { immediate: true });
</script>