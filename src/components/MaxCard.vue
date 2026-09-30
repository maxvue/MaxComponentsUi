<template>
    <div
        class="max-card"
        :class="[
            `max-card--${props.variant}`,
            {
                'is-loading': props.loading,
                'is-disabled': props.disabled,
                'is-clickable': isInteractive
            }
        ]"
        :role="isInteractive ? 'button' : undefined"
        :tabindex="isInteractive && !props.disabled ? 0 : undefined"
        :aria-disabled="props.disabled ? 'true' : undefined"
        :aria-busy="props.loading ? 'true' : undefined"
        @click="handleClick"
        @keydown="handleKeyDown"
    >
        <!-- Overlay de Carregamento -->
        <div v-if="props.loading" class="max-card-loading-overlay" role="status" aria-live="polite">
            <MaxLoaderIcon class="max-card-loading-spinner" />
        </div>

        <!-- Slot de Mídia (banner/imagem/vídeo) -->
        <div v-if="$slots.media" class="max-card-media">
            <slot name="media" />
        </div>

        <!-- Cabeçalho do Card -->
        <div v-if="$slots.header || hasHeaderContent" class="max-card-header">
            <slot name="header">
                <div class="max-card-header-main">
                    <MaxIcon
                        v-if="props.icon"
                        :icon="props.icon"
                        class="max-card-header-icon"
                    />
                    <div v-if="props.title || props.subtitle" class="max-card-header-titles">
                        <div v-if="props.title" class="max-card-title">{{ props.title }}</div>
                        <div v-if="props.subtitle" class="max-card-subtitle">{{ props.subtitle }}</div>
                    </div>
                </div>
                <div v-if="props.status || $slots.status || $slots.actions" class="max-card-header-actions">
                    <slot name="status">
                        <span
                            v-if="props.status"
                            class="max-card-status"
                            :class="statusClass"
                            :style="statusStyle"
                        >
                            <span class="max-card-status-dot" />
                            <span class="max-card-status-text">{{ props.status }}</span>
                        </span>
                    </slot>
                    <slot name="actions" />
                </div>
            </slot>
        </div>

        <!-- Conteúdo do Card -->
        <div v-if="$slots.body || $slots.content || $slots.default || isAddVariantPlaceholder" class="max-card-content">
            <slot name="body">
                <slot name="content">
                    <slot>
                        <div v-if="isAddVariantPlaceholder" class="max-card-add-placeholder">
                            <div class="max-card-add-icon-wrapper">
                                <MaxIcon :icon="props.icon || 'mdi:plus'" class="max-card-add-icon" />
                            </div>
                            <span v-if="props.addLabel || props.title" class="max-card-add-title">{{ props.addLabel || props.title }}</span>
                            <span v-if="props.subtitle" class="max-card-add-subtitle">{{ props.subtitle }}</span>
                        </div>
                    </slot>
                </slot>
            </slot>
        </div>

        <!-- Ações no corpo quando não houver cabeçalho -->
        <div v-if="!$slots.header && !hasHeaderContent && $slots.actions" class="max-card-actions">
            <slot name="actions" />
        </div>

        <!-- Rodapé do Card -->
        <div v-if="$slots.footer" class="max-card-footer">
            <slot name="footer" />
        </div>
    </div>
</template>

<script setup lang="ts">
    import { computed, useSlots } from 'vue';
    import MaxIcon from './MaxIcon.vue';
    import MaxLoaderIcon from './MaxLoaderIcon.vue';
    import type { MaxCardProps } from '../types/card';

    const slots = useSlots();

    const props = withDefaults(defineProps<MaxCardProps>(), {
        variant: 'default',
        title: undefined,
        subtitle: undefined,
        status: undefined,
        statusColor: undefined,
        addLabel: undefined,
        loading: false,
        disabled: false,
        clickable: false,
        icon: undefined
    });

    const emit = defineEmits<{
        click: [event: MouseEvent | KeyboardEvent];
    }>();

    const isInteractive = computed(() => props.clickable || props.variant === 'add');

    const statusClass = computed(() => {
        if (!props.status) return '';
        const s = props.status.toLowerCase().trim();
        if (s === 'done' || s === 'success' || s === 'concluído' || s === 'concluido' || s === 'ativo' || s === 'aprovado' || s === 'online') return 'max-card-status--success';
        if (s === 'error' || s === 'danger' || s === 'erro' || s === 'falha' || s === 'rejeitado' || s === 'cancelado' || s === 'offline') return 'max-card-status--danger';
        if (s === 'warn' || s === 'warning' || s === 'caution' || s === 'atenção' || s === 'atencao' || s === 'pendente' || s === 'em homologação' || s === 'em homologacao') return 'max-card-status--warning';
        if (s === 'info' || s === 'informação' || s === 'informacao' || s === 'em andamento' || s === 'processando') return 'max-card-status--info';
        return '';
    });

    const statusStyle = computed(() => {
        if (!props.statusColor) return undefined;
        return { '--card-status-color': props.statusColor };
    });

    const isAddVariantPlaceholder = computed(() => {
        if (props.variant !== 'add') return false;
        if (slots.default || slots.content || slots.body) return false;
        return true;
    });

    const hasHeaderContent = computed(() => {
        if (props.variant === 'add' && isAddVariantPlaceholder.value && !slots.actions && !slots.status) return false;
        return Boolean(props.title || props.subtitle || props.icon || props.status || slots.actions || slots.status);
    });

    const handleClick = (event: MouseEvent) => {
        if (props.disabled || props.loading) return;
        emit('click', event);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
        if (props.disabled || props.loading) return;
        if (isInteractive.value && (event.key === 'Enter' || event.key === ' ')) {
            event.preventDefault();
            emit('click', event);
        }
    };
