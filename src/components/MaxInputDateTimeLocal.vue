<template>
    <InputBase v-bind="{ ...inputBaseProps, ...attrsWithoutModelProps }" class="max-input-datetime-local-base" :icon="props.icon ?? 'solar:calendar-date-line-duotone'">
        <template #default="{ inputAttrs }">
            <input ref="inputRef" type="datetime-local" class="max-input-native max-datetime-local-input" v-bind="inputAttrs" :value="formattedValue" :min="props.min" :max="props.max" :step="props.step" :disabled="props.disabled" :readonly="props.readonly" @input="onInput" @change="onChange" />
        </template>
    </InputBase>
</template>

<script setup lang="ts">
    import { ref, computed, useAttrs } from 'vue';
    import InputBase from './InputBase.vue';

    defineOptions({
        name: 'MaxInputDateTimeLocal',
        inheritAttrs: false
    });

    export interface MaxInputDateTimeLocalProps {
        modelValue?: string | Date | null;
        min?: string;
        max?: string;
        step?: string | number;
        disabled?: boolean;
        readonly?: boolean;
        label?: string;
        error?: string | boolean | null;
        caution?: string | boolean | null;
        done?: boolean | null;
        required?: boolean | null;
        message?: string;
        icon?: string;
    }

    const props = withDefaults(defineProps<MaxInputDateTimeLocalProps>(), {
        modelValue: null,
        disabled: false,
        readonly: false
    });

    const emit = defineEmits<{
        'update:modelValue': [value: string | null];
        'change': [value: string | null];
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
        disabled: props.disabled,
        readonly: props.readonly
    }));

    const inputRef = ref<HTMLInputElement | null>(null);

    const formattedValue = computed<string>(() => {
        if (!props.modelValue) return '';
        if (props.modelValue instanceof Date) {
            const pad = (n: number) => String(n).padStart(2, '0');
            const y = props.modelValue.getFullYear();
            const m = pad(props.modelValue.getMonth() + 1);
            const d = pad(props.modelValue.getDate());
            const h = pad(props.modelValue.getHours());
            const min = pad(props.modelValue.getMinutes());
            return `${y}-${m}-${d}T${h}:${min}`;
        }
        return String(props.modelValue).slice(0, 16);
    });

    const onInput = (e: Event) => {
        const val = (e.target as HTMLInputElement).value;
        const normalized = val ? val : null;
        emit('update:modelValue', normalized);
    };

    const onChange = (e: Event) => {
        const val = (e.target as HTMLInputElement).value;
        const normalized = val ? val : null;
        emit('change', normalized);
    };
</script>

<style lang="scss" scoped>
    .max-datetime-local-input {
        width: 100%;
        background: transparent;
        border: none;
        outline: none;
        font-size: 13px;
        color: inherit;

        &::-webkit-calendar-picker-indicator {
            cursor: pointer;
            opacity: 0.6;
            transition: opacity 0.15s;

            &:hover {
                opacity: 1;
            }
        }

        &:focus-visible {
            outline: var(--max-focus-outline, 2px solid var(--max-focus-ring-color, #00768e));
        }
    }

    @media (prefers-reduced-motion: reduce) {
        .max-datetime-local-input::-webkit-calendar-picker-indicator {
            transition: none;
        }
    }
</style>
