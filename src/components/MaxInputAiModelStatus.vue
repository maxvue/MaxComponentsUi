<template>
    <MaxDomainSelect v-bind="attrs" class="max-input-ai-model-status" :options="AI_MODEL_STATUS_OPTIONS" :modelValue="props.modelValue" :label="props.label ?? 'Situação do modelo'" :placeholder="props.placeholder" :filter="props.filter" :disabled="props.disabled" :required="props.required" :clearable="props.clearable" :showClear="props.showClear" :done="props.done" :error="props.error" :caution="props.caution" :noMessage="props.noMessage" @update:modelValue="(val: AiModelStatusValue | null) => emit('update:modelValue', val)" @change="(val: AiModelStatusValue | null) => emit('change', val)" @clear="() => emit('clear')">
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
    import { AI_MODEL_STATUS_OPTIONS } from '../constants/aiInputs';
    import type {
        AiModelStatusValue,
        MaxInputAiModelStatusProps
    } from '../types/specializedInputs';

    defineOptions({
        inheritAttrs: false
    });

    const attrs = useAttrs();
    const slots = useSlots();

    const props = withDefaults(defineProps<MaxInputAiModelStatusProps>(), {
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
        'update:modelValue': [value: AiModelStatusValue | null];
        'change': [value: AiModelStatusValue | null];
        'clear': [];
    }>();
</script>

<style lang="scss" scoped>
    .max-input-ai-model-status {
        width: 100%;
    }
</style>
