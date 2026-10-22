<template>
    <MaxBaseQuantity class="max-input-distance" v-bind="{ ...props, ...attrs }" :min="resolvedMin" :suffix="resolvedSuffix" @update:modelValue="onUpdateModelValue" @focus="onFocus" @blur="onBlur">
        <template #prefix><slot name="prefix" /></template>
        <template #suffix><slot name="suffix" /></template>
    </MaxBaseQuantity>
</template>

<script setup lang="ts">
    import { computed, useAttrs } from 'vue';
    import MaxBaseQuantity from './base/MaxBaseQuantity.vue';
    import type { MaxInputDistanceProps } from '../types/semanticInputs';

    defineOptions({
        name: 'MaxInputDistance',
        inheritAttrs: false
    });

    const attrs = useAttrs();

    const props = withDefaults(defineProps<MaxInputDistanceProps>(), {
        modelValue: null,
        min: 0,
        unit: 'm',
        minFractionDigits: 0,
        maxFractionDigits: 2,
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
    const resolvedSuffix = computed(() => props.unit ?? 'm');

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
.max-input-distance {
    width: 100%;
}
</style>
