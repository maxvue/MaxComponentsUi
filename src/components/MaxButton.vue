<template>
    <button
        v-if="props.label"
        :class="buttonClass"
        :data-p="dataP"
        :type="buttonType"
        :disabled="isDisabled"
        :aria-busy="props.loading || undefined"
        :uppercase="props.uppercase || undefined"
        @click="onClick"
    >
        <span class="p-button-icon p-button-icon-left" v-if="iconPos === 'left' && iconName && !props.loading">
            <MaxIcon :icon="iconName" :size="props.size ?? props.sizeIcon ?? props.iconSize ?? '1'" class="content-button-icon" :dark="props.dark" :light="light" :color="iconColor" />
        </span>
        <span class="p-button-icon" v-if="props.loading">
            <slot name="loadingicon">
                <MaxIcon icon="loading" :size="props.size ?? props.sizeIcon ?? props.iconSize ?? '1'" class="content-button-icon" />
            </slot>
        </span>
        <span class="p-button-label">
            <slot>{{ props.label }}</slot>
        </span>
        <span class="p-button-icon p-button-icon-right" v-if="iconPos === 'right' && iconName && !props.loading">
            <MaxIcon :icon="iconName" :size="props.size ?? props.sizeIcon ?? props.iconSize ?? '1'" class="content-button-icon" :dark="props.dark" :light="light" :color="iconColor" />
        </span>
    </button>
    <MaxIconButton v-bind="props" v-else class="icon-button-b" />
</template>

