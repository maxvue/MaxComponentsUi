<template>
    <TransitionGroup
        name="max-toast"
        tag="div"
        class="max-toast-container"
        role="region"
        aria-label="Notificações"
    >
        <div
            v-for="toast in toastStore.items"
            :key="toast.id"
            :class="['max-toast-item', `severity-${toast.severity}`, { 'is-persistent': toast.duration === 0 || copyStatus[toast.id] === 'error' }]"
            :role="toast.severity === 'error' ? 'alert' : 'status'"
            @mouseenter="toastStore.pause(toast.id)"
            @mouseleave="toastStore.resume(toast.id)"
            @focusin="toastStore.pause(toast.id)"
            @focusout="toastStore.resume(toast.id)"
        >
            <!-- Ícone da severidade -->
            <div class="max-toast-icon">
                <MaxIcon :i="resolveIcon(toast)" size="1.6" color="inherit" />
            </div>

            <!-- Conteúdo -->
            <div class="max-toast-content">
                <div class="max-toast-title" :title="toast.title">{{ toast.title }}</div>
                <div
                    v-if="toast.message"
                    class="max-toast-message"
                    :class="{ 'is-expanded': expandedToasts[toast.id] }"
                >
                    {{ toast.message }}
                </div>

                <div
                    v-if="toast.message && (toast.message.length > 80 || toast.severity === 'error')"
                    class="max-toast-actions"
                >
                    <button
                        v-if="toast.message.length > 80"
                        type="button"
                        class="toast-text-action action-expand"
                        @click.stop="toggleExpand(toast.id)"
                    >
                        {{ expandedToasts[toast.id] ? 'Ver menos' : 'Ver mais' }}
                    </button>
                    <button
                        type="button"
                        class="toast-text-action action-copy"
                        @click.stop="copyToastContent(toast)"
                    >
                        {{ copyStatus[toast.id] === 'success' ? 'Copiado!' : 'Copiar' }}
                    </button>
                    <button
                        v-if="copyStatus[toast.id] === 'error'"
                        type="button"
                        class="toast-text-action action-retry"
                        @click.stop="copyToastContent(toast)"
                    >
                        Tentar novamente
                    </button>
                </div>

                <!-- Anúncio de status sutil ao copiar (sem live region aninhada, o item pai é o live owner) -->
                <span
                    v-if="copyStatus[toast.id] === 'success'"
                    class="toast-copy-status sr-only"
                >
                    Copiado para a área de transferência!
                </span>

                <!-- Feedback persistente e fallback manual caso a cópia falhe (sem live region aninhada) -->
                <div
                    v-if="copyStatus[toast.id] === 'error'"
                    class="toast-copy-fallback"
                >
                    <span class="toast-copy-error-msg">Não foi possível copiar automaticamente. Copie manualmente abaixo:</span>
                    <textarea
                        readonly
                        rows="2"
                        class="toast-copy-manual-input"
                        :value="getToastFullText(toast)"
                        @focus="($event.target as HTMLTextAreaElement).select()"
                        aria-label="Texto da notificação para cópia manual"
                    />
                </div>
            </div>

            <!-- Botão fechar -->
            <button
                type="button"
                class="max-toast-close"
                @click="dismissToast(toast.id)"
                :aria-label="'Fechar notificação: ' + toast.title"
            >
                <MaxIcon i="mdi:close" size="1.1" color="inherit" />
            </button>

            <!-- Barra de progresso (somente para toasts com duration > 0 e sem erro de cópia ativo) -->
            <div v-if="toast.duration > 0 && copyStatus[toast.id] !== 'error'" class="max-toast-progress">
                <div
                    :class="['max-toast-progress-bar', { paused: toast.paused }]"
                    :style="{ animationDuration: `${toast.remaining ?? toast.duration}ms` }"
                />
            </div>
        </div>
    </TransitionGroup>
</template>

