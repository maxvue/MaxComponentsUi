<template>
    <Button :class="`max-button ${'icon-pos-' + iconPos} ${buttonClass}`" :label="label" :icon="icon" :severity="severity" :size="size" :disabled="disabled" :loading="loading" @click="handleClick" :iconPos="iconPos">
        <template #icon>
            <slot name="icon">
                <div class="max-button__icon">
                    <MaxIcon :icon="icon ?? i" v-if="icon || i" />
                </div>
            </slot>
        </template>
        <template #loadingicon>
            <slot name="icon">
                <div class="max-button__icon-loading">
                    <MaxIcon icon="eos-icons:loading" />
                </div>
            </slot>
        </template>
    </Button>
</template>

<script setup lang="ts">
    import { computed } from 'vue';
    import Button from 'primevue/button';
    import MaxIcon from './MaxIcon.vue';

    interface Props {
        label?: string;
        icon?: string;
        i?: string;
        severity?: 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'help' | 'danger' | 'contrast';
        size?: 'small' | 'large';
        disabled?: boolean;
        loading?: boolean;
        variant?: 'outlined' | 'text' | 'link';
        iconPos?: 'left' | 'right';
    }

    interface Emits {
        (e: 'click', event: MouseEvent): void;
    }

    const props = withDefaults(defineProps<Props>(), {
        severity: 'primary',
        size: undefined,
        disabled: false,
        loading: false,
        iconPos: 'left',
    });

    const emit = defineEmits<Emits>();

    const buttonClass = computed(() => ({
        'max-button': true,
        [`max-button--${props.variant}`]: props.variant,
        [`max-button--${props.severity}`]: props.severity,
        [`max-button--${props.size}`]: props.size,
    }));

    const handleClick = (event: MouseEvent) => {
        emit('click', event);
    };
</script>

<style lang="scss">
    .max-button {
        transition: all 0.2s ease-in-out;

        &--small {
            font-size: 0.875rem;
            padding: 0.375rem 0.75rem;
        }

        &--large {
            font-size: 1.125rem;
            padding: 0.75rem 1.5rem;
        }

        &:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }

        &:active {
            transform: translateY(0);
        }
        .max-button__icon {
            display: grid;
            place-items: center;
        }
        &.icon-pos-right {
            flex-direction: row-reverse;
        }
        &.icon-pos-left {
            flex-direction: row;
        }
    }
</style>
