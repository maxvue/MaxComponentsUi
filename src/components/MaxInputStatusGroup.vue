<template>
    <InputBase v-bind="{ ...inputBaseProps, ...attrsWithoutModelProps }" class="max-input-status-group-base">
        <template #default="{ inputAttrs }">
            <div class="max-status-group" v-bind="inputAttrs" :class="{ 'is-disabled': props.disabled, [`size-${props.size}`]: true }" :role="props.multiple ? 'group' : 'radiogroup'" :aria-label="props.label ?? 'Grupo de status'">
                <button v-for="opt in normalizedOptions" :key="String(opt.value)" type="button" class="max-status-pill" :class="[getPillClasses(opt)]" :style="getPillStyle(opt)" :disabled="props.disabled || opt.disabled" :role="props.multiple ? 'checkbox' : 'radio'" :aria-checked="isOptionSelected(opt)" @click="toggleOption(opt)">
                    <MaxIcon v-if="opt.icon" :icon="opt.icon" size="0.85" class="status-pill-icon" />
                    <span class="status-pill-text">{{ opt.label }}</span>
                    <span v-if="isOptionSelected(opt)" class="status-pill-check" aria-hidden="true">
                        <MaxIcon icon="lucide:check" size="0.75" />
                    </span>
                </button>
                <button v-if="props.clearable && hasAnySelection && !props.disabled" type="button" class="max-status-clear-btn" aria-label="Limpar status" @click="clearAll">
                    <MaxIcon icon="lucide:x" size="0.8" />
                    <span>Limpar</span>
                </button>
            </div>
        </template>
    </InputBase>
</template>

<script setup lang="ts">
    import { computed, useAttrs } from 'vue';
    import InputBase from './InputBase.vue';
    import MaxIcon from './MaxIcon.vue';

    defineOptions({
        name: 'MaxInputStatusGroup',
        inheritAttrs: false
    });

    export interface StatusGroupOption {
        label: string;
        value: any;
        color?: string;
        icon?: string;
        disabled?: boolean;
    }

    export interface MaxInputStatusGroupProps {
        modelValue?: any;
        options?: Array<StatusGroupOption | string>;
        multiple?: boolean;
        clearable?: boolean;
        disabled?: boolean;
        size?: 'sm' | 'md' | 'lg';
        label?: string;
        error?: string | boolean | null;
        caution?: string | boolean | null;
        done?: boolean | null;
        required?: boolean | null;
        message?: string;
        icon?: string;
    }

    const props = withDefaults(defineProps<MaxInputStatusGroupProps>(), {
        modelValue: () => [],
        options: () => [],
        multiple: true,
        clearable: false,
        disabled: false,
        size: 'md'
    });

    const emit = defineEmits<{
        'update:modelValue': [value: any];
        'change': [value: any];
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

    const normalizedOptions = computed<StatusGroupOption[]>(() => {
        return props.options.map((opt) => {
            if (typeof opt === 'string' || typeof opt === 'number') return {
                label: String(opt),
                value: opt
            };

            return {
                label: String(opt.label ?? opt.value),
                value: opt.value !== undefined ? opt.value : opt.label,
                color: opt.color,
                icon: opt.icon,
                disabled: opt.disabled
            };
        });
    });

    const isOptionSelected = (opt: StatusGroupOption): boolean => {
        if (props.multiple) {
            if (!Array.isArray(props.modelValue)) return false;
            return props.modelValue.includes(opt.value);
        }
        return props.modelValue === opt.value;
    };

    const hasAnySelection = computed(() => {
        if (props.multiple) return Array.isArray(props.modelValue) && props.modelValue.length > 0;

        return props.modelValue !== null && props.modelValue !== undefined && props.modelValue !== '';
    });

    const getPillClasses = (opt: StatusGroupOption) => {
        return {
            'is-selected': isOptionSelected(opt),
            'is-disabled': props.disabled || opt.disabled
        };
    };

    const getPillStyle = (opt: StatusGroupOption) => {
        if (!opt.color) return {};
        const selected = isOptionSelected(opt);
        if (selected) return {
            backgroundColor: opt.color,
            borderColor: opt.color,
            color: '#ffffff'
        };

        return {
            borderColor: opt.color,
            color: opt.color
        };
    };

    const toggleOption = (opt: StatusGroupOption) => {
        if (props.disabled || opt.disabled) return;
        if (props.multiple) {
            const current = Array.isArray(props.modelValue) ? [...props.modelValue] : [];
            const index = current.indexOf(opt.value);
            if (index > -1) current.splice(index, 1);
            else current.push(opt.value);

            emit('update:modelValue', current);
            emit('change', current);
        } else {
            const next = props.modelValue === opt.value ? null : opt.value;
            emit('update:modelValue', next);
            emit('change', next);
        }
    };

    const clearAll = () => {
        if (props.disabled) return;
        const emptyVal = props.multiple ? [] : null;
        emit('update:modelValue', emptyVal);
        emit('change', emptyVal);
    };
</script>

<style lang="scss" scoped>
    .max-status-group {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px;
        width: 100%;
        padding: 4px 0;

        &.is-disabled {
            opacity: 0.6;
            pointer-events: none;
        }

        &.size-sm .max-status-pill {
            padding: 2px 8px;
            font-size: 11px;
        }

        &.size-md .max-status-pill {
            padding: 4px 12px;
            font-size: 12px;
        }

        &.size-lg .max-status-pill {
            padding: 6px 16px;
            font-size: 13px;
        }
    }

    .max-status-pill {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        border-radius: 9999px;
        border: 1px solid var(--border-color, #d1d5db);
        background: var(--background-50, #f9fafb);
        color: var(--max-neutral-700, #374151);
        cursor: pointer;
        font-weight: 500;
        transition: all 0.15s ease;
        line-height: 1.3;

        &:hover:not(.is-disabled) {
            border-color: var(--max-primary-400, #178da5);
            background: var(--background-100, #f3f4f6);
        }

        &.is-selected {
            background: var(--max-primary-500, #00768e);
            border-color: var(--max-primary-600, #005f77);
            color: #fff;
        }

        &.is-disabled {
            cursor: not-allowed;
            opacity: 0.5;
        }
    }

    .status-pill-check {
        display: inline-flex;
        align-items: center;
    }

    .max-status-clear-btn {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        background: transparent;
        border: none;
        color: var(--max-neutral-500, #6b7280);
        font-size: 11px;
        cursor: pointer;
        padding: 4px 6px;

        &:hover {
            color: var(--max-danger-500, #ef4444);
        }
    }

    @media (prefers-reduced-motion: reduce) {
        .max-status-pill {
            transition: none;
        }
    }
</style>