</script>

<style lang="scss" scoped>
    .max-card {
        position: relative;
        display: flex;
        flex-direction: column;
        background-color: var(--background-0);
        border: 1px solid var(--background-200);
        border-radius: 6px;
        box-shadow: 0 1px 2px rgb(0 0 0 / 4%);
        transition: border-color 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease;
        overflow: hidden;
        color: var(--background-900);
        box-sizing: border-box;
        height: 100%;
        min-height: 160px;

        &.is-clickable {
            cursor: pointer;

            &:hover {
                border-color: var(--max-primary-400);
                box-shadow: 0 2px 6px rgb(0 0 0 / 6%);
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

        &.is-loading {
            pointer-events: none;
        }

        &--add {
            border: 1px dashed var(--background-300);
            background-color: var(--background-50);
            box-shadow: none;
            height: 100%;
            min-height: 160px;
            justify-content: center;

            &:hover {
                border-color: var(--max-primary-500);
                background-color: var(--background-0);
                box-shadow: 0 2px 6px rgb(0 0 0 / 5%);

                .max-card-add-icon-wrapper {
                    background-color: var(--max-primary-50, rgb(0 118 142 / 8%));
                    color: var(--max-primary-500);
                    border-color: var(--max-primary-300, var(--max-primary-500));
                }
            }

            .max-card-content {
                display: flex;
                flex-direction: column;
                justify-content: center;
                height: 100%;
                padding: 1rem;
            }

            .max-card-add-placeholder {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                text-align: center;
                gap: 0.5rem;
                color: var(--background-600);

                .max-card-add-icon-wrapper {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    background-color: var(--background-100);
                    border: 1px solid var(--background-200);
                    color: var(--background-600);
                    transition: background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease;
                }

                .max-card-add-icon {
                    font-size: 1.25rem;
                }

                .max-card-add-title {
                    font-weight: 600;
                    font-size: 0.875rem;
                    color: var(--background-650);
                    line-height: 1.3;
                }

                .max-card-add-subtitle {
                    font-size: 0.75rem;
                    color: var(--background-500);
                    line-height: 1.3;
                }
            }
        }

        .max-card-loading-overlay {
            position: absolute;
            inset: 0;
            background-color: rgb(255 255 255 / 70%);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10;
            backdrop-filter: blur(1px);

            :global(.dark) &,
            :global(:root.dark) & {
                background-color: rgb(0 0 0 / 70%);
            }
        }

        .max-card-media {
            width: 100%;
            overflow: hidden;

            :deep(img),
            :deep(video) {
                display: block;
                width: 100%;
                height: auto;
                object-fit: cover;
            }
        }

        .max-card-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0.75rem 1rem;
            gap: 0.75rem;

            &-main {
                display: flex;
                align-items: center;
                gap: 0.625rem;
                flex: 1;
                min-width: 0;
            }

            &-icon {
                font-size: 1.25rem;
                color: var(--max-primary-500);
                flex-shrink: 0;
            }

            &-titles {
                display: flex;
                flex-direction: column;
                min-width: 0;
            }

            .max-card-title {
                font-size: 0.9375rem;
                font-weight: 600;
                color: var(--background-650);
                line-height: 1.3;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            .max-card-subtitle {
                font-size: 0.8125rem;
                color: var(--background-600);
                line-height: 1.35;
                margin-top: 1px;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            &-actions {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                flex-shrink: 0;
            }

            .max-card-status {
                display: inline-flex;
                align-items: center;
                gap: 0.375rem;
                font-size: 0.75rem;
                font-weight: 600;
                line-height: 1;
                padding: 0.25rem 0.5rem;
                border-radius: 9999px;
                background-color: var(--card-status-color, var(--background-100));
                color: var(--background-700);

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
        }

        .max-card-content {
            padding: 0 1rem 0.75rem;
            font-size: 0.875rem;
            color: var(--background-700);
            line-height: 1.45;
            flex: 1;

            &:first-child {
                padding-top: 1rem;
            }
        }

        .max-card-actions {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0 1rem 0.75rem;
        }

        .max-card-footer {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0.5rem 1rem;
            background-color: var(--background-50);
            border-top: 1px solid var(--background-100);
            font-size: 0.8125rem;
            color: var(--background-600);
        }
    }

    @media (prefers-reduced-motion: reduce) {
        .max-card {
            transition: none;

            &:hover {
                transform: none;
            }
        }
    }
</style>
