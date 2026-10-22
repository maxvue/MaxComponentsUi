<template>
    <MaxBaseQuantity class="max-input-percent" v-bind="{ ...props, ...attrs }" :min="resolvedMin" :max="resolvedMax" :suffix="resolvedSuffix" @update:modelValue="onUpdateModelValue" @focus="onFocus" @blur="onBlur">
        <template #prefix><slot name="prefix" /></template>
        <template #suffix><slot name="suffix" /></template>
    </MaxBaseQuantity>
</template>

<script setup lang="ts">
    import { computed, useAttrs } from 'vue';
    import MaxBaseQuantity from './base/MaxBaseQuantity.vue';
    import type { MaxInputPercentProps } from '../types/semanticInputs';

    defineOptions({
        name: 'MaxInputPercent',
        inheritAttrs: false
    });

    const attrs = useAttrs();

    const props = withDefaults(defineProps<MaxInputPercentProps>(), {
        modelValue: null,
        min: 0,
        max: 100,
        minFractionDigits: 0,
        maxFractionDigits: 2,
        suffix: '%',
        disabled: false,
        required: false,
        textRight: false,
        textCenter: false
    });

    const emit = defineEmits<{
        'update:modelValue': [value: number | null];
        'focus': [event: FocusEvent];
        'blur': [event: FocusEvent];
    }>();

    defineSlots<{
        prefix?(): any;
        suffix?(): any;
    }>();

    const resolvedMin = computed(() => props.min ?? 0);
    const resolvedMax = computed(() => props.max ?? 100);
    const resolvedSuffix = computed(() => props.suffix ?? '%');

    const onUpdateModelValue = (val: number | null) => {
        emit('update:modelValue', val);
    };

    const onFocus = (event: FocusEvent) => {
        emit('focus', event);
    };

    const onBlur = (event: FocusEvent) => {
        emit('blur', event);
    };
</script>

<style lang="scss" scoped>
.max-input-percent {
    width: 100%;
}
</style>
