<template>
    <InputBase v-bind="{ ...props, ...attrsWithoutModelProps }" class="max-input-date-range" :error="resolvedError" :icon="props.icon ?? 'solar:calendar-line-duotone'">
        <template #default="{ inputAttrs }">
            <div class="max-daterange-container" :class="{ 'is-disabled': props.disabled }">
                <input ref="startInputRef" type="text" inputmode="numeric" class="max-daterange-input" :class="{ 'is-invalid': isOrderInvalid }" v-bind="inputAttrs" :id="props.id ? `${props.id}-start` : undefined" v-model="startDisplay" v-maska="dateMask" :placeholder="props.placeholderStart ?? 'Início'" :disabled="props.disabled" :readonly="props.readonly" aria-label="Data de início" @blur="onStartBlur" @input="onInputChanged" />
                <span class="max-daterange-separator" aria-hidden="true">{{ props.separator ?? 'até' }}</span>
                <input ref="endInputRef" type="text" inputmode="numeric" class="max-daterange-input" :class="{ 'is-invalid': isOrderInvalid }" :autocomplete="inputAttrs.autocomplete" :id="props.id ? `${props.id}-end` : undefined" v-model="endDisplay" v-maska="dateMask" :placeholder="props.placeholderEnd ?? 'Fim'" :disabled="props.disabled" :readonly="props.readonly" aria-label="Data de fim" @blur="onEndBlur" @input="onInputChanged" />
            </div>
        </template>
    </InputBase>
</template>

<script setup lang="ts">
    import { ref, computed, watch, useAttrs } from 'vue';
    import { vMaska } from 'maska/vue';
    import InputBase from './InputBase.vue';

    defineOptions({
        name: 'MaxInputDateRange',
        inheritAttrs: false
    });

    export interface MaxInputDateRangeProps {
        modelValue?: [string | null, string | null] | { start?: string | null; end?: string | null } | null;
        placeholderStart?: string;
        placeholderEnd?: string;
        separator?: string;
        min?: string;
        max?: string;
        disabled?: boolean;
        readonly?: boolean;
        label?: string;
        id?: string;
        error?: string | boolean | null;
        caution?: string | boolean | null;
        done?: boolean | null;
        required?: boolean | null;
        message?: string;
        icon?: string;
    }

    const props = withDefaults(defineProps<MaxInputDateRangeProps>(), {
        modelValue: () => [null, null],
        placeholderStart: 'Início',
        placeholderEnd: 'Fim',
        separator: 'até',
        disabled: false,
        readonly: false
    });

    const emit = defineEmits<{
        'update:modelValue': [value: [string | null, string | null]];
        'change': [value: [string | null, string | null]];
    }>();

    const attrs = useAttrs();
    const attrsWithoutModelProps = computed(() => {
        const { modelValue: _, ...rest } = attrs;
        return rest;
    });

    const dateMask = {
        tokens: { '#': { pattern: /[0-9]/ } },
        mask: '##/##/####'
    };

    const startInputRef = ref<HTMLInputElement | null>(null);
    const endInputRef = ref<HTMLInputElement | null>(null);

    const parseToDisplay = (val: string | null | undefined): string => {
        if (!val) return '';
        const trimmed = String(val).trim();
        if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
            const [y, m, d] = trimmed.slice(0, 10).split('-');
            return `${d}/${m}/${y}`;
        }
        return trimmed;
    };

    const parseToIso = (display: string): string | null => {
        const cleaned = display.replace(/\D/g, '');
        if (cleaned.length !== 8) return null;
        const d = cleaned.slice(0, 2);
        const m = cleaned.slice(2, 4);
        const y = cleaned.slice(4, 8);
        return `${y}-${m}-${d}`;
    };

    const extractStartEnd = (): [string, string] => {
        if (!props.modelValue) return ['', ''];
        if (Array.isArray(props.modelValue)) return [parseToDisplay(props.modelValue[0]), parseToDisplay(props.modelValue[1])];

        if (typeof props.modelValue === 'object') return [parseToDisplay(props.modelValue.start), parseToDisplay(props.modelValue.end)];

        return ['', ''];
    };

    const [initStart, initEnd] = extractStartEnd();
    const startDisplay = ref(initStart);
    const endDisplay = ref(initEnd);

    watch(() => props.modelValue, () => {
        const [nextS, nextE] = extractStartEnd();
        if (nextS !== startDisplay.value) startDisplay.value = nextS;
        if (nextE !== endDisplay.value) endDisplay.value = nextE;
    }, { deep: true });

    const isOrderInvalid = computed(() => {
        const isoStart = parseToIso(startDisplay.value);
        const isoEnd = parseToIso(endDisplay.value);
        if (isoStart && isoEnd) return isoStart > isoEnd;

        return false;
    });

    const resolvedError = computed(() => {
        if (props.error) return props.error;
        if (isOrderInvalid.value) return 'A data inicial não pode ser maior que a data final';
        return undefined;
    });

    const emitCurrentValue = () => {
        const isoStart = parseToIso(startDisplay.value) ?? (startDisplay.value.trim() ? startDisplay.value.trim() : null);
        const isoEnd = parseToIso(endDisplay.value) ?? (endDisplay.value.trim() ? endDisplay.value.trim() : null);
        const result: [string | null, string | null] = [isoStart, isoEnd];
        emit('update:modelValue', result);
        emit('change', result);
    };

    const onInputChanged = () => {
        emitCurrentValue();
    };

    const onStartBlur = () => {
        emitCurrentValue();
    };

    const onEndBlur = () => {
        emitCurrentValue();
    };
</script>

<style lang="scss" scoped>
    .max-daterange-container {
        display: flex;
        align-items: center;
        width: 100%;
        gap: 6px;

        &.is-disabled {
            opacity: 0.6;
            pointer-events: none;
        }
    }

    .max-daterange-input {
        flex: 1;
        min-width: 0;
        background: transparent;
        border: none;
        outline: none;
        font-size: 13px;
        color: inherit;
        text-align: center;

        &::placeholder {
            color: var(--max-neutral-400, #9ca3af);
        }

        &.is-invalid {
            color: var(--max-danger-500, #ef4444);
        }

        &:focus-visible {
            outline: var(--max-focus-outline, 2px solid var(--max-focus-ring-color, #00768e));
        }
    }

    .max-daterange-separator {
        font-size: 12px;
        color: var(--max-neutral-500, #6b7280);
        user-select: none;
        padding: 0 2px;
    }
</style>
