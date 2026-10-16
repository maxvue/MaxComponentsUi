<template>
    <div v-if="hasContent" :id="props.id" class="max-alert" :class="[`max-alert--${props.severity}`, { 'is-closable': props.closable }]" :role="roleComputed" :aria-live="liveComputed">
        <div class="max-alert__icon-wrapper" aria-hidden="true">
            <slot name="icon">
                <MaxIcon :icon="defaultIcon" size="20px" class="max-alert__icon" />
            </slot>
        </div>
        <div class="max-alert__content">
            <div v-if="props.title" class="max-alert__title">{{ props.title }}</div>
            <div v-if="props.message" class="max-alert__message">{{ props.message }}</div>
            <slot />
        </div>
        <div v-if="$slots.actions || props.closable" class="max-alert__actions">
            <slot name="actions" />
            <button v-if="props.closable" type="button" class="max-alert__close-button" aria-label="Fechar alerta" @click="emit('close')">
                <MaxIcon icon="lucide:x" size="16px" aria-hidden="true" />
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { computed, useSlots } from 'vue';
    import MaxIcon from './MaxIcon.vue';
    import type { MaxAlertProps } from '../types/feedback';

    const props = withDefaults(defineProps<MaxAlertProps>(), {

        severity: 'info',
        title: undefined,
        message: undefined,
        id: undefined,
        live: undefined,
        closable: false
    });

    const emit = defineEmits<{
        close: [];
    }>();

    const slots = useSlots();

    const hasContent = computed<boolean>(() => {
        return Boolean(props.title || props.message || slots.default);
    });

    const roleComputed = computed<string>(() => {
        return props.severity === 'danger' ? 'alert' : 'status';
    });

    const liveComputed = computed<'polite' | 'assertive' | undefined>(() => {
        if (props.live === 'off') return undefined;
        if (props.live) return props.live;
        return props.severity === 'danger' ? 'assertive' : 'polite';
    });

    const defaultIcon = computed<string>(() => {
        switch (props.severity) {
            case 'success':
                return 'lucide:check-circle-2';
            case 'warning':
                return 'lucide:alert-triangle';
            case 'danger':
                return 'lucide:alert-circle';
            case 'info':
            default:
                return 'lucide:info';
        }
    });
</script>

<style lang="scss" scoped>
.max-alert {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 12px 16px;
    border-radius: 8px;
    font-family: Quicksand, sans-serif;
    font-size: 14px;
    line-height: 1.4;
    border: 1px solid transparent;
    transition: background-color 0.2s ease, border-color 0.2s ease;

    &--info {
        background-color: var(--max-info-50, rgb(14 165 233 / 8%));
        border-color: var(--max-info-200, rgb(14 165 233 / 25%));
        color: var(--max-info-800, #0369a1);

        .max-alert__icon {
            color: var(--max-info-500, #0ea5e9);
        }
    }

    &--success {
        background-color: var(--max-success-50, rgb(16 185 129 / 8%));
        border-color: var(--max-success-200, rgb(16 185 129 / 25%));
        color: var(--max-success-800, #065f46);

        .max-alert__icon {
            color: var(--max-success-500, #10b981);
        }
    }

    &--warning {
        background-color: var(--max-warning-50, rgb(245 158 11 / 8%));
        border-color: var(--max-warning-200, rgb(245 158 11 / 25%));
        color: var(--max-warning-800, #92400e);

        .max-alert__icon {
            color: var(--max-warning-500, #f59e0b);
        }
    }

    &--danger {
        background-color: var(--max-danger-50, rgb(239 68 68 / 8%));
        border-color: var(--max-danger-200, rgb(239 68 68 / 25%));
        color: var(--max-danger-800, #991b1b);

        .max-alert__icon {
            color: var(--max-danger-500, #ef4444);
        }
    }

    &__icon-wrapper {
        flex-shrink: 0;
        display: flex;
        align-items: center;
        margin-top: 1px;
    }

    &__content {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 4px;
        min-width: 0;
    }

    &__title {
        font-weight: 700;
        font-size: 14px;
    }

    &__message {
        font-size: 13px;
        opacity: 0.95;
    }

    &__actions {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-shrink: 0;
        margin-left: auto;
    }

    &__close-button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: transparent;
        border: none;
        padding: 4px;
        border-radius: 4px;
        cursor: pointer;
        color: inherit;
        opacity: 0.7;
        transition: opacity 0.15s ease, background-color 0.15s ease;

        &:hover {
            opacity: 1;
            background-color: rgb(0 0 0 / 6%);
        }

        &:focus-visible {
            outline: 2px solid var(--max-focus-ring-color, #00768e);
            outline-offset: 1px;
        }
    }
}

@media (prefers-reduced-motion: reduce) {
    .max-alert,
    .max-alert__close-button {
        transition: none !important;
    }
}
</style>
