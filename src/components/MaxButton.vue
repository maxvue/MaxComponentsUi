<template>
    <Button v-bind="props as PrimeButtonProps" :iconPos="iconPos" uppercase :class="{ 'max-button-dashed': props.dashed }" @click="onClick" v-if="props.label" >
        <template #default>
            <slot></slot>
        </template>
        <template #icon>
            <MaxIcon v-if="props.icon ?? props.i" :icon="props.icon ?? props.i" :size="props.size ?? props.sizeIcon ?? props.iconSize ?? '1'" class="content-button-icon" :dark="props.dark" :light="light" :color="iconColor" />
        </template>
        <template #loadingicon>
            <MaxIcon  icon="loading" :size="props.size ?? props.sizeIcon ?? props.iconSize ?? '1'" class="content-button-icon" />
        </template>
    </Button>
    <MaxIconButton  v-bind="props" v-else class="icon-button-b" ></MaxIconButton>

</template>

<script setup lang="ts">
    import { computed } from 'vue';
    import MaxIcon from './MaxIcon.vue';
    import MaxIconButton from './MaxIconButton.vue';
    import Button from 'primevue/button';
    import { goToRoute } from '@maxvue/max-use';
    import { MaxButtonsType } from '../types';
    import type { ButtonProps as PrimeButtonProps } from 'primevue/button';

    const props = withDefaults(defineProps<MaxButtonsType>(), { iconSize: 1.4, dark: undefined, route: null, params: {}, data: {}, query: {}, uppercase: false });

    const isTransparentVariant = computed(() => props.variant === 'outlined' || props.variant === 'text' || props.variant === 'link' || props.dashed === true);
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
