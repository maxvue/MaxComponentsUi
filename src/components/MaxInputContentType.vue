<template>
    <MaxDomainSelect v-bind="attrs" class="max-input-content-type" :options="CONTENT_TYPE_OPTIONS" :modelValue="props.modelValue" :label="props.label ?? 'Tipo de conteúdo base'" :placeholder="props.placeholder" :filter="props.filter" :disabled="props.disabled" :required="props.required" :clearable="props.clearable" :showClear="props.showClear" :done="props.done" :error="props.error" :caution="props.caution" :noMessage="props.noMessage" @update:modelValue="(val: ContentTypeValue | null) => emit('update:modelValue', val)" @change="(val: ContentTypeValue | null) => emit('change', val)" @clear="() => emit('clear')">
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
    import { CONTENT_TYPE_OPTIONS } from '../constants/editorialInputs';
    import type { ContentTypeValue, MaxInputContentTypeProps } from '../types/domainInputs';

    defineOptions({
        inheritAttrs: false
    });

    const attrs = useAttrs();
    const slots = useSlots();

    const props = withDefaults(defineProps<MaxInputContentTypeProps>(), {
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
        'update:modelValue': [value: ContentTypeValue | null];
        'change': [value: ContentTypeValue | null];
        'clear': [];
    }>();
</script>

<style lang="scss" scoped>
    .max-input-content-type {
        width: 100%;
    }
</style>
