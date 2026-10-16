<template>
    <MaxBaseQuantity class="max-input-token-limit" v-bind="props" :integer="true" :min="resolvedMin" :max="resolvedMax" suffix="tokens" @update:modelValue="onUpdateModelValue" @focus="onFocus" @blur="onBlur">
        <template #prefix><slot name="prefix" /></template>
        <template #suffix><slot name="suffix" /></template>
    </MaxBaseQuantity>
</template>

<script setup lang="ts">
    import { computed } from 'vue';
    import MaxBaseQuantity from './base/MaxBaseQuantity.vue';
    import type { MaxInputTokenLimitProps } from '../types/semanticInputs';

    defineOptions({
        name: 'MaxInputTokenLimit',
        inheritAttrs: false
    });

    const props = withDefaults(defineProps<MaxInputTokenLimitProps>(), {
        modelValue: null,
        min: 1,
        max: Number.MAX_SAFE_INTEGER,
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

    const resolvedMin = computed(() => props.min ?? 1);
    const resolvedMax = computed(() => props.max ?? Number.MAX_SAFE_INTEGER);

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
.max-input-token-limit {
    width: 100%;
}
</style>
