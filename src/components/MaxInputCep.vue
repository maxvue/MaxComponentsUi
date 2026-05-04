<template>
    <InputBase v-bind="props" class="input-base-phone-mail-main-div" :value="temp_value" :done="done ?? undefined" :caution="caution" :error="error_msg ?? undefined" :icon-right="loading ? 'loading' : undefined">
        <InputText type="text" v-model="temp_value" v-maska="maskValue" autoClear="false" slotChar=" " placeholder="00 . 000 - 000" @blur="checkDone()" />
    </InputBase>
</template>

<script setup lang="ts">
    const attrs: any = useAttrs();

    const props = withDefaults(
        defineProps<{
            modelValue: string;
            loading?: boolean;
            icon?: string | undefined;
            i?: string | undefined;
            disabled?: boolean | undefined;
            float?: boolean | undefined;
            msg?: string | undefined;
            message?: string | undefined;
            iconMessage?: string | undefined;
            label?: string | undefined;
            done?: boolean | undefined;
            error?: string | boolean | undefined;
            targetValue?: string;
            caution?: string | boolean | undefined;
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
