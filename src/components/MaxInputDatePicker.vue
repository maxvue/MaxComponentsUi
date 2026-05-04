<template>
    <InputBase v-bind="props" class="input-base-date-picker" :error="error_msg" :caution="caution" :done="isDone" :icon-right="icon ?? 'solar:calendar-line-duotone'" textCenter>
        <DatePicker v-bind="attrs" dateFormat="dd/mm/yy" v-maska="maskValue" v-model="temp_value" @blur="checkDone()" />
    </InputBase>
</template>

<script setup lang="ts">
    const attrs: any = useAttrs();

    const props = withDefaults(
        defineProps<{
            modelValue: string | Date;
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

    const emit = defineEmits(['update:modelValue']);

    const maskValue = computed(() => {
        return '##/##/####';
    });

    const model_formatted: Ref = computed(() => (props.modelValue ? useDateFormat(props.modelValue, 'YYYY-MM-DD HH:mm:ss').value : ''));

    const temp_value: Ref = ref(hasContent(model_formatted.value) ? new Date(model_formatted.value) : '');
    const temp_formatted: Ref = computed(() => (hasContent(temp_value.value) ? useDateFormat(temp_value.value, 'YYYY-MM-DD HH:mm:ss').value : ''));

    const isDone: Ref = ref(props.done ?? null);

    const checkDone = () => {
        isDone.value = done.value;
    };

    const done = computed(() => {
        if (props.done !== undefined) return props.done;
        if (props.required) return hasContent(temp_formatted.value);
        return null;
    });

    const caution = computed(() => {
        if (props.caution !== undefined) return props.caution;
        if (temp_value.value === '' && !props.required) return false;
        return done.value === false;
    });

    const error_msg = computed(() => {
        if (!caution.value) return null;
        const attrs_error_message = attrs.errMsg ?? attrs.error_message ?? attrs.error_msg ?? null;
        if (props.required && temp_value.value === '') return attrs_error_message ?? 'Data é obrigatória';
        return attrs_error_message ?? 'Data inválida';
    });

    watch(
        temp_value,
        () => {
            if (model_formatted.value !== temp_formatted.value) emit('update:modelValue', temp_formatted.value);
            isDone.value = done.value;
        },
        { immediate: true }
    );

    watch(model_formatted, () => {
        if (model_formatted.value !== temp_formatted.value) temp_value.value = hasContent(model_formatted.value) ? new Date(model_formatted.value) : '';
    });
</script>

<style lang="scss">
    .p-datepicker-panel {
        transform: translateX(-10px);
    }
</style>
