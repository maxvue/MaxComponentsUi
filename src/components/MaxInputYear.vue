<template>
    <MaxInputSelect v-bind="forwardedAttrs" class="max-input-year" :modelValue="props.modelValue" :options="yearOptions" optionValue="value" optionLabel="label" optionName="name" :label="resolvedLabel" :placeholder="resolvedPlaceholder" :disabled="props.disabled" :required="props.required" :clearable="props.clearable" :filter="props.filter" :done="props.done" :error="props.error" :caution="props.caution" :noMessage="props.noMessage" :noStatus="props.noStatus" :icon="props.icon" :iconLeft="props.iconLeft" :iconRight="props.iconRight" :msg="props.msg" :message="props.message" :ariaDescribedby="props.ariaDescribedby" @update:modelValue="onSelectUpdate" @change="onSelectChange" @clear="onSelectClear">
        <template #value="slotProps">
            <slot name="value" v-bind="slotProps" />
        </template>
        <template #option="slotProps">
            <slot name="option" v-bind="slotProps" />
        </template>
    </MaxInputSelect>
</template>

<script setup lang="ts">
    import { computed, useAttrs, nextTick } from 'vue';
    import MaxInputSelect from './MaxInputSelect.vue';
    import { generateYearOptions } from '../constants/semanticInputOptions';
    import type { MaxInputYearProps } from '../types/semanticInputs';

    defineOptions({
        inheritAttrs: false
    });

    const attrs = useAttrs();
    const referenceYear = new Date().getFullYear();

    const props = withDefaults(defineProps<MaxInputYearProps>(), {
        modelValue: null,
        minYear: undefined,
        maxYear: undefined,
        label: undefined,
        placeholder: undefined,
        disabled: false,
        required: false,
        clearable: false,
        filter: false,
        noMessage: false,
        noStatus: false
    });

    const emit = defineEmits<{
        'update:modelValue': [value: number | null];
        'change': [value: number | null];
        'clear': [];
    }>();

    const yearOptions = computed(() => {
        return generateYearOptions(props.minYear, props.maxYear, referenceYear);
    });

    const resolvedLabel = computed<string | undefined>(() => {
        if (props.label !== undefined) return props.label;
        return 'Ano';
    });

    const resolvedPlaceholder = computed<string>(() => {
        if (props.placeholder !== undefined) return props.placeholder;
        return 'Selecione o ano';
    });

    let isClearing = false;

    const sanitizeYear = (val: any): number | null => {
        if (val === undefined || val === null || val === '') return null;
        const num = Number(val);
        if (Number.isInteger(num) && num >= 1 && num <= 9999) return num;
        return null;
    };

    const onSelectUpdate = (val: any) => {
        if (isClearing) return;
        const nextVal = sanitizeYear(val);
        if (nextVal === props.modelValue) return;
        emit('update:modelValue', nextVal);
    };

    const onSelectChange = (val: any) => {
        if (isClearing) return;
        const nextVal = sanitizeYear(val);
        if (nextVal === props.modelValue) return;
        emit('change', nextVal);
    };

    const onSelectClear = () => {
        isClearing = true;
        emit('update:modelValue', null);
        emit('change', null);
        emit('clear');
        void nextTick(() => {
            isClearing = false;
        });
    };

    const forwardedAttrs = computed(() => {
        const {
            options: _o,
            groupOptions: _go,
            loadOptions: _lo,
            optionValue: _ov,
            optionLabel: _ol,
            optionName: _on,
            ...rest
        } = attrs;
        return rest;
    });
</script>

<style lang="scss" scoped>
    .max-input-year {
        width: 100%;
    }
</style>
