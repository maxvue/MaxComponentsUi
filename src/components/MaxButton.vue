<template>
    <button
        v-if="props.label"
        type="button"
        class="max-button"
        :class="buttonClasses"
        :disabled="props.disabled || props.loading"
        @click="onClick"
    >
        <MaxIcon
            v-if="showIcon && iconPos === 'left'"
            :icon="loading ? 'loading' : (props.icon ?? props.i)"
            :size="props.size ?? props.sizeIcon ?? props.iconSize ?? '1'"
            class="content-button-icon"
            :dark="props.dark"
            :light="light"
            :color="iconColor"
            :flex="loading"
        />
        <span class="max-button-label"><slot></slot>{{ props.label && !$slots.default ? props.label : '' }}</span>
        <MaxIcon
            v-if="showIcon && iconPos === 'right'"
            :icon="loading ? 'loading' : (props.icon ?? props.i)"
            :size="props.size ?? props.sizeIcon ?? props.iconSize ?? '1'"
            class="content-button-icon"
            :dark="props.dark"
            :light="light"
            :color="iconColor"
            :flex="loading"
        />
    </button>
    <MaxIconButton v-bind="props" v-else class="icon-button-b" />
</template>

<script setup lang="ts">
    import { computed, useSlots } from 'vue';
    import MaxIcon from './MaxIcon.vue';
    import MaxIconButton from './MaxIconButton.vue';
    import { goToRoute } from '@maxvue/max-use';
    import type { MaxButtonsType } from '../types';

    const $slots = useSlots();

    const props = withDefaults(defineProps<MaxButtonsType>(), {
        iconSize: 1.4,
        dark: undefined,
        route: null,
        params: () => ({}),
        data: () => ({}),
        query: () => ({}),
        uppercase: false
    });

    const isTransparentVariant = computed(() => props.variant === 'outlined' || props.variant === 'text' || props.variant === 'link' || props.dashed === true);
    const light = computed(() => props.dark || isTransparentVariant.value ? undefined : 0.7);
    const iconColor = computed(() => isTransparentVariant.value ? 'currentColor' : undefined);

    const iconPos = computed<'left' | 'right'>(() => {
        if (props.iconRight) return 'right';
        if (props.iconPos) return props.iconPos;
        return 'left';
    });

    const showIcon = computed(() => Boolean(props.loading || props.icon || props.i));

    const buttonClasses = computed(() => ({
        [`p-button-${props.severity}`]: Boolean(props.severity),
        [`max-button-${props.severity}`]: Boolean(props.severity),
        [`p-button-${props.variant}`]: Boolean(props.variant),
        [`max-button-${props.variant}`]: Boolean(props.variant),
        'max-button-dashed': props.dashed,
        'max-button-uppercase': props.uppercase,
        'max-button-loading': props.loading,
        'p-button-sm': props.size === 'small' || props.size === 'sm',
        'p-button-lg': props.size === 'large' || props.size === 'lg'
    }));

    const data = computed(() => ({ ...(props.data ?? {}), ...(props.query ?? {}), ...(props.params ?? {}) }));

    const emit = defineEmits<{
        click: [value: boolean];
    }>();

    const onClick = (event: any) => {
        if (props.route) {
            goToRoute(props.route, { ...(props.params ?? {}), ...(props.data ?? {}), ...(props.query ?? {}) });
            return;
        }

        if (props.action) {
            props.action({ event: event, data: data.value });
            return;
        }

        emit('click', true);
    };
</script>

