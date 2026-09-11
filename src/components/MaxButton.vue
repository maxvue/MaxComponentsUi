<template>
    <button
        v-if="props.label || Boolean($slots.default)"
        type="button"
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
        color: var(--background-0);
        border-color: var(--max-primary-500);
        transition: background 0.2s, color 0.2s, border-color 0.2s;

        &:hover {
            background: var(--max-primary-600);
            border-color: var(--max-primary-600);
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

        &.max-button-uppercase {
            text-transform: uppercase;
        }

        &.max-button-secondary {
            background: var(--background-500);
            border-color: var(--background-500);
            color: var(--background-0);

            &:hover {
                background: var(--background-600);
                border-color: var(--background-600);
            }
        }

        &.max-button-success {
            background: var(--max-success-500, var(--success-500));
            border-color: var(--max-success-500, var(--success-500));
            color: var(--background-0);

            &:hover {
                background: var(--max-success-600, var(--success-600));
                border-color: var(--max-success-600, var(--success-600));
            }
        }

        &.max-button-info {
            background: var(--max-info-500, var(--info-500));
            border-color: var(--max-info-500, var(--info-500));
            color: var(--background-0);

            &:hover {
                background: var(--max-info-600, var(--info-600));
                border-color: var(--max-info-600, var(--info-600));
            }
        }

        &.max-button-warning {
            background: var(--max-warning-500, var(--warn-500));
            border-color: var(--max-warning-500, var(--warn-500));
            color: var(--background-0);

            &:hover {
                background: var(--max-warning-600, var(--warn-600));
                border-color: var(--max-warning-600, var(--warn-600));
            }
        }

        &.max-button-danger {
            background: var(--max-danger-500, var(--danger-500));
            border-color: var(--max-danger-500, var(--danger-500));
            color: var(--background-0);

            &:hover {
                background: var(--max-danger-600, var(--danger-600));
                border-color: var(--max-danger-600, var(--danger-600));
            }
        }

        &.max-button-whatsapp {
            background: var(--max-whatsapp-500, #25d366);
            border-color: var(--max-whatsapp-500, #25d366);
            color: var(--background-0);

            &:hover {
                background: var(--max-whatsapp-600, #1da851);
                border-color: var(--max-whatsapp-600, #1da851);
            }
        }

        &.max-button-help {
            background: var(--violet-500);
            border-color: var(--violet-500);
            color: var(--background-0);

            &:hover {
                background: var(--violet-600);
                border-color: var(--violet-600);
            }
        }

        // O tema não define --background-950; a rampa termina em 900.
        &.max-button-contrast {
            background: var(--max-button-contrast-border-color, var(--background-900));
            border-color: var(--max-button-contrast-border-color, var(--background-900));
            color: var(--background-0);

            &:hover {
                background: var(--background-750);
                border-color: var(--background-750);
            }
        }

        :global(.dark) &.max-button-contrast,
        :global([data-theme='dark']) &.max-button-contrast {
            background: var(--max-button-contrast-border-color, #fff);
            border-color: var(--max-button-contrast-border-color, #fff);
            color: var(--background-900, #09090b);

            &:hover {
                background: var(--background-200, #e4e4e7);
                border-color: var(--background-200, #e4e4e7);
            }
        }

        &.max-button-outlined {
            background: transparent;
            border-color: currentcolor;
            color: var(--max-primary-500);

            &:hover {
                background: color-mix(in srgb, currentcolor 10%, transparent);
            }
        }

        &.max-button-text {
            background: transparent;
            border-color: transparent;
            color: var(--max-primary-500);

            &:hover {
                background: color-mix(in srgb, currentcolor 10%, transparent);
            }
        }

        &.max-button-link {
            background: transparent;
            border-color: transparent;
            color: var(--max-primary-500);
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
            color: var(--max-primary-500) !important;

            &:hover,
            &:active {
                background: transparent !important;
            }

            &:focus-visible {
                outline: 2px solid var(--max-focus-ring-color, #00768e);
                outline-offset: 2px;
            }

            &.max-button-secondary {
                color: var(--background-700) !important;
            }

            &.max-button-success {
                color: var(--max-success-500, var(--success-500)) !important;
            }

            &.max-button-info {
                color: var(--max-info-500, var(--info-500)) !important;
            }

            &.max-button-warning {
                color: var(--max-warning-500, var(--warn-500)) !important;
            }

            &.max-button-help {
                color: var(--violet-500) !important;
            }

            &.max-button-danger {
                color: var(--max-danger-500, var(--danger-500)) !important;
            }

            &.max-button-contrast {
                color: var(--background-775) !important;
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
</style>
