<template>
    <div class="max-period-navigator" :class="{ 'is-disabled': props.disabled }" role="group" :aria-label="props.ariaLabel">
        <button type="button" class="max-period-navigator__btn max-period-navigator__btn--prev" :disabled="isPrevDisabled" aria-label="Mês anterior" @click="goToPrevMonth">
            <MaxIcon icon="lucide:chevron-left" size="18px" aria-hidden="true" />
        </button>
        <div class="max-period-navigator__label" aria-live="polite">
            <slot name="label" :period="props.modelValue" :formatted="formattedPeriod">
                <span class="max-period-navigator__text">{{ formattedPeriod }}</span>
            </slot>
        </div>
        <button type="button" class="max-period-navigator__btn max-period-navigator__btn--next" :disabled="isNextDisabled" aria-label="Próximo mês" @click="goToNextMonth">
            <MaxIcon icon="lucide:chevron-right" size="18px" aria-hidden="true" />
        </button>
        <button v-if="props.currentPeriod" type="button" class="max-period-navigator__btn max-period-navigator__btn--current" :disabled="isCurrentDisabled" aria-label="Ir para o mês atual" @click="goToCurrentMonth">
            Mês atual
        </button>
    </div>
</template>

<script setup lang="ts">
    import { computed } from 'vue';
    import MaxIcon from './MaxIcon.vue';
    import type { MaxMonthPeriod, MaxPeriodNavigatorProps } from '../types/period';

    const props = withDefaults(defineProps<MaxPeriodNavigatorProps>(), {
        currentPeriod: undefined,
        minPeriod: undefined,
        maxPeriod: undefined,
        disabled: false,
        ariaLabel: 'Selecionar mês'
    });

    const emit = defineEmits<{
        'update:modelValue': [period: MaxMonthPeriod];
    }>();

    const MONTH_NAMES = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    const toPeriodNum = (p: MaxMonthPeriod): number => {
        return p.year * 100 + p.month;
    };

    const formattedPeriod = computed<string>(() => {
        const m = Math.max(1, Math.min(12, props.modelValue.month));
        const monthName = MONTH_NAMES[m - 1] ?? '';
        return `${monthName} de ${props.modelValue.year}`;
    });

    const prevMonthPeriod = computed<MaxMonthPeriod>(() => {
        if (props.modelValue.month === 1) return { year: props.modelValue.year - 1, month: 12 };

        return { year: props.modelValue.year, month: props.modelValue.month - 1 };
    });

    const nextMonthPeriod = computed<MaxMonthPeriod>(() => {
        if (props.modelValue.month === 12) return { year: props.modelValue.year + 1, month: 1 };

        return { year: props.modelValue.year, month: props.modelValue.month + 1 };
    });

    const isPrevDisabled = computed<boolean>(() => {
        if (props.disabled) return true;
        if (!props.minPeriod) return false;
        return toPeriodNum(prevMonthPeriod.value) < toPeriodNum(props.minPeriod);
    });

    const isNextDisabled = computed<boolean>(() => {
        if (props.disabled) return true;
        if (!props.maxPeriod) return false;
        return toPeriodNum(nextMonthPeriod.value) > toPeriodNum(props.maxPeriod);
    });

    const isCurrentDisabled = computed<boolean>(() => {
        if (props.disabled || !props.currentPeriod) return true;
        if (toPeriodNum(props.modelValue) === toPeriodNum(props.currentPeriod)) return true;
        if (props.minPeriod && toPeriodNum(props.currentPeriod) < toPeriodNum(props.minPeriod)) return true;
        if (props.maxPeriod && toPeriodNum(props.currentPeriod) > toPeriodNum(props.maxPeriod)) return true;
        return false;
    });

    const goToPrevMonth = (): void => {
        if (isPrevDisabled.value) return;
        emit('update:modelValue', { ...prevMonthPeriod.value });
    };

    const goToNextMonth = (): void => {
        if (isNextDisabled.value) return;
        emit('update:modelValue', { ...nextMonthPeriod.value });
    };

    const goToCurrentMonth = (): void => {
        if (isCurrentDisabled.value || !props.currentPeriod) return;
        emit('update:modelValue', { ...props.currentPeriod });
    };
</script>

<style lang="scss" scoped>
.max-period-navigator {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-family: Quicksand, sans-serif;
    user-select: none;

    &.is-disabled {
        opacity: 0.6;
        pointer-events: none;
    }

    &__label {
        font-weight: 700;
        font-size: 14px;
        color: var(--background-900, #0f172a);
        min-width: 140px;
        text-align: center;
    }

    &__btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background-color: var(--background-100, #f1f5f9);
        border: 1px solid var(--background-200, #e2e8f0);
        border-radius: 6px;
        color: var(--background-700, #334155);
        cursor: pointer;
        transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;

        &:not(:disabled):hover {
            background-color: var(--background-200, #e2e8f0);
            color: var(--max-primary-600, #005F77);
        }

        &:disabled {
            opacity: 0.4;
            cursor: not-allowed;
        }

        &:focus-visible {
            outline: 2px solid var(--max-focus-ring-color, #00768e);
            outline-offset: 1px;
        }

        &--prev,
        &--next {
            width: 32px;
            height: 32px;
            padding: 0;
        }

        &--current {
            height: 32px;
            padding: 0 12px;
            font-size: 12px;
            font-weight: 600;
        }
    }
}

@media (prefers-reduced-motion: reduce) {
    .max-period-navigator__btn {
        transition: none !important;
    }
}
</style>
