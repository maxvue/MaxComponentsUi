<template>
    <MaxDomainSelect v-bind="attrs" class="max-input-ai-cache-operation" :options="AI_CACHE_OPERATION_OPTIONS" :modelValue="props.modelValue" :label="props.label ?? 'Operação de cache'" :placeholder="props.placeholder" :filter="props.filter" :disabled="props.disabled" :required="props.required" :clearable="props.clearable" :showClear="props.showClear" :done="props.done" :error="props.error" :caution="props.caution" :noMessage="props.noMessage" @update:modelValue="(val: AiCacheOperationValue | null) => emit('update:modelValue', val)" @change="(val: AiCacheOperationValue | null) => emit('change', val)" @clear="() => emit('clear')">
        <template v-if="slots.value" #value="slotProps">
            <slot name="value" v-bind="slotProps" />
        </template>
        <template v-if="slots.option" #option="slotProps">
            <slot name="option" v-bind="slotProps" />
        </template>
    </MaxDomainSelect>
</template>

<script setup lang="ts">
    import { useAttrs, useSlots } from 'vue';
    import MaxDomainSelect from './base/MaxDomainSelect.vue';
    import { AI_CACHE_OPERATION_OPTIONS } from '../constants/aiInputs';
    import type {
        AiCacheOperationValue,
        MaxInputAiCacheOperationProps
    } from '../types/specializedInputs';

    defineOptions({
        inheritAttrs: false
    });

    const attrs = useAttrs();
    const slots = useSlots();

    const props = withDefaults(defineProps<MaxInputAiCacheOperationProps>(), {
        modelValue: null,
        label: undefined,
        placeholder: undefined,
        filter: false,
        disabled: false,
        required: false,
        clearable: false,
        showClear: false,
        done: undefined,
        error: undefined,
        caution: undefined,
        noMessage: false
    });

    const emit = defineEmits<{
        'update:modelValue': [value: AiCacheOperationValue | null];
        'change': [value: AiCacheOperationValue | null];
        'clear': [];
    }>();
</script>

<style lang="scss" scoped>
    .max-input-ai-cache-operation {
        width: 100%;
    }
</style>