<style lang="scss">
    .max-button {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        justify-content: center;
        border: 1px solid transparent;
        border-radius: 6px;
        padding: 0.5rem 1rem;
        cursor: pointer;
        font-weight: 500;
        font-family: inherit;
        background: var(--primary-500);
        color: #fff;
        border-color: var(--primary-500);
        transition: background 0.2s, color 0.2s, border-color 0.2s;

        &:hover {
            background: var(--primary-600);
            border-color: var(--primary-600);
        }

        &:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }

        &.max-button-uppercase {
            text-transform: uppercase;
        }

        &.max-button-secondary, &.p-button-secondary {
            background: var(--background-500);
            border-color: var(--background-500);
            color: #fff;
            &:hover { background: var(--background-600); border-color: var(--background-600); }
        }

        &.max-button-success, &.p-button-success {
            background: var(--success-500, #22c55e);
            border-color: var(--success-500, #22c55e);
            color: #fff;
            &:hover { background: var(--success-600, #16a34a); border-color: var(--success-600, #16a34a); }
        }

        &.max-button-info, &.p-button-info {
            background: var(--info-500, #0ea5e9);
            border-color: var(--info-500, #0ea5e9);
            color: #fff;
            &:hover { background: var(--info-600, #0284c7); border-color: var(--info-600, #0284c7); }
        }

        &.max-button-warning, &.p-button-warning, &.p-button-warn {
            background: var(--warning-500, #f59e0b);
            border-color: var(--warning-500, #f59e0b);
            color: #fff;
            &:hover { background: var(--warning-600, #d97706); border-color: var(--warning-600, #d97706); }
        }

        &.max-button-danger, &.p-button-danger {
            background: var(--danger-500, #ef4444);
            border-color: var(--danger-500, #ef4444);
            color: #fff;
            &:hover { background: var(--danger-600, #dc2626); border-color: var(--danger-600, #dc2626); }
        }

        &.max-button-whatsapp {
            background: #25d366;
            border-color: #25d366;
            color: #fff;
            &:hover { background: #1da851; border-color: #1da851; }
        }

        &.max-button-contrast, &.p-button-contrast {
            background: var(--background-900, #111827);
            border-color: var(--background-900, #111827);
            color: #fff;
            &:hover { background: var(--background-950, #030712); border-color: var(--background-950, #030712); }
        }

        &.max-button-outlined, &.p-button-outlined {
            background: transparent;
            border-color: currentcolor;
            color: var(--primary-500);
            &:hover { background: color-mix(in srgb, currentcolor 10%, transparent); }
        }

        &.max-button-text, &.p-button-text {
            background: transparent;
            border-color: transparent;
            color: var(--primary-500);
            &:hover { background: color-mix(in srgb, currentcolor 10%, transparent); }
        }

        &.max-button-link, &.p-button-link {
            background: transparent;
            border-color: transparent;
            color: var(--primary-500);
            text-decoration: underline;
            padding: 0;
        }
    }

    .icon-button-b {
        /* min-width: 15px; */

        /* min-height: 15px; */
    }

    .max-button-dashed {
        background: transparent !important;
        border-style: dashed !important;
        border-width: 1px;
        color: var(--primary-500) !important;

        &:hover,
        &:active,
        &:focus {
            background: transparent !important;
        }

        &.p-button-secondary, &.max-button-secondary {
            color: var(--background-500) !important;
        }

        &.p-button-success, &.max-button-success {
            color: var(--success-500, #22c55e) !important;
        }

        &.p-button-info, &.max-button-info {
            color: var(--info-500, #0ea5e9) !important;
        }

        &.p-button-warn,
        &.p-button-warning,
        &.max-button-warning {
            color: var(--warning-500, #f59e0b) !important;
        }

        &.p-button-help, &.max-button-help {
            color: var(--help-color, #a855f7) !important;
        }

        &.p-button-danger, &.max-button-danger {
            color: var(--danger-500, #ef4444) !important;
        }

        &.p-button-contrast, &.max-button-contrast {
            color: var(--background-900, #111827) !important;
        }

        .content-button-icon {
            .max-icon-div,
            .max-icon {
                color: inherit !important;
            }

            svg {
                fill: currentcolor !important;
                color: inherit !important;
            }
        }
    }

    .p-button-outlined,
    .p-button-text,
    .p-button-link,
    .max-button-outlined,
    .max-button-text,
    .max-button-link,
    [data-p~='outlined'],
    [data-p~='text'],
    [data-p~='link'] {
        .content-button-icon {
            .max-icon-div,
            .max-icon {
                color: inherit !important;
            }

            svg {
                fill: currentcolor !important;
                color: inherit !important;
            }
        }
    }
</style>
