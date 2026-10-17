<template>
    <div v-if="props.type === 'segmented'" class="max-date-reference-segmented-wrapper">
        <InputBase v-bind="{ ...inputBaseProps, ...attrsWithoutModelProps }" class="max-input-date-reference-base">
            <template #default="{ inputAttrs }">
                <div v-bind="inputAttrs" class="max-date-ref-segmented" role="radiogroup" :aria-label="props.label ?? 'Referência de data'">
                    <button v-for="opt in normalizedOptions" :key="String(opt.value)" type="button" class="max-date-ref-btn" :class="{ 'is-active': opt.value === props.modelValue, 'is-disabled': props.disabled || opt.disabled }" :disabled="props.disabled || opt.disabled" role="radio" :aria-checked="opt.value === props.modelValue" @click="selectOption(opt)">
                        <MaxIcon v-if="opt.icon" :icon="opt.icon" size="0.9" />
                        <span>{{ opt.label }}</span>
                    </button>
                </div>
            </template>
        </InputBase>
    </div>
    <MaxInputSelect v-else v-bind="{ ...inputBaseProps, ...attrsWithoutModelProps }" class="max-input-date-reference" :options="normalizedOptions" optionLabel="label" optionValue="value" :icon="props.icon ?? 'solar:calendar-date-bold-duotone'" :placeholder="props.placeholder ?? 'Selecione a referência...'" :disabled="props.disabled" :modelValue="props.modelValue" @update:modelValue="onSelectUpdate" />
</template>

<script setup lang="ts">
    import { computed, useAttrs } from 'vue';
    import InputBase from './InputBase.vue';
    import MaxInputSelect from './MaxInputSelect.vue';
    import MaxIcon from './MaxIcon.vue';

    defineOptions({
        name: 'MaxInputDateReference',
        inheritAttrs: false
    });

    export interface DateReferenceOption {
        label: string;
        value: any;
        icon?: string;
        disabled?: boolean;
    }

    export interface MaxInputDateReferenceProps {
        modelValue?: string | number | null;
        options?: Array<DateReferenceOption | string>;
        optionLabel?: string;
        optionValue?: string;
        type?: 'select' | 'segmented';
        placeholder?: string;
        disabled?: boolean;
        label?: string;
        error?: string | boolean | null;
        caution?: string | boolean | null;
        done?: boolean | null;
        required?: boolean | null;
        message?: string;
        icon?: string;
    }

    const props = withDefaults(defineProps<MaxInputDateReferenceProps>(), {
        modelValue: null,
        options: () => [],
        optionLabel: 'label',
        optionValue: 'value',
        type: 'select',
        placeholder: 'Selecione a referência...',
        disabled: false
    });

    const emit = defineEmits<{
        'update:modelValue': [value: any];
        'change': [value: any, option: DateReferenceOption | undefined];
    }>();

    const attrs = useAttrs();
    const attrsWithoutModelProps = computed(() => {
        const { modelValue: _, ...rest } = attrs;
        return rest;
    });

    const inputBaseProps = computed(() => ({
        label: props.label,
        error: props.error,
        caution: props.caution,
        done: props.done ?? undefined,
        required: props.required ?? undefined,
        message: props.message,
        icon: props.icon,
        disabled: props.disabled
    }));

    const normalizedOptions = computed<DateReferenceOption[]>(() => {
        return props.options.map((opt) => {
            if (typeof opt === 'string' || typeof opt === 'number') return {
                label: String(opt),
                value: opt
            };

            return {
                label: String(opt[props.optionLabel as keyof typeof opt] ?? opt.label ?? opt.value),
                value: opt[props.optionValue as keyof typeof opt] !== undefined ? opt[props.optionValue as keyof typeof opt] : opt.value,
                icon: opt.icon,
                disabled: opt.disabled
            };
        });
    });

    const selectOption = (opt: DateReferenceOption) => {
        if (props.disabled || opt.disabled) return;
        emit('update:modelValue', opt.value);
        emit('change', opt.value, opt);
    };

    const onSelectUpdate = (val: any) => {
        const matched = normalizedOptions.value.find((o) => o.value === val);
        emit('update:modelValue', val);
        emit('change', val, matched);
    };
</script>

<style lang="scss" scoped>
    .max-date-ref-segmented {
        display: flex;
        align-items: center;
        gap: 4px;
        width: 100%;
        overflow-x: auto;
        padding: 2px 0;
    }

    .max-date-ref-btn {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px 10px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: 500;
        cursor: pointer;
        background: var(--background-100, #f3f4f6);
        color: var(--max-neutral-700, #374151);
        border: 1px solid var(--border-color, #e5e7eb);
        transition: all 0.15s ease;
        white-space: nowrap;

        &:hover:not(.is-disabled) {
            background: var(--background-200, #e5e7eb);
        }

        &.is-active {
            background: var(--max-primary-500, #00768e);
            color: #fff;
            border-color: var(--max-primary-600, #005f77);
        }

        &.is-disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
    }

    @media (prefers-reduced-motion: reduce) {
        .max-date-ref-btn {
            transition: none;
        }
    }
</style>