<script setup lang="ts">
    import { ref, onBeforeUnmount } from 'vue';
    import { useToastStore } from '../stores/useToast.Store';
    import type { ToastItem } from '../stores/useToast.Store';
    import MaxIcon from './MaxIcon.vue';

    const toastStore = useToastStore();

    const expandedToasts = ref<Record<string, boolean>>({});
    const copiedToastId = ref<string | null>(null);
    const copyStatus = ref<Record<string, 'idle' | 'success' | 'error'>>({});
    let isMounted = true;
    const copyTimeouts: Record<string, ReturnType<typeof setTimeout>> = {};

    const clearCopyTimeout = (id: string) => {
        if (copyTimeouts[id]) {
            clearTimeout(copyTimeouts[id]);
            delete copyTimeouts[id];
        }
    };

    const toggleExpand = (id: string) => {
        expandedToasts.value[id] = !expandedToasts.value[id];
    };

    const getToastFullText = (toast: ToastItem): string => {
        return `${toast.title}\n${toast.message ?? ''}`.trim();
    };

    const copyToastContent = async (toast: ToastItem) => {
        const text = getToastFullText(toast);
        if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) try {
            await navigator.clipboard.writeText(text);
            if (!isMounted) return;
            const wasInError = copyStatus.value[toast.id] === 'error';
            copyStatus.value[toast.id] = 'success';
            copiedToastId.value = toast.id;
            if (wasInError && toast.duration > 0) toastStore.resume(toast.id);

            clearCopyTimeout(toast.id);
            copyTimeouts[toast.id] = setTimeout(() => {
                if (!isMounted) return;
                if (copyStatus.value[toast.id] === 'success') copyStatus.value[toast.id] = 'idle';
                if (copiedToastId.value === toast.id) copiedToastId.value = null;
                delete copyTimeouts[toast.id];
            }, 2000);
            return;
        } catch {
            // Cai no fallback de erro abaixo
        }

        // Clipboard API falhou ou não existe
        if (!isMounted) return;
        clearCopyTimeout(toast.id);
        copyStatus.value[toast.id] = 'error';
        if (copiedToastId.value === toast.id) copiedToastId.value = null;
        toastStore.pause(toast.id);
    };

    const dismissToast = (id: string) => {
        clearCopyTimeout(id);
        delete copyStatus.value[id];
        delete expandedToasts.value[id];
        if (copiedToastId.value === id) copiedToastId.value = null;
        toastStore.remove(id);
    };

    onBeforeUnmount(() => {
        isMounted = false;
        Object.keys(copyTimeouts).forEach((id) => clearCopyTimeout(id));
    });

    /** Mapa de ícones padrão por severidade */
    const severityIconMap: Record<string, string> = {
        success: 'mdi:check-circle-outline',
        info: 'mdi:information-outline',
        warning: 'mdi:alert-outline',
        error: 'mdi:close-circle-outline',
        whatsapp: 'mdi:whatsapp'
    };

    /** Retorna o ícone adequado para o toast */
    const resolveIcon = (toast: ToastItem): string => {
        return toast.icon ?? severityIconMap[toast.severity] ?? severityIconMap.info;
    };
</script>

