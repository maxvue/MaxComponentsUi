<template>
    <div class="max-filter-bar" :class="{ 'is-disabled': props.disabled, 'is-loading': props.loading }" role="region" :aria-label="props.ariaLabel">
        <div class="max-filter-bar__fields">
            <slot :disabled="props.disabled" :loading="props.loading" />
        </div>
        <div class="max-filter-bar__toolbar">
            <div class="max-filter-bar__summary">
                <slot name="summary" :active-count="props.activeCount">
                    <span v-if="props.activeCount > 0" class="max-filter-bar__badge">
                        {{ activeFiltersLabel }}
                    </span>
                </slot>
            </div>
            <div class="max-filter-bar__actions">
                <slot name="actions" :disabled="props.disabled" :loading="props.loading" />
                <button v-if="props.activeCount > 0" type="button" class="max-filter-bar__btn max-filter-bar__btn--clear" :disabled="props.disabled || props.loading" aria-label="Limpar filtros" @click="emit('clear')">
                    Limpar
                </button>
                <button v-if="props.showApply" type="button" class="max-filter-bar__btn max-filter-bar__btn--apply" :disabled="props.disabled || props.loading" aria-label="Aplicar filtros" @click="emit('apply')">
                    <MaxIcon v-if="props.loading" icon="eos-icons:loading" size="14px" aria-hidden="true" />
                    <span>Aplicar</span>
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { computed } from 'vue';
    import MaxIcon from './MaxIcon.vue';
    import type { MaxFilterBarProps } from '../types/filters';

    const props = withDefaults(defineProps<MaxFilterBarProps>(), {
        ariaLabel: 'Filtros',
        activeCount: 0,
        loading: false,
        disabled: false,
        showApply: false
    });

    const emit = defineEmits<{
        apply: [];
        clear: [];
    }>();

    const activeFiltersLabel = computed<string>(() => {
        return `${props.activeCount} ${props.activeCount === 1 ? 'filtro ativo' : 'filtros ativos'}`;
    });
</script>

<style lang="scss" scoped>
.max-filter-bar {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 12px;
    background-color: var(--background-50, #f8fafc);
    border: 1px solid var(--background-200, #e2e8f0);
    border-radius: 8px;
    padding: 12px 16px;
    font-family: Quicksand, sans-serif;

    &.is-disabled {
        opacity: 0.6;
        pointer-events: none;
    }

    &__fields {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 12px;
        width: 100%;
    }

    &__toolbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        border-top: 1px solid var(--background-200, #e2e8f0);
        padding-top: 8px;
        margin-top: 4px;
    }

    &__summary {
        display: flex;
        align-items: center;
    }

    &__badge {
        display: inline-flex;
        align-items: center;
        font-size: 12px;
        font-weight: 700;
        color: var(--max-primary-600, #005F77);
        background-color: var(--max-primary-50, rgb(0 118 142 / 8%));
        padding: 2px 8px;
        border-radius: 9999px;
    }

    &__actions {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-left: auto;
    }

    &__btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        height: 30px;
        padding: 0 12px;
        font-size: 12px;
        font-weight: 600;
        border-radius: 6px;
        cursor: pointer;
        transition: background-color 0.15s ease, border-color 0.15s ease;

        &:focus-visible {
            outline: 2px solid var(--max-focus-ring-color, #00768e);
            outline-offset: 1px;
        }

        &--clear {
            background-color: transparent;
            border: 1px solid var(--background-300, #cbd5e1);
            color: var(--background-700, #334155);

            &:hover:not(:disabled) {
                background-color: var(--background-200, #e2e8f0);
            }
        }

        &--apply {
            background-color: var(--max-primary-500, #00768e);
            border: 1px solid var(--max-primary-600, #005f77);
            color: #fff;

            &:hover:not(:disabled) {
                background-color: var(--max-primary-600, #005f77);
            }
        }

        &:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
    }
}

@media (prefers-reduced-motion: reduce) {
    .max-filter-bar__btn {
        transition: none !important;
    }
}
</style>
