<template>
    <MaxBaseQuantity class="max-input-current" v-bind="{ ...props, ...attrs }" :min="resolvedMin" suffix="A" @update:modelValue="onUpdateModelValue" @focus="onFocus" @blur="onBlur">
        <template #prefix><slot name="prefix" /></template>
        <template #suffix><slot name="suffix" /></template>
    </MaxBaseQuantity>
</template>

<script setup lang="ts">
    import { computed, useAttrs } from 'vue';
    import MaxBaseQuantity from './base/MaxBaseQuantity.vue';
    import type { MaxInputCurrentProps } from '../types/semanticInputs';

    defineOptions({
        name: 'MaxInputCurrent',
        inheritAttrs: false
    });

    const attrs = useAttrs();

    const props = withDefaults(defineProps<MaxInputCurrentProps>(), {
        modelValue: null,
        min: 0,
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
.max-input-current {
    width: 100%;
}
</style>
