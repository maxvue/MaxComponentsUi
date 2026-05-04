<template>
    <InputBase v-bind="props" class="input-base-phone-mail-main-div" :value="temp_value" :done="done ?? undefined" :caution="caution" :error="error_msg ?? undefined" :icon-right="loading ? 'loading' : undefined">
        <InputText type="text" v-model="temp_value" v-maska="maskValue" autoClear="false" slotChar=" " placeholder="00 . 000 - 000" @blur="checkDone()" />
    </InputBase>
</template>

/**
 * Componente de entrada para CEP (Código de Endereçamento Postal).
 * Possui máscara automática (00.000-000) e validação integrada.
 */
<script setup lang="ts">
    const attrs: any = useAttrs();

    const props = withDefaults(
        defineProps<{
            /** Valor do CEP (apenas números) */
            modelValue: string;
            /** Estado de carregamento */
            loading?: boolean;
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
            /** Define se a validação foi bem-sucedida */
            done?: boolean | undefined;
            /** Mensagem ou estado de erro */
            error?: string | boolean | undefined;
            /** Valor alvo para comparação (opcional) */
            targetValue?: string;
            /** Mensagem ou estado de atenção */
            caution?: string | boolean | undefined;
            /** Define se o campo é obrigatório */
            required?: boolean;
        }>(),
        { modelValue: '', loading: false, done: undefined, required: false, caution: undefined }
    );

    const emit = defineEmits(['update:modelValue', 'complete']);

    const temp_value = ref(formatCep(props.modelValue));
    const temp_value_numbers = computed(() => onlyNumbers(temp_value.value ?? ''));
    const maskValue = computed(() => ({ tokens: { '#': { pattern: /[0-9]/ } }, mask: '##.### - ###' }));

    const isValidCep = computed(() => cepIsValid(temp_value_numbers.value));
    const isDone: Ref = ref(props.done ?? null);

    const checkDone = () => {
        isDone.value = done.value;
    };

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

    watch(temp_value, () => {
        const numbers = onlyNumbers(temp_value.value);
        emit('update:modelValue', numbers);
        if (isValidCep.value) emit('complete', numbers);
    });

    watch(() => props.modelValue,() => {
        const numbers = onlyNumbers(props.modelValue);
        if (numbers !== onlyNumbers(temp_value.value)) temp_value.value = numbers;
    });
</script>

<style lang="scss" scoped>
    input {
        grid-column: 2;
        position: relative;
    }
</style>