<style lang="scss" scoped>
    /* ─── Container principal ─── */
    .max-toast-container {
        --max-toast-viewport-gutter: 16px;
        --max-toast-top-offset: 74px;
        --max-toast-safe-top: env(safe-area-inset-top, 0px);
        --max-toast-safe-right: env(safe-area-inset-right, 0px);
        --max-toast-safe-bottom: env(safe-area-inset-bottom, 0px);
        --max-toast-safe-left: env(safe-area-inset-left, 0px);

        position: fixed;
        top: calc(var(--max-toast-top-offset) + var(--max-toast-safe-top));
        right: max(var(--max-toast-viewport-gutter), var(--max-toast-safe-right));
        max-width: calc(100vw - max(var(--max-toast-viewport-gutter), var(--max-toast-safe-left)) - max(var(--max-toast-viewport-gutter), var(--max-toast-safe-right)));
        max-height: calc(100vh - (var(--max-toast-top-offset) + var(--max-toast-safe-top) + max(var(--max-toast-viewport-gutter), var(--max-toast-safe-bottom))));
        max-height: calc(100dvh - (var(--max-toast-top-offset) + var(--max-toast-safe-top) + max(var(--max-toast-viewport-gutter), var(--max-toast-safe-bottom))));
        z-index: var(--max-z-index-toast, var(--max-layer-toast, 1500));
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 10px;
        pointer-events: none;
        box-sizing: border-box;
        min-width: 0;
        /* stylelint-disable-next-line declaration-block-no-redundant-longhand-properties */
        overflow-x: clip;
        overflow-y: auto;
        overscroll-behavior: contain;

        /* ─── Card do toast ─── */
        .max-toast-item {
            box-sizing: border-box;
            pointer-events: auto;
            display: grid;
            grid-template-columns: auto minmax(0, 1fr) auto;
            grid-template-rows: 1fr auto;
            align-items: center;
            column-gap: 10px;
            min-width: 320px;
            max-width: min(420px, 100%);
            width: fit-content;
            flex-shrink: 0;
            padding: 14px 16px 0;
            border-radius: 10px;
            cursor: default;
            position: relative;
            overflow: hidden;
            color: #fff;
            border: 1px solid rgb(255 255 255 / 15%);
            box-shadow:
                0 4px 16px rgb(0 0 0 / 25%),
                0 1px 4px rgb(0 0 0 / 15%);
            transition: box-shadow 0.2s ease;

            &:not([class*='severity-']) {
                background: var(--background-0);
                color: var(--background-775);
                border: 1px solid var(--surface-border);
            }

            &.is-persistent {
                padding-bottom: 14px;
            }

            /* ── Cores por severidade ── */
            &.severity-success {
                background: var(--max-success-600);
            }

            &.severity-info {
                background: var(--max-info-600);
            }

            &.severity-warning {
                background: var(--max-warning-600);
            }

            &.severity-error {
                background: var(--max-danger-600);
            }

            &.severity-whatsapp {
                background: var(--max-whatsapp-surface, var(--max-whatsapp-700, #075e54));
                color: var(--max-whatsapp-content, #fff);
            }

            /* ─── Ícone ─── */
            .max-toast-icon {
                display: grid;
                place-items: center;
                color: inherit;
                opacity: 0.95;
            }

            /* ─── Conteúdo de texto ─── */
            .max-toast-content {
                min-width: 0;
                display: flex;
                flex-direction: column;
                gap: 2px;

                .max-toast-title {
                    font-size: 0.875rem;
                    font-weight: 600;
                    color: inherit;
                    line-height: 1.3;
                    overflow-wrap: anywhere;
                }

                .max-toast-message {
                    font-size: 0.78rem;
                    font-weight: 400;
                    color: rgb(255 255 255 / 75%);
                    line-height: 1.35;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                    overflow-wrap: anywhere;

                    &.is-expanded {
                        display: block;
                        -webkit-line-clamp: unset;
                        overflow: visible;
                        max-height: 200px;
                        overflow-y: auto;
                    }
                }

                .max-toast-actions {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 10px;
                    margin-top: 4px;

                    .toast-text-action {
                        background: transparent;
                        border: none;
                        padding: 0;
                        font-size: 0.75rem;
                        font-weight: 600;
                        color: rgb(255 255 255 / 90%);
                        text-decoration: underline;
                        cursor: pointer;

                        &:hover {
                            color: #fff;
                        }

                        &:focus-visible {
                            /* EXCEÇÃO LEGÍTIMA: superfície do toast é sempre colorida/escura.
                             * outline #fff garante contraste WCAG 1.4.11 ≥ 3:1 sobre fundo
                             * saturado. Token --max-focus-ring-color (teal) seria invisível aqui. */
                            outline: 2px solid #fff;
                            outline-offset: 2px;
                            border-radius: 2px;
                        }
                    }
                }

                .toast-copy-fallback {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                    margin-top: 6px;
                    padding: 6px 8px;
                    background: rgb(0 0 0 / 25%);
                    border-radius: 6px;

                    .toast-copy-error-msg {
                        font-size: 0.72rem;
                        color: rgb(255 255 255 / 90%);
                        line-height: 1.25;
                    }

                    .toast-copy-manual-input {
                        width: 100%;
                        box-sizing: border-box;
                        font-size: 0.75rem;
                        padding: 4px 6px;
                        border-radius: 4px;
                        border: 1px solid rgb(255 255 255 / 30%);
                        background: rgb(0 0 0 / 40%);
                        color: #fff;
                        user-select: all;

                        &:focus-visible {
                            /* EXCEÇÃO LEGÍTIMA: fundo colorido do toast — ver comentário em .toast-text-action */
                            outline: 2px solid #fff;
                            outline-offset: 1px;
                        }
                    }
                }
            }

            /* ─── Botão fechar ─── */
            .max-toast-close {
                background: none;
                border: none;
                color: rgb(255 255 255 / 70%);
                cursor: pointer;
                width: 26px;
                height: 26px;
                display: grid;
                place-items: center;
                border-radius: 6px;
                transition: background-color 0.15s ease, color 0.15s ease;
                padding: 0;

                &:hover {
                    background-color: rgb(255 255 255 / 15%);
                    color: #fff;
                }

                &:focus-visible {
                    /* EXCEÇÃO LEGÍTIMA: fundo colorido do toast — ver comentário em .toast-text-action */
                    outline: 2px solid #fff;
                    outline-offset: 2px;
                }
            }

            /* ─── Barra de progresso (edge-to-edge) ─── */
            .max-toast-progress {
                grid-column: 1 / -1;
                height: 3px;
                background: rgb(255 255 255 / 15%);
                border-radius: 0 0 10px 10px;
                overflow: hidden;
                margin: 12px -16px 0;
                width: calc(100% + 32px);

                .max-toast-progress-bar {
                    height: 100%;
                    border-radius: 3px;
                    background: rgb(255 255 255 / 50%);
                    animation: max-toast-shrink linear forwards;

                    &.paused {
                        animation-play-state: paused;
                    }
                }
            }
        }
    }

    @keyframes max-toast-shrink {
        from { width: 100%; }
        to { width: 0%; }
    }

    /* ─── Animações de entrada e saída ─── */
    .max-toast-enter-active {
        transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .max-toast-leave-active {
        transition: all 0.25s cubic-bezier(0.4, 0, 1, 1);
    }

    .max-toast-enter-from {
        opacity: 0;
        transform: translateX(60px) scale(0.96);
    }

    .max-toast-leave-to {
        opacity: 0;
        transform: translateX(60px) scale(0.96);
    }

    .max-toast-move {
        transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip-path: inset(50%);
        white-space: nowrap;
        border: 0;
    }

    /* stylelint-disable-next-line media-feature-range-notation */
    @media (max-width: 480px) {
        .max-toast-container {
            left: max(var(--max-toast-viewport-gutter), var(--max-toast-safe-left));
            right: max(var(--max-toast-viewport-gutter), var(--max-toast-safe-right));
            width: auto;
            max-width: none;
            align-items: stretch;

            .max-toast-item {
                width: 100%;
                min-width: 0;
                max-width: 100%;
            }
        }
    }

    @media (prefers-reduced-motion: reduce) {
        .max-toast-container .max-toast-wrapper .max-toast-card .max-toast-progress .max-toast-progress-bar {
            animation: none !important;
        }

        .max-toast-enter-active,
        .max-toast-leave-active {
            transition-duration: 0.01ms !important;
        }

        .max-toast-enter-from,
        .max-toast-leave-to {
            transform: none !important;
        }

        .max-toast-move {
            transition: none !important;
        }
    }
</style>
