<template>
    <InputBase v-bind="props" :value="temp_value" :done="isDone" :error="error_msg" :caution="caution">
        <InputText type="text" v-model="temp_value" fluid @blur="isDone = testIsDone()" />
    </InputBase>
</template>

<script setup lang="ts">
    const attrs: any = useAttrs();

    const props = withDefaults(
        defineProps<{
            modelValue: string;
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
        { modelValue: '', done: undefined, required: false, caution: undefined }
    );

    const temp_value = ref(props.modelValue);

    const isDone: Ref = ref(props.done ?? null);

    const isEqual = computed(() => typeof props.targetValue === 'string' && hasContent(props.targetValue) ? toSearchableString(props.targetValue) === toSearchableString(temp_value.value) : null);

    const isRequiredDone = computed(() => (props.required ? hasContent(temp_value.value) : null));

    const testIsDone = () => {
        if (props.done !== undefined) return props.done;
        if (isEqual.value !== null) return isEqual.value;
        if (isRequiredDone.value !== null) return isRequiredDone.value;
        if (props.caution !== undefined) return !props.caution;
        return null;
    };

    const caution = computed(() => (props.caution !== undefined ? props.caution && isDone.value === false : isDone.value === false));

    const error_msg = computed(() => {
        if (!caution.value) return null;
        const attrs_error_message = attrs.errMsg ?? attrs.error_message ?? attrs.error_msg ?? null;
        if (isEqual.value === false) return attrs_error_message ?? 'Valor esperado: ' + (attrs.target_value ?? attrs.targetValue ?? attrs['target-value']);
        if (isRequiredDone.value === false) return attrs_error_message ?? 'Campo obrigatório';
        return attrs_error_message ?? 'Valor inválido';
    });

    const emit = defineEmits(['update:modelValue']);
    watch(temp_value, () => {
        isDone.value = testIsDone();
        emit('update:modelValue', temp_value.value);
    });
    watch(
        () => props.modelValue,
        () => (temp_value.value = props.modelValue)
    );
</script>