<script setup lang="ts">
    import { computed, useAttrs } from 'vue';
    import MaxIcon from './MaxIcon.vue';
    import MaxIconButton from './MaxIconButton.vue';
    import { goToRoute } from '@maxvue/max-use';
    import { MaxButtonsType } from '../types';

    const props = withDefaults(defineProps<MaxButtonsType>(), {
        iconSize: 1.4,
        dark: undefined,
        route: null,
        params: {},
        data: {},
        query: {},
        uppercase: false,
        disabled: false,
        loading: false,
        outlined: false,
        text: false,
        link: false,
        raised: false,
        rounded: false,
        plain: false,
        fluid: false,
        dashed: false
    });

    const attrs = useAttrs();

    const isTrueProp = (val: unknown): boolean => val === true || val === '' || val === 'true';

    const isDisabled = computed(() => isTrueProp(props.disabled) || isTrueProp(attrs.disabled) || isTrueProp(props.loading) || isTrueProp(attrs.loading));
    const buttonType = computed<'button' | 'submit' | 'reset'>(() => (props.type === 'submit' || props.type === 'reset' || attrs.type === 'submit' || attrs.type === 'reset' ? (props.type ?? attrs.type) as 'submit' | 'reset' : 'button'));
    const iconName = computed<string>(() => (props.icon ?? props.i ?? props.iconRight ?? attrs.icon ?? attrs.i ?? attrs.iconRight ?? '') as string);

    const variantFlags = computed(() => ({
        outlined: isTrueProp(props.outlined) || isTrueProp(attrs.outlined) || props.variant === 'outlined' || attrs.variant === 'outlined',
        text: isTrueProp(props.text) || isTrueProp(attrs.text) || props.variant === 'text' || attrs.variant === 'text',
        link: isTrueProp(props.link) || isTrueProp(attrs.link) || props.variant === 'link' || attrs.variant === 'link'
    }));

    const isWarnSeverity = computed(() => {
        const sev = (props.severity ?? attrs.severity) as string;
        return sev === 'warning' || sev === 'warn';
    });

    const buttonClass = computed(() => {
        const sev = props.severity ?? attrs.severity;
        return {
            'p-button': true,
            'p-component': true,
            [`p-button-${sev}`]: !!sev,
            'p-button-warn': isWarnSeverity.value,
            'p-button-warning': isWarnSeverity.value,
            'p-button-outlined': variantFlags.value.outlined,
            'p-button-text': variantFlags.value.text,
            'p-button-link': variantFlags.value.link,
            'p-button-raised': isTrueProp(props.raised) || isTrueProp(attrs.raised),
            'p-button-rounded': isTrueProp(props.rounded) || isTrueProp(attrs.rounded),
            'p-button-plain': isTrueProp(props.plain) || isTrueProp(attrs.plain),
            'p-button-fluid': isTrueProp(props.fluid) || isTrueProp(attrs.fluid),
            'p-button-loading': isTrueProp(props.loading) || isTrueProp(attrs.loading),
            'p-button-sm': props.size === 'small' || attrs.size === 'small',
            'p-button-lg': props.size === 'large' || attrs.size === 'large',
            'p-disabled': isDisabled.value,
            'max-button-dashed': isTrueProp(props.dashed) || isTrueProp(attrs.dashed)
        };
    });

    const dataP = computed(() => {
        const tokens: string[] = [];
        if (variantFlags.value.outlined) tokens.push('outlined');
        if (variantFlags.value.text) tokens.push('text');
        if (variantFlags.value.link) tokens.push('link');
        if (props.severity) tokens.push(props.severity);
        return tokens.length ? tokens.join(' ') : undefined;
    });

    const isTransparentVariant = computed(() => variantFlags.value.outlined || variantFlags.value.text || variantFlags.value.link || isTrueProp(props.dashed));
    const light = computed(() => props.dark || isTransparentVariant.value ? undefined : 0.7);
    const iconColor = computed(() => isTransparentVariant.value ? 'currentColor' : undefined);

    const iconPos = computed<'left' | 'right'>(() => {
        if (props.iconRight) return 'right';
        if (props.iconPos) return props.iconPos;
        return 'left';
    });

    const data = computed(() => ({ ...(props.data ?? {}), ...(props.query ?? {}), ...(props.params ?? {}) }));

    const emit = defineEmits<{
        click: [value: boolean];
    }>();

    const onClick = (event: any) => {
        if (isDisabled.value) return;

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
    .p-button {
        display: inline-flex;
        cursor: pointer;
        user-select: none;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        position: relative;
        color: var(--p-button-primary-color, #fff);
        background: var(--p-button-primary-background, var(--max-primary-500, #3b82f6));
        border: 1px solid var(--p-button-primary-border-color, var(--max-primary-500, #3b82f6));
        padding: 0.5rem 1rem;
        font-size: 1rem;
        font-weight: 500;
        font-family: inherit;
        border-radius: 6px;
        gap: 0.5rem;
        transition: background-color 0.2s, color 0.2s, border-color 0.2s, box-shadow 0.2s;

        &:hover {
            background: var(--p-button-primary-hover-background, var(--max-primary-600, #2563eb));
            border-color: var(--p-button-primary-hover-border-color, var(--max-primary-600, #2563eb));
        }

        &.p-disabled,
        &:disabled {
            opacity: 0.6;
            cursor: default;
            pointer-events: none;
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

        /* Texto/ícone na mesma cor da borda (mesmo token de severidade do PrimeVue) */
        color: var(--max-button-primary-border-color) !important;

        &:hover,
        &:active,
        &:focus {
            background: transparent !important;
        }

        &.p-button-secondary {
            color: var(--max-button-secondary-border-color) !important;
        }

        &.p-button-success {
            color: var(--max-button-success-border-color) !important;
        }

        &.p-button-info {
            color: var(--max-button-info-border-color) !important;
        }

        &.p-button-warn,
        &.p-button-warning {
            color: var(--max-button-warn-border-color) !important;
        }

        &.p-button-help {
            color: var(--max-button-help-border-color) !important;
        }

        &.p-button-danger {
            color: var(--max-button-danger-border-color) !important;
        }

        &.p-button-contrast {
            color: var(--max-button-contrast-border-color) !important;
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
