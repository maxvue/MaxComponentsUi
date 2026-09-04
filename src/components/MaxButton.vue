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
            :size="resolvedIconSize"
            class="content-button-icon"
            :dark="props.dark"
            :light="light"
            :color="iconColor"
        />
        <span class="max-button-label"><slot></slot>{{ props.label && !$slots.default ? props.label : '' }}</span>
        <MaxIcon
            v-if="showIcon && iconPos === 'right'"
            :icon="loading ? 'loading' : (props.icon ?? props.i)"
            :size="resolvedIconSize"
            class="content-button-icon"
            :dark="props.dark"
            :light="light"
            :color="iconColor"
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
        click: [event: MouseEvent | boolean];
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

        // Cor da marca (declarada em src/styles/style.ts, congelada em
        // themes/tokens.scss). NÃO usar a rampa --primary-* de colors.scss:
        // aquela é uma escala de cinza e deixa todos os botões acinzentados.
        background: var(--max-primary-500);
        color: #fff;
        border-color: var(--max-primary-500);
        transition: background 0.2s, color 0.2s, border-color 0.2s;

        &:hover {
            background: var(--max-primary-600);
            border-color: var(--max-primary-600);
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
            background: var(--success-500);
            border-color: var(--success-500);
            color: #fff;
            &:hover { background: var(--success-600); border-color: var(--success-600); }
        }

        &.max-button-info, &.p-button-info {
            background: var(--info-500);
            border-color: var(--info-500);
            color: #fff;
            &:hover { background: var(--info-600); border-color: var(--info-600); }
        }

        &.max-button-warning, &.p-button-warning, &.p-button-warn {
            background: var(--warn-500);
            border-color: var(--warn-500);
            color: #fff;
            &:hover { background: var(--warn-600); border-color: var(--warn-600); }
        }

        &.max-button-danger, &.p-button-danger {
            background: var(--danger-500);
            border-color: var(--danger-500);
            color: #fff;
            &:hover { background: var(--danger-600); border-color: var(--danger-600); }
        }

        &.max-button-whatsapp {
            background: #25d366;
            border-color: #25d366;
            color: #fff;
            &:hover { background: #1da851; border-color: #1da851; }
        }

        &.max-button-help, &.p-button-help {
            background: var(--violet-500);
            border-color: var(--violet-500);
            color: #fff;
            &:hover { background: var(--violet-600); border-color: var(--violet-600); }
        }

        // O tema não define --background-950; a rampa termina em 900.
        &.max-button-contrast, &.p-button-contrast {
            background: var(--background-900);
            border-color: var(--background-900);
            color: #fff;
            &:hover { background: var(--background-800); border-color: var(--background-800); }
        }

        &.max-button-outlined, &.p-button-outlined {
            background: transparent;
            border-color: currentcolor;
            color: var(--max-primary-500);
            &:hover { background: color-mix(in srgb, currentcolor 10%, transparent); }
        }

        &.max-button-text, &.p-button-text {
            background: transparent;
            border-color: transparent;
            color: var(--max-primary-500);
            &:hover { background: color-mix(in srgb, currentcolor 10%, transparent); }
        }

        &.max-button-link, &.p-button-link {
            background: transparent;
            border-color: transparent;
            color: var(--max-primary-500);
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
        color: var(--max-primary-500) !important;

        &:hover,
        &:active,
        &:focus {
            background: transparent !important;
        }

        &.p-button-secondary, &.max-button-secondary {
            color: var(--background-500) !important;
        }

        &.p-button-success, &.max-button-success {
            color: var(--success-500) !important;
        }

        &.p-button-info, &.max-button-info {
            color: var(--info-500) !important;
        }

        &.p-button-warn,
        &.p-button-warning,
        &.max-button-warning {
            color: var(--warn-500) !important;
        }

        &.p-button-help, &.max-button-help {
            color: var(--violet-500) !important;
        }

        &.p-button-danger, &.max-button-danger {
            color: var(--danger-500) !important;
        }

        &.p-button-contrast, &.max-button-contrast {
            color: var(--background-900) !important;
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
