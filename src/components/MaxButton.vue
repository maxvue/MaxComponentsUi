<template>
    <button
        v-if="props.label || Boolean($slots.default)"
        :type="resolvedType"
        class="max-button"
        :class="buttonClasses"
        :disabled="props.disabled || props.loading"
        @click="onClick"
    >
        <MaxIcon
            v-if="showIcon && iconPos === 'left'"
            :icon="loading ? 'eos-icons:loading' : (props.icon ?? props.i)"
            :size="resolvedIconSize"
            class="content-button-icon"
            :dark="props.dark"
            :light="light"
            :color="iconColor"
        />
        <span class="max-button-label"><slot>{{ props.label }}</slot></span>
        <MaxIcon
            v-if="showIcon && iconPos === 'right'"
            :icon="loading ? 'eos-icons:loading' : (props.icon ?? props.i)"
            :size="resolvedIconSize"
            class="content-button-icon"
            :dark="props.dark"
            :light="light"
            :color="iconColor"
        />
    </button>
    <MaxIconButton v-bind="props" v-else />
</template>

<script setup lang="ts">
    import { computed, useSlots, useAttrs } from 'vue';
    import MaxIcon from './MaxIcon.vue';
    import MaxIconButton from './MaxIconButton.vue';
    import { goToRoute } from '@maxvue/max-use';
    import type { MaxButtonsType } from '../types';

    const $slots = useSlots();
    const attrs = useAttrs();

    const props = withDefaults(defineProps<MaxButtonsType>(), {
        iconSize: 1.4,
        dark: undefined,
        route: null,
        params: () => ({}),
        data: () => ({}),
        query: () => ({}),
        uppercase: false
    });

    const _isTransparentVariant = computed(() => props.variant === 'outlined' || props.variant === 'text' || props.variant === 'link' || props.dashed === true);
    const light = computed(() => undefined);
    const iconColor = computed(() => 'currentColor');

    const iconPos = computed<'left' | 'right'>(() => {
        if (props.iconRight) return 'right';
        if (props.iconPos) return props.iconPos;
        return 'left';
    });

    const resolvedType = computed(() => (props.type as any) ?? (attrs.type as any) ?? 'button');

    const showIcon = computed(() => Boolean(props.loading || props.icon || props.i));

    // `size` é o tamanho do BOTÃO ('small'/'large'), não do ícone. Enquanto o
    // Button do PrimeVue existia ele consumia essa prop e ela nunca chegava ao
    // MaxIcon; com o <button> nativo ela passou a vazar para :size e a mandar a
    // string 'small' como tamanho do ícone. Só aceitamos `size` aqui quando for
    // numérico (uso legado como tamanho de ícone); caso contrário cai no
    // sizeIcon/iconSize, cujo default é 1.4.
    const isNumericSize = (v: unknown) => v !== null && v !== undefined && v !== '' && !isNaN(Number(v));

    const resolvedIconSize = computed<string | number>(() => {
        if (isNumericSize(props.size)) return props.size as string | number;
        return props.sizeIcon ?? props.iconSize ?? '1';
    });

    const buttonClasses = computed(() => ({
        [`max-button-${props.severity}`]: Boolean(props.severity),
        [`max-button-${props.variant}`]: Boolean(props.variant),
        'max-button-dashed': props.dashed,
        'max-button-uppercase': props.uppercase,
        'max-button-loading': props.loading,
        'max-button-sm': props.size === 'small' || props.size === 'sm',
        'max-button-lg': props.size === 'large' || props.size === 'lg'
    }));

    const data = computed(() => ({ ...(props.data ?? {}), ...(props.query ?? {}), ...(props.params ?? {}) }));

    const emit = defineEmits<{
        click: [event: MouseEvent];
    }>();

    const onClick = (event: MouseEvent) => {
        if (props.route) {
            goToRoute(props.route, { ...(props.params ?? {}), ...(props.data ?? {}), ...(props.query ?? {}) });
            return;
        }

        if (props.action) {
            props.action({ event: event, data: data.value });
            return;
        }

        emit('click', event);
    };
