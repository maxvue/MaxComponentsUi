<template>
    <InputBase v-bind="props" :error="error_msg" :caution="caution" :done="done">
        <input ref="el" type="text" class="p-inputtext p-component" :value="masked_value" v-maska="maskValue" @input="onUserInput" :style="`letter-spacing: 2.5px;`" />
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
    import { vMaska } from 'maska/vue';
    import { useMirroredModel } from '../helpers/useMirroredModel';
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

    // Com o <input> nativo que substituiu o InputText do PrimeVue, o v-model do Vue sempre
    // recebe o valor MASCARADO: o handler nativo lê event.target.value depois que a maska já
    // reescreveu o DOM. O contrato deste componente, porém, é que `temp_value` guarde apenas
    // dígitos (ver comentário do useMirroredModel acima). Por isso a exibição passa por
    // `masked_value` e `temp_value` é derivado dele — a alternativa, escrever direto pelo
    // argumento da diretiva (`v-maska:temp_value.unmasked`, como em MaxInputCreditCard.vue),
    // exigiria `defineExpose` para a maska alcançar o ref, e um defineExpose restritivo
    // quebraria os testes que leem temp_value/maskValue/done/caution via wrapper.vm.
    const masked_value = ref('');

    // Digitação: a maska já reescreveu o DOM quando este handler roda, então `el.value` é o
    // texto mascarado. `temp_value` recebe só os dígitos, preservando o contrato. A escrita é
    // feita AQUI, e não num watch sobre `masked_value`, de propósito: um par de watches
    // mutuamente referentes briga com os guards do useMirroredModel e faz a emissão de
    // update:modelValue ser engolida ao reduzir o documento (regressão coberta pelo teste
    // "não fica congelado").
    const onUserInput = (event: Event) => {
        const el = event.target as HTMLInputElement;
        masked_value.value = el.value;
        temp_value.value = onlyNumbers(el.value);
    };

    // Valor vindo de fora (prop) em vez da digitação: alimenta a exibição. O guard por dígitos
    // preserva a formatação da maska quando o valor externo é equivalente ao já exibido.
    watch(temp_value, (value) => {
        if (onlyNumbers(masked_value.value) !== onlyNumbers(value ?? '')) masked_value.value = value ?? '';
    }, { immediate: true });

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
        const attrs_error_message = attrs.errMsg ?? attrs.error_message ?? attrs.error_msg ?? null;
        const len = onlyNumbers(temp_value.value).length;

        if (len === 0) return props.required ? (attrs_error_message ?? 'Campo obrigatório') : false;

        if (!done.value) {
            if (type_mask.value === 'cpf') return attrs_error_message ?? 'CPF inválido';
            if (type_mask.value === 'cnpj') return attrs_error_message ?? 'CNPJ inválido';
            return attrs_error_message ?? 'Documento inválido';
        }
        return false;
    });

    // Emite 'complete' quando o documento atinge 11 (CPF) ou 14 (CNPJ)
    // digitos e passa na validacao. A emissao de 'update:modelValue' em si
    // fica a cargo do useMirroredModel acima.
    watch(temp_value, () => {
        const only_numbers: string = onlyNumbers(temp_value.value);
        if ((only_numbers.length === 11 || only_numbers.length === 14) && done.value) emit('complete', only_numbers);
    }, { immediate: true });
</script>