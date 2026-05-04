<template>
    <InputBase v-bind="props" class="input-base-date-picker" :error="errorMessage" :caution="isCaution" :done="isDone" :icon-right="icon ?? 'solar:calendar-line-duotone'" textCenter>
        <DatePicker v-bind="attrs" dateFormat="dd/mm/yy" v-maska="maskValue" v-model="internalDate" @blur="validate" />
    </InputBase>
</template>

<script setup lang="ts">
    import { useDateFormat } from '@vueuse/core';

    const attrs: any = useAttrs();
    const props = withDefaults(
        defineProps<{
            icon?: string;
            label?: string;
            required?: boolean;
            disabled?: boolean;
            done?: boolean;
            error?: string | boolean;
            caution?: string | boolean;
        }>(),
        { required: false }
    );

    const modelValue = defineModel<string | Date>({ default: '' });
    const internalDate = ref<Date | null>(null);
    const hasBeenTouched = ref(false);

    // Máscara para o input de texto do DatePicker
    const maskValue = '##/##/####';

    // Sincroniza modelValue -> internalDate
    watch(modelValue, (val) => {
        if (!val) {
            internalDate.value = null;
            return;
        }
        const dateObj = val instanceof Date ? val : new Date(val);
        if (!isNaN(dateObj.getTime())) {
            // Só atualiza se for realmente diferente para evitar loops
            if (!internalDate.value || internalDate.value.getTime() !== dateObj.getTime()) internalDate.value = dateObj;

        } else internalDate.value = null;

    }, { immediate: true });

    // Sincroniza internalDate -> modelValue
    watch(internalDate, (newDate) => {
        if (!newDate) {
            if (modelValue.value !== '') modelValue.value = '';
            return;
        }
        const formatted = useDateFormat(newDate, 'YYYY-MM-DD HH:mm:ss').value;
        if (formatted !== modelValue.value) modelValue.value = formatted;

    });

    const validate = () => {
        hasBeenTouched.value = true;
    };

    const isDone = computed(() => {
        if (props.done !== undefined) return props.done;
        return internalDate.value !== null;
    });

    const isCaution = computed(() => {
        if (props.caution !== undefined) return props.caution;
        if (!hasBeenTouched.value && !modelValue.value) return false;
        return props.required && !internalDate.value;
    });

    const errorMessage = computed(() => {
        if (typeof props.error === 'string') return props.error;
        if (isCaution.value) return (attrs.errMsg || attrs.error_message || 'Data é obrigatória');

        return null;
    });
</script>

<style lang="scss">
    .p-datepicker-panel {
        transform: translateX(-10px);
    }
</style>

