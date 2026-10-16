<template>
    <MaxDomainSelect v-bind="attrs" class="max-input-wire-size" :options="WIRE_SIZE_OPTIONS" :modelValue="props.modelValue" :label="props.label ?? 'Seção do condutor'" :placeholder="props.placeholder" :filter="props.filter" :disabled="props.disabled" :required="props.required" :clearable="props.clearable" :showClear="props.showClear" :done="props.done" :error="props.error" :caution="props.caution" :noMessage="props.noMessage" @update:modelValue="(val: WireSizeValue | null) => emit('update:modelValue', val)" @change="(val: WireSizeValue | null) => emit('change', val)" @clear="() => emit('clear')">
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
    import { WIRE_SIZE_OPTIONS } from '../constants/electricalInputs';
    import type { MaxInputWireSizeProps, WireSizeValue } from '../types/domainInputs';

    defineOptions({
        inheritAttrs: false
    });

    const attrs = useAttrs();
    const slots = useSlots();

    const props = withDefaults(defineProps<MaxInputWireSizeProps>(), {
        modelValue: null,
        label: undefined,
        placeholder: undefined,
        filter: true,
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
        'update:modelValue': [value: WireSizeValue | null];
        'change': [value: WireSizeValue | null];
        'clear': [];
    }>();
</script>

<style lang="scss" scoped>
    .max-input-wire-size {
        width: 100%;
    }
</style>
