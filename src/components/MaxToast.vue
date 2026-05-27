<template>
    <TransitionGroup name="max-toast" tag="div" class="max-toast-container">
        <div
            v-for="toast in toastStore.items"
            :key="toast.id"
            :class="['max-toast-item', `severity-${toast.severity}`]"
            @mouseenter="toastStore.pause(toast.id)"
            @mouseleave="toastStore.resume(toast.id)"
        >
            <!-- Ícone da severidade -->
            <div class="max-toast-icon">
                <MaxIcon :i="resolveIcon(toast)" size="1.6" color="inherit" />
            </div>

            <!-- Conteúdo -->
            <div class="max-toast-content">
                <div class="max-toast-title">{{ toast.title }}</div>
                <div class="max-toast-message" v-if="toast.message">{{ toast.message }}</div>
            </div>

            <!-- Botão fechar -->
            <button class="max-toast-close" @click="toastStore.remove(toast.id)" aria-label="Fechar">
                <MaxIcon i="mdi:close" size="1.1" color="inherit" />
            </button>

            <!-- Barra de progresso -->
            <div class="max-toast-progress">
                <div
                    :class="['max-toast-progress-bar', { paused: toast.paused }]"
                    :style="{ animationDuration: `${toast.duration}ms` }"
                />
            </div>
        </div>
    </TransitionGroup>
</template>

<script setup lang="ts">
    import { useToastStore } from '../stores/useToast.Store';
    import type { ToastItem } from '../stores/useToast.Store';
    import MaxIcon from './MaxIcon.vue';

    const toastStore = useToastStore();

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

<style lang="scss">
    /* ─── Container principal ─── */
    .max-toast-container {
        position: fixed;
        top: 74px;
        right: 16px;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 10px;
        pointer-events: none;
        max-height: calc(100vh - 90px);
        overflow: hidden;
    }

    /* ─── Card do toast ─── */
    .max-toast-item {
        pointer-events: auto;
        display: grid;
        grid-template-columns: auto 1fr auto;
        grid-template-rows: 1fr auto;
        align-items: center;
        column-gap: 10px;
        min-width: 320px;
        max-width: 420px;
        width: fit-content;
        padding: 14px 16px 0;
        border-radius: 10px;
        cursor: default;
        position: relative;
        overflow: hidden;
        color: #fff;
        box-shadow:
            0 4px 16px rgb(0 0 0 / 25%),
            0 1px 4px rgb(0 0 0 / 15%);
        transition: box-shadow 0.2s ease;

        /* ── Cores por severidade ── */
        &.severity-success {
            background: var(--success-650, #0f766e);
        }

        &.severity-info {
            background: var(--info-600, #2563eb);
        }

        &.severity-warning {
            background: var(--warn-600, #b45309);
        }

        &.severity-error {
            background: var(--danger-600, #dc2626);
        }

        &.severity-whatsapp {
            background: #128C7E;
        }
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
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
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
    }

    .max-toast-progress-bar {
        height: 100%;
        border-radius: 3px;
        background: rgb(255 255 255 / 50%);
        animation: max-toast-shrink linear forwards;

        &.paused {
            animation-play-state: paused;
        }
    }

    @keyframes max-toast-shrink {
        from { width: 100%; }
        to   { width: 0%; }
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
</style>