</script>

<style lang="scss" scoped>
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

        // Cor da marca (declarada em src/styles/style.ts, congelada em
        // themes/tokens.scss). NÃO usar a rampa --primary-* de colors.scss:
        // aquela é uma escala de cinza e deixa todos os botões acinzentados.
        background: var(--max-primary-500);
        color: var(--max-primary-content, #fff);
        border-color: var(--max-primary-500);
        transition: background 0.2s, color 0.2s, border-color 0.2s;

        &:hover {
            background: var(--max-primary-600);
            border-color: var(--max-primary-600);
            color: var(--max-primary-content, #fff);
        }

        &:focus-visible {
            outline: 2px solid var(--max-focus-ring-color, #00768e);
            outline-offset: 2px;
            box-shadow: 0 0 0 2px var(--max-focus-ring-offset-color, #fff);
        }

        &:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }

        :deep(.content-button-icon) {
            .max-icon-div,
            .max-icon {
                color: inherit !important;
            }

            svg {
                fill: currentcolor !important;
                color: inherit !important;
            }
        }

        .max-button-label {
            color: inherit;
        }

        &.max-button-uppercase {
            text-transform: uppercase;
        }

        &.max-button-secondary {
            background: var(--background-500);
            border-color: var(--background-500);
            color: var(--max-secondary-content, #00152A);

            &:hover {
                background: var(--background-600);
                border-color: var(--background-600);
                color: var(--max-secondary-content, #00152A);
            }
        }

        &.max-button-success {
            background: var(--max-success-500, var(--success-500));
            border-color: var(--max-success-500, var(--success-500));
            color: var(--max-success-content, #00152A);

            &:hover {
                background: var(--max-success-600, var(--success-600));
                border-color: var(--max-success-600, var(--success-600));
                color: var(--max-success-content, #00152A);
            }
        }

        &.max-button-info {
            background: var(--max-info-500, var(--info-500));
            border-color: var(--max-info-500, var(--info-500));
            color: var(--max-info-content, #00152A);

            &:hover {
                background: var(--max-info-600, var(--info-600));
                border-color: var(--max-info-600, var(--info-600));
                color: var(--max-info-content, #00152A);
            }
        }

        &.max-button-warning {
            background: var(--max-warning-500, var(--warn-500));
            border-color: var(--max-warning-500, var(--warn-500));
            color: var(--max-warning-content, #00152A);

            &:hover {
                background: var(--max-warning-600, var(--warn-600));
                border-color: var(--max-warning-600, var(--warn-600));
                color: var(--max-warning-content, #00152A);
            }
        }

        &.max-button-danger {
            background: var(--max-danger-surface, var(--max-danger-600, #dc2626));
            border-color: var(--max-danger-surface, var(--max-danger-600, #dc2626));
            color: var(--max-danger-content, #fff);

            &:hover {
                background: var(--max-danger-700, #b91c1c);
                border-color: var(--max-danger-700, #b91c1c);
                color: var(--max-danger-content, #fff);
            }
        }

        &.max-button-whatsapp {
            background: var(--max-whatsapp-surface, var(--max-whatsapp-700, #075e54));
            border-color: var(--max-whatsapp-surface, var(--max-whatsapp-700, #075e54));
            color: var(--max-whatsapp-content, #fff);

            &:hover {
                background: var(--max-whatsapp-hover, var(--max-whatsapp-800, #054a42));
                border-color: var(--max-whatsapp-hover, var(--max-whatsapp-800, #054a42));
                color: var(--max-whatsapp-content, #fff);
            }
        }

        &.max-button-help {
            background: var(--max-help-surface, var(--max-help-500, #7c3aed));
            border-color: var(--max-help-surface, var(--max-help-500, #7c3aed));
            color: var(--max-help-content, #fff);

            &:hover {
                background: var(--max-help-600, #6d28d9);
                border-color: var(--max-help-600, #6d28d9);
                color: var(--max-help-content, #fff);
            }
        }

        // O tema não define --background-950; a rampa termina em 900.
        &.max-button-contrast {
            background: var(--max-button-contrast-border-color, var(--background-900));
            border-color: var(--max-button-contrast-border-color, var(--background-900));
            color: var(--max-contrast-content, #fff);

            &:hover {
                background: var(--background-750);
                border-color: var(--background-750);
                color: var(--max-contrast-content, #fff);
            }
        }

        :global(.dark) &.max-button-contrast,
        :global([data-theme='dark']) &.max-button-contrast {
            background: var(--max-button-contrast-border-color, #fff);
            border-color: var(--max-button-contrast-border-color, #fff);
            color: var(--max-contrast-content, var(--background-900, #09090b));

            &:hover {
                background: var(--background-200, #e4e4e7);
                border-color: var(--background-200, #e4e4e7);
                color: var(--max-contrast-content, var(--background-900, #09090b));
            }
        }

        &.max-button-outlined {
            background: transparent;
            border-color: currentcolor;
            color: var(--max-button-primary-action-content);

            &:hover {
                background: color-mix(in srgb, currentcolor 10%, transparent);
            }
        }

        &.max-button-text {
            background: transparent;
            border-color: transparent;
            color: var(--max-button-primary-action-content);

            &:hover {
                background: color-mix(in srgb, currentcolor 10%, transparent);
            }
        }

        &.max-button-link {
            background: transparent;
            border-color: transparent;
            color: var(--max-button-primary-action-content);
            text-decoration: underline;
            padding: 0;
        }

        &.max-button-sm {
            padding: 0.35rem 0.75rem;
            font-size: 0.8rem;
        }

        &.max-button-lg {
            padding: 0.65rem 1.25rem;
            font-size: 1.05rem;
        }

        &.max-button-dashed {
            background: transparent !important;
            border-style: dashed !important;
            border-width: 1px;
            color: var(--max-button-primary-action-content) !important;

            &:hover,
            &:active {
                background: transparent !important;
            }

            &:focus-visible {
                outline: 2px solid var(--max-focus-ring-color, #00768e);
                outline-offset: 2px;
            }

            &.max-button-secondary {
                color: var(--max-button-secondary-action-content) !important;
            }

            &.max-button-success {
                color: var(--max-button-success-action-content) !important;
            }

            &.max-button-info {
                color: var(--max-button-info-action-content) !important;
            }

            &.max-button-warning {
                color: var(--max-button-warning-action-content) !important;
            }

            &.max-button-help {
                color: var(--max-button-help-action-content) !important;
            }

            &.max-button-danger {
                color: var(--max-button-danger-action-content) !important;
            }

            &.max-button-contrast {
                color: var(--max-button-contrast-action-content) !important;
            }

            :deep(.content-button-icon) {
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

        &.max-button-outlined,
        &.max-button-text,
        &.max-button-link {
            &.max-button-secondary { color: var(--max-button-secondary-action-content); }
            &.max-button-success { color: var(--max-button-success-action-content); }
            &.max-button-info { color: var(--max-button-info-action-content); }
            &.max-button-warning { color: var(--max-button-warning-action-content); }
            &.max-button-danger { color: var(--max-button-danger-action-content); }
            &.max-button-whatsapp { color: var(--max-button-whatsapp-action-content); }
            &.max-button-help { color: var(--max-button-help-action-content); }
            &.max-button-contrast { color: var(--max-button-contrast-action-content); }

            :deep(.content-button-icon) {
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
    }

    @media (prefers-reduced-motion: reduce) {
        *,
        ::before,
        ::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
            scroll-behavior: auto !important;
        }
    }
</style>
