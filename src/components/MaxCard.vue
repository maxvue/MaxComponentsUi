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
                <div v-if="$slots.actions" class="max-card-header-actions">
                    <slot name="actions" />
                </div>
            </slot>
        </div>

        <!-- Conteúdo do Card -->
        <div v-if="$slots.content || $slots.default || isAddVariantPlaceholder" class="max-card-content">
            <slot name="content">
                <slot>
                    <div v-if="isAddVariantPlaceholder" class="max-card-add-placeholder">
                        <MaxIcon :icon="props.icon || 'mdi:plus'" class="max-card-add-icon" />
                        <span v-if="props.title" class="max-card-add-title">{{ props.title }}</span>
                        <span v-if="props.subtitle" class="max-card-add-subtitle">{{ props.subtitle }}</span>
                    </div>
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
        loading: false,
        disabled: false,
        clickable: false,
        icon: undefined
    });

    const emit = defineEmits<{
        click: [event: MouseEvent | KeyboardEvent];
    }>();

    const isInteractive = computed(() => props.clickable || props.variant === 'add');

    const isAddVariantPlaceholder = computed(() => {
        if (props.variant !== 'add') return false;
        if (slots.default || slots.content) return false;
        return true;
    });

    const hasHeaderContent = computed(() => {
        if (props.variant === 'add' && isAddVariantPlaceholder.value && !slots.actions) return false;
        return Boolean(props.title || props.subtitle || props.icon || slots.actions);
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
        border-radius: 8px;
        box-shadow: 0 1px 3px rgb(0 0 0 / 5%), 0 1px 2px rgb(0 0 0 / 4%);
        transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
        overflow: hidden;
        color: var(--background-900);

        &.is-clickable {
            cursor: pointer;

            &:hover {
                border-color: var(--max-primary-400);
                box-shadow: 0 4px 12px rgb(0 0 0 / 8%);
                transform: translateY(-1px);
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
            border: 1.5px dashed var(--background-300);
            background-color: var(--background-25, var(--background-0));
            box-shadow: none;

            &:hover {
                border-color: var(--max-primary-500);
                background-color: var(--background-50);
                box-shadow: 0 2px 8px rgb(0 0 0 / 5%);
            }

            .max-card-add-placeholder {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                text-align: center;
                padding: 1.5rem 1rem;
                gap: 0.5rem;
                color: var(--background-600);

                .max-card-add-icon {
                    font-size: 2rem;
                    color: var(--max-primary-500);
                    transition: transform 0.2s ease;
                }

                .max-card-add-title {
                    font-weight: 600;
                    font-size: 0.95rem;
                    color: var(--background-800);
                }

                .max-card-add-subtitle {
                    font-size: 0.8rem;
                    color: var(--background-500);
                }
            }

            &:hover .max-card-add-icon {
                transform: scale(1.1);
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
            padding: 1rem 1.25rem;
            gap: 0.75rem;

            &-main {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                flex: 1;
                min-width: 0;
            }

            &-icon {
                font-size: 1.5rem;
                color: var(--max-primary-500);
                flex-shrink: 0;
            }

            &-titles {
                display: flex;
                flex-direction: column;
                min-width: 0;
            }

            .max-card-title {
                font-size: 1rem;
                font-weight: 600;
                color: var(--background-900);
                line-height: 1.3;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            .max-card-subtitle {
                font-size: 0.85rem;
                color: var(--background-600);
                line-height: 1.4;
                margin-top: 2px;
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
        }

        .max-card-content {
            padding: 0 1.25rem 1rem;
            font-size: 0.9rem;
            color: var(--background-700);
            line-height: 1.5;
            flex: 1;

            &:first-child {
                padding-top: 1.25rem;
            }
        }

        .max-card-actions {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0 1.25rem 1rem;
        }

        .max-card-footer {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0.75rem 1.25rem;
            background-color: var(--background-50);
            border-top: 1px solid var(--background-100);
            font-size: 0.85rem;
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
