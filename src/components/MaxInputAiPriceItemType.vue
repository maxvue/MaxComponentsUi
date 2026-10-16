<template>
    <MaxDomainSelect v-bind="attrs" class="max-input-ai-price-item-type" :options="AI_PRICE_ITEM_TYPE_OPTIONS" :modelValue="props.modelValue" :label="props.label ?? 'Modalidade de preço de IA'" :placeholder="props.placeholder" :filter="props.filter" :disabled="props.disabled" :required="props.required" :clearable="props.clearable" :showClear="props.showClear" :done="props.done" :error="props.error" :caution="props.caution" :noMessage="props.noMessage" @update:modelValue="(val: AiPriceItemTypeValue | null) => emit('update:modelValue', val)" @change="(val: AiPriceItemTypeValue | null) => emit('change', val)" @clear="() => emit('clear')">
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
    import { AI_PRICE_ITEM_TYPE_OPTIONS } from '../constants/aiInputs';
    import type {
        AiPriceItemTypeValue,
        MaxInputAiPriceItemTypeProps
    } from '../types/specializedInputs';

    defineOptions({
        inheritAttrs: false
    });

    const attrs = useAttrs();
    const slots = useSlots();

    const props = withDefaults(defineProps<MaxInputAiPriceItemTypeProps>(), {
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
        'update:modelValue': [value: AiPriceItemTypeValue | null];
        'change': [value: AiPriceItemTypeValue | null];
        'clear': [];
    }>();
</script>

<style lang="scss" scoped>
    .max-input-ai-price-item-type {
        width: 100%;
    }
</style>
