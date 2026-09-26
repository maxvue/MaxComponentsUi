<template>
    <div
        class="max-subcard"
        :class="{
            'is-clickable': isInteractive,
            'is-disabled': props.disabled
        }"
        :role="isInteractive ? 'button' : undefined"
        :tabindex="isInteractive && !props.disabled ? 0 : undefined"
        :aria-disabled="props.disabled ? 'true' : undefined"
        @click="handleClick"
        @keydown="handleKeyDown"
    >
        <!-- Cabeçalho Compacto -->
        <div v-if="$slots.header || hasHeaderContent" class="max-subcard-header">
            <slot name="header">
                <div class="max-subcard-header-main">
                    <MaxIcon
                        v-if="props.icon"
                        :icon="props.icon"
                        class="max-subcard-header-icon"
                    />
                    <div v-if="props.title || props.subtitle" class="max-subcard-header-titles">
                        <div v-if="props.title" class="max-subcard-title">{{ props.title }}</div>
                        <div v-if="props.subtitle" class="max-subcard-subtitle">{{ props.subtitle }}</div>
                    </div>
                </div>

                <div v-if="props.status || $slots.actions" class="max-subcard-header-side">
                    <span v-if="props.status" class="max-subcard-status" :class="statusClass">
                        <span class="max-subcard-status-dot" />
                        <span class="max-subcard-status-text">{{ props.status }}</span>
                    </span>
                    <div v-if="$slots.actions" class="max-subcard-actions">
                        <slot name="actions" />
                    </div>
                </div>
            </slot>
        </div>

        <!-- Conteúdo do SubCard -->
        <div v-if="$slots.content || $slots.default" class="max-subcard-content">
            <slot name="content">
                <slot />
            </slot>
        </div>

        <!-- Ações no corpo quando não houver cabeçalho -->
        <div v-if="!$slots.header && !hasHeaderContent && $slots.actions" class="max-subcard-actions">
            <slot name="actions" />
        </div>
    </div>
</template>

<script setup lang="ts">
    import { computed, useSlots } from 'vue';
    import MaxIcon from './MaxIcon.vue';
    import type { MaxSubCardProps } from '../types/card';

    const slots = useSlots();

    const props = withDefaults(defineProps<MaxSubCardProps>(), {
        title: undefined,
        subtitle: undefined,
        status: undefined,
        icon: undefined,
        clickable: false,
        disabled: false
    });

    const emit = defineEmits<{
        click: [event: MouseEvent | KeyboardEvent];
    }>();

    const isInteractive = computed(() => props.clickable);

    const hasHeaderContent = computed(() => {
        return Boolean(props.title || props.subtitle || props.icon || props.status || slots.actions);
    });

    const statusClass = computed(() => {
        if (!props.status) return '';
        const s = props.status.toLowerCase().trim();
        if (s === 'done' || s === 'success' || s === 'concluído' || s === 'concluido' || s === 'ativo' || s === 'aprovado') return 'max-subcard-status--success';
        if (s === 'error' || s === 'danger' || s === 'erro' || s === 'falha' || s === 'rejeitado' || s === 'cancelado') return 'max-subcard-status--danger';
        if (s === 'warn' || s === 'warning' || s === 'caution' || s === 'atenção' || s === 'atencao' || s === 'pendente') return 'max-subcard-status--warning';
        if (s === 'info' || s === 'informação' || s === 'informacao' || s === 'em andamento') return 'max-subcard-status--info';
        return '';
    });

    const handleClick = (event: MouseEvent) => {
        if (props.disabled) return;
        emit('click', event);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
        if (props.disabled) return;
        if (isInteractive.value && (event.key === 'Enter' || event.key === ' ')) {
            event.preventDefault();
            emit('click', event);
        }
    };
</script>

<style lang="scss" scoped>
    .max-subcard {
        position: relative;
        display: flex;
        flex-direction: column;
        background-color: var(--background-50);
        border: 1px solid var(--background-200);
        border-radius: 6px;
        padding: 0.625rem 0.875rem;
        gap: 0.5rem;
        transition: border-color 0.15s ease, background-color 0.15s ease;
        color: var(--background-900);

        &.is-clickable {
            cursor: pointer;

            &:hover {
                background-color: var(--background-100);
                border-color: var(--background-300);
            }

            &:focus-visible {
                outline: var(--max-focus-outline);
                outline-offset: 2px;
                box-shadow: var(--max-focus-ring);
            }
        }

        &.is-disabled {
            opacity: 0.6;
            cursor: not-allowed;
            pointer-events: none;
        }

        .max-subcard-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 0.5rem;

            &-main {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                flex: 1;
                min-width: 0;
            }

            &-icon {
                font-size: 1.15rem;
                color: var(--max-primary-500);
                flex-shrink: 0;
            }

            &-titles {
                display: flex;
                flex-direction: column;
                min-width: 0;
            }

            .max-subcard-title {
                font-size: 0.875rem;
                font-weight: 600;
                color: var(--background-900);
                line-height: 1.25;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            .max-subcard-subtitle {
                font-size: 0.75rem;
                color: var(--background-600);
                line-height: 1.3;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            &-side {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                flex-shrink: 0;
            }
        }

        .max-subcard-status {
            display: inline-flex;
            align-items: center;
            gap: 0.35rem;
            padding: 0.125rem 0.5rem;
            border-radius: 9999px;
            font-size: 0.7rem;
            font-weight: 500;
            background-color: var(--background-200);
            color: var(--background-800);

            &-dot {
                width: 6px;
                height: 6px;
                border-radius: 50%;
                background-color: currentcolor;
            }

            &--success {
                background-color: rgb(16 185 129 / 12%);
                color: var(--max-success-600, #059669);
            }

            &--danger {
                background-color: rgb(239 68 68 / 12%);
                color: var(--max-danger-600, #dc2626);
            }

            &--warning {
                background-color: rgb(245 158 11 / 12%);
                color: var(--max-warning-600, #d97706);
            }

            &--info {
                background-color: rgb(14 165 233 / 12%);
                color: var(--max-info-600, #0284c7);
            }
        }

        .max-subcard-content {
            font-size: 0.825rem;
            color: var(--background-700);
            line-height: 1.4;
        }

        .max-subcard-actions {
            display: inline-flex;
            align-items: center;
            gap: 0.35rem;
        }
    }

    @media (prefers-reduced-motion: reduce) {
        .max-subcard {
            transition: none;
        }
    }
</style>
