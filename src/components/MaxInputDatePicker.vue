<template>
    <InputBase v-bind="attrs" class="input-base-date-picker" :error="errorMessage" :caution="isCaution" :done="isDone" :icon="attrs.icon ?? 'solar:calendar-line-duotone'">
        <DatePicker v-bind="attrs" :dateFormat="attrs.dateFormat ?? 'dd/mm/yy'" v-model="internalDate" @blur="validate" ref="element" />
    </InputBase>
</template>

<script setup lang="ts">
    import { ref, computed, watch, useAttrs } from 'vue';
    import InputBase from './InputBase.vue';
    import DatePicker from 'primevue/datepicker';
    import { useDateFormat } from '@maxvue/max-use';

    const attrs: any = useAttrs();

    const modelValue = defineModel<any>({ default: '' });
    const internalDate = ref<Date | null>(null);
    const hasBeenTouched = ref(false);

    // Sincroniza modelValue -> internalDate
    watch(modelValue, (val) => {
        if (!val) {
            internalDate.value = null;
            return;
        }
        // Adiciona 'T00:00:00' para strings date-only (YYYY-MM-DD) evitando interpretação UTC
        const dateObj = val instanceof Date ? val : new Date(typeof val === 'string' && !val.includes('T') && !val.includes(' ') ? val + 'T00:00:00' : val);
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
        if (attrs.done !== undefined) return attrs.done;
        return internalDate.value !== null;
    });

    const isCaution = computed(() => {
        if (attrs.caution !== undefined) return attrs.caution;
        if (!hasBeenTouched.value && !modelValue.value) return false;
        return attrs.required && !internalDate.value;
    });

    const errorMessage = computed(() => {
        if (typeof attrs.error === 'string') return attrs.error;
        if (isCaution.value) return (attrs.errMsg || attrs.error_message || 'Data é obrigatória');

        return null;
    });
</script>

<style lang="scss">
    .p-datepicker-panel {
        transform: translateX(-10px);
    }
</style>

