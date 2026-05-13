<template>
    <InputBase v-bind="props" :error="error_msg" :caution="caution" :done="isDone">
        <InputText ref="el" type="text" v-model="temp_value" v-maska="maskValue" autoClear="false" :style="`letter-spacing: 2px; padding-left: ${space_letters + 8}px`" @blur="checkDone()" />
    </InputBase>
</template>

/**
 * Componente de entrada para CPF ou CNPJ.
 * Detecta automaticamente o tipo de documento pelo tamanho ou pode ser fixado via props.
 * Possui máscara dinâmica e validação de dígito verificador.
 */
<script setup lang="ts">
    import { onlyNumbers } from '@maxvue/max-use';
    import { watchDebounced } from '@maxvue/max-use';
    import type { Ref } from 'vue';
    import { useElementSize } from '@maxvue/max-use';
    import { useTemplateRef, ref, computed, watch, useAttrs } from 'vue';
    import InputBase from './InputBase.vue';
    import InputText from 'primevue/inputtext';
    import { vMaska } from 'maska/vue';
    import { isCpf as isCPF, isCnpj as isCNPJ } from '@maxvue/max-use';

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

    const temp_value = ref(props.modelValue ?? '');
    const isDone: Ref = ref(props.done ?? null);

    const type_mask: Ref = ref(null);

    // CALCULA LARGURA DO INPUT E ESPAÇAMENTO DAS LETRAS
    const el = useTemplateRef<any>('el');
    const { width } = useElementSize(el as any);
    const space_letters = computed(() => (width.value ? (width.value - 100) / 30 : 0));

    const checkDone = () => {
        isDone.value = done.value;
    };

    // ATUALIZA O VALOR DO INPUT COM O VALOR DO MODEL E VICE-VERSA
    watchDebounced( temp_value, () => {
        const only_numbers: string = onlyNumbers(temp_value.value);
        if (only_numbers.length === 11 || only_numbers.length === 14) {
            emit('update:modelValue', onlyNumbers(temp_value.value));
            if (done.value) emit('complete', onlyNumbers(temp_value.value));

        }
    }, { debounce: 500 });

    watch(() => props.modelValue,() => {
        if (props.modelValue !== temp_value.value) temp_value.value = onlyNumbers(props.modelValue ?? '');
    });

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
        if (props.cpf) return isCPF(temp_value.value);
        if (props.cnpj) return isCNPJ(temp_value.value);
        return isCPF(temp_value.value) || isCNPJ(temp_value.value);
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
</script>