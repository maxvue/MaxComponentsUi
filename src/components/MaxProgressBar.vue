<template>
    <div class="max-progress-bar" :class="[`max-progress-bar--${props.mode}`, `max-progress-bar--${props.severity}`, { 'is-indeterminate': isIndeterminate }]">
        <div v-if="$slots.label || props.valueText" class="max-progress-bar__header">
            <slot name="label" :value="props.value" :clamped-value="clampedValue" :max="safeMax" :percent="percent">
                <span class="max-progress-bar__label-text">{{ defaultLabelText }}</span>
            </slot>
        </div>
        <div class="max-progress-bar__track" :role="roleComputed" :aria-label="props.ariaLabel" :aria-valuemin="0" :aria-valuemax="safeMax" :aria-valuenow="ariaValueNow" :aria-valuetext="ariaValueText">
            <div class="max-progress-bar__fill" :style="fillStyle" />
        </div>
        <div v-if="$slots.details" class="max-progress-bar__details">
            <slot name="details" />
        </div>
    </div>
</template>

<script setup lang="ts">
    import { computed } from 'vue';
    import type { MaxProgressBarProps } from '../types/progress';

    const props = withDefaults(defineProps<MaxProgressBarProps>(), {
        max: 100,
        mode: 'progress',
        severity: 'info',
        valueText: undefined
    });

    const safeMax = computed<number>(() => {
        if (typeof props.max !== 'number' || isNaN(props.max) || !isFinite(props.max) || props.max <= 0) return 100;

        return props.max;
    });

    const isNumericValue = computed<boolean>(() => {
        return typeof props.value === 'number' && !isNaN(props.value) && isFinite(props.value);
    });

    const isIndeterminate = computed<boolean>(() => {
        return !isNumericValue.value;
    });

    const clampedValue = computed<number>(() => {
        if (!isNumericValue.value || props.value === null) return 0;
        return Math.min(Math.max(0, props.value), safeMax.value);
    });

    const percent = computed<number>(() => {
        if (!isNumericValue.value || props.value === null) return 0;
        return Math.round((clampedValue.value / safeMax.value) * 100);
    });

    const roleComputed = computed<'progressbar' | 'meter'>(() => {
        return props.mode === 'meter' ? 'meter' : 'progressbar';
    });

    const ariaValueNow = computed<number | undefined>(() => {
        if (!isNumericValue.value) return undefined;
        return clampedValue.value;
    });

    const ariaValueText = computed<string | undefined>(() => {
        if (props.valueText) return props.valueText;
        if (!isNumericValue.value) return undefined;
        return `${percent.value}%`;
    });

    const defaultLabelText = computed<string>(() => {
        if (props.valueText) return props.valueText;
        if (!isNumericValue.value) return 'Indeterminado';
        return `${props.value} / ${safeMax.value}`;
    });

    const fillStyle = computed(() => {
        if (isIndeterminate.value) return {};
        return {
            width: `${percent.value}%`
        };
    });
</script>

<style lang="scss" scoped>
.max-progress-bar {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-family: Quicksand, sans-serif;

    &__header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 13px;
        font-weight: 600;
        color: var(--background-700, #334155);
    }

    &__track {
        width: 100%;
        height: 8px;
        background-color: var(--background-200, #e2e8f0);
        border-radius: 9999px;
        overflow: hidden;
        position: relative;
    }

    &__fill {
        height: 100%;
        border-radius: 9999px;
        transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);

        @media (prefers-reduced-motion: reduce) {
            transition: none !important;
            animation: none !important;
        }
    }

    &--info .max-progress-bar__fill {
        background-color: var(--max-primary-500, #00768e);
    }

    &--success .max-progress-bar__fill {
        background-color: var(--max-success-500, #10b981);
    }

    &--warning .max-progress-bar__fill {
        background-color: var(--max-warning-500, #f59e0b);
    }

    &--danger .max-progress-bar__fill {
        background-color: var(--max-danger-500, #ef4444);
    }

    &.is-indeterminate .max-progress-bar__fill {
        width: 40%;
        position: absolute;
        animation: max-progress-indeterminate 1.5s infinite ease-in-out;

        @media (prefers-reduced-motion: reduce) {
            animation: none;
            width: 100%;
            opacity: 0.5;
        }
    }

    &__details {
        font-size: 12px;
        color: var(--background-600, #475569);
    }
}

@keyframes max-progress-indeterminate {
    0% {
        left: -40%;
    }

    100% {
        left: 100%;
    }
}
</style>
