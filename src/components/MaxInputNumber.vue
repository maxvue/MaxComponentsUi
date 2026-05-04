<template>
    <InputBase v-bind="props" :value="temp_value" :done="isDone" :caution="caution" :error="error_msg">
        <InputNumber ref="primevueInput" v-bind="attrs" fluid v-model="temp_value" @blur="checkDone()" />
    </InputBase>
</template>

<script setup lang="ts">
    const attrs: any = useAttrs();

    const props = withDefaults(
        defineProps<{
            modelValue: number | null;
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
            targetValue?: string | number;
            caution?: string | boolean | undefined;
            required?: boolean;
        }>(),
        { modelValue: null, done: undefined, required: false, caution: undefined }
    );

    const primevueInput = ref();
    const temp_value = ref(props.modelValue);
    const emit = defineEmits(['update:modelValue']);

    const isDone: Ref = ref(props.done ?? null);

    const checkDone = () => isDone.value = done.value;

    const done = computed(() => {
        if (props.done !== undefined) return props.done;
        if (props.required) return temp_value.value !== null && temp_value.value !== undefined;
        return null;
    });

    const caution = computed(() => {
        if (props.caution !== undefined) return props.caution;
        if (temp_value.value === null && !props.required) return false;
        return done.value === false;
    });

    const error_msg = computed(() => {
        if (!caution.value) return null;
        const attrs_error_message = attrs.errMsg ?? attrs.error_message ?? attrs.error_msg ?? null;
        if (props.required && temp_value.value === null) return attrs_error_message ?? 'Campo obrigatório';
        return attrs_error_message ?? 'Valor inválido';
    });

    watch(temp_value, () => {
        emit('update:modelValue', temp_value.value);
        isDone.value = done.value;
    });

    watch( () => props.modelValue, () => temp_value.value = props.modelValue );

    onMounted(() => temp_value.value = props.modelValue);

    const setFocus = () => {
        if (primevueInput.value) if (typeof primevueInput.value.focus === 'function') primevueInput.value.focus();
        else primevueInput.value.$el.focus();
    };

    defineExpose(setFocus);
</script>

<style lang="scss">
    .input-base-main-div {
        .p-inputnumber {
            width: 100%;
            height: 100%;
        }
    }
</style>
