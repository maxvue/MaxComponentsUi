<template>
    <MaxInputSelect v-bind="forwardedAttrs" class="max-domain-select" :options="selectOptions" optionValue="value" optionLabel="label" :label="props.label" :placeholder="props.placeholder" :filter="props.filter" :disabled="props.disabled" :required="props.required" :clearable="isClearable" :done="props.done" :error="resolvedError" :caution="props.caution" :noMessage="props.noMessage" :modelValue="internalValue" @update:modelValue="onUpdateModelValue" @change="onChange" @clear="onClear">
        <template v-if="slots.value || isUnknownValue" #value="{ value }">
            <slot name="value" :value="value" :option="selectedOption">
                <span v-if="isUnknownValue" class="max-domain-unknown-value">{{ String(props.modelValue) }}</span>
            </slot>
        </template>
        <template v-if="slots.option" #option="{ option }">
            <slot name="option" :option="option" />
        </template>
    </MaxInputSelect>
</template>

<script setup lang="ts">
    import { computed, nextTick, ref, useAttrs, useSlots, watch } from 'vue';
    import MaxInputSelect from '../MaxInputSelect.vue';
    import type { DomainSelectOption } from '../../types/domainInputs';

    defineOptions({
        inheritAttrs: false
    });

    const RESERVED_ATTRS = new Set([
        'options',
        'groupOptions',
        'group-options',
        'loadOptions',
        'load-options',
        'optionValue',
        'option-value',
        'optionLabel',
        'option-label',
        'optionName',
        'option-name',
        'default',
        'modelValue',
        'onUpdate:modelValue',
        'onChange',
        'onClear'
    ]);

    const props = withDefaults(
        defineProps<{
            options: readonly DomainSelectOption<any>[];
            modelValue?: any;
            label?: string;
            placeholder?: string;
            filter?: boolean;
            disabled?: boolean;
            required?: boolean;
            clearable?: boolean;
            showClear?: boolean;
            done?: boolean;
            error?: string | boolean | null;
            caution?: string | boolean | null;
            noMessage?: boolean;
        }>(),
        {
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
        }
    );

    const emit = defineEmits<{
        'update:modelValue': [value: any];
        'change': [value: any];
        'clear': [];
    }>();

    const attrs = useAttrs();
    const slots = useSlots();

    const forwardedAttrs = computed(() => {
        const result: Record<string, any> = {};
        for (const [key, value] of Object.entries(attrs)) if (!RESERVED_ATTRS.has(key)) result[key] = value;
        return result;
    });

    const selectOptions = computed(() => [...props.options]);

    const isClearable = computed(() => Boolean(props.clearable || props.showClear));

    const isEmptyValue = (val: any): boolean => val === '' || val === null || val === undefined;

    const isUnknownValue = computed(() => {
        if (isEmptyValue(props.modelValue)) return false;
        return !props.options.some((opt) => opt.value === props.modelValue);
    });

    const selectedOption = computed(() => props.options.find((opt) => opt.value === internalValue.value));

    const resolvedError = computed(() => {
        if (props.error !== undefined && props.error !== null) return props.error;
        if (isUnknownValue.value) return 'Opção selecionada inválida';
        return undefined;
    });

    const internalValue = ref<any>(props.modelValue === '' ? null : props.modelValue);
    let lastEmittedValue: any = internalValue.value;
    let isSyncingFromParent = false;

    watch(
        () => props.modelValue,
        (newVal) => {
            const normalized = newVal === '' ? null : newVal;
            lastEmittedValue = normalized;
            if (internalValue.value !== normalized) {
                isSyncingFromParent = true;
                internalValue.value = normalized;
                void nextTick(() => {
                    isSyncingFromParent = false;
                });
            }
        }
    );

    const onUpdateModelValue = (val: any) => {
        if (isSyncingFromParent) return;
        const normalized = val === '' ? null : val;
        if (normalized !== lastEmittedValue) {
            lastEmittedValue = normalized;
            internalValue.value = normalized;
            emit('update:modelValue', normalized);
        }
    };

    const onChange = (val: any) => {
        if (isSyncingFromParent) return;
        const normalized = val === '' ? null : val;
        emit('change', normalized);
    };

    const onClear = () => {
        emit('clear');
    };
</script>

<style lang="scss" scoped>
    .max-domain-select {
        width: 100%;
    }

    .max-domain-unknown-value {
        color: var(--max-danger-500, #ef4444);
        font-style: italic;
    }
</style>
