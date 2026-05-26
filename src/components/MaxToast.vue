<template>
    <TransitionGroup name="max-toast" tag="div" class="max-toast-container">
        <div v-for="toast in toastStore.items" :key="toast.id" :class="['max-toast-item', `severity-${toast.severity}`]" @mouseenter="toastStore.pause(toast.id)" @mouseleave="toastStore.resume(toast.id)" >
            <!-- Ícone da severidade -->
            <div :class="['max-toast-icon', `severity-${toast.severity}`]">
                <MaxIcon :i="resolveIcon(toast)" size="1.2" color="inherit" />
            </div>

            <!-- Conteúdo -->
            <div class="max-toast-content">
                <div class="max-toast-title">{{ toast.title }}</div>
                <div class="max-toast-message" v-if="toast.message">{{ toast.message }}</div>
            </div>

            <!-- Botão fechar -->
            <button class="max-toast-close" @click="toastStore.remove(toast.id)" aria-label="Fechar">
                <MaxIcon i="mdi:close" size="0.85" color="inherit" />
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
        success: 'material-symbols:check-circle',
        info: 'material-symbols:info',
        warning: 'material-symbols:warning',
        error: 'material-symbols:error'
    };

    /** Retorna o ícone adequado para o toast */
    const resolveIcon = (toast: ToastItem): string => {
        return toast.icon ?? severityIconMap[toast.severity] ?? severityIconMap.info;
    };
</script>

<style lang="scss">
    .max-toast-container {
        position: fixed;
        top: 74px;
        right: 16px;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        gap: 8px;
        pointer-events: none;
        max-height: calc(100vh - 90px);
        overflow: hidden;
    }

    .max-toast-item {
        pointer-events: auto;
        display: grid;
        grid-template-columns: 36px 1fr 28px;
        grid-template-rows: 1fr auto;
        align-items: start;
        gap: 10px;
        width: 360px;
        padding: 12px 14px 0;
        border-radius: 10px;
        backdrop-filter: blur(16px);
        border: 1px solid rgb(255 255 255 / 8%);
        box-shadow:
            0 8px 32px rgb(0 0 0 / 25%),
            0 2px 8px rgb(0 0 0 / 15%);
        cursor: default;
        position: relative;
        overflow: hidden;

        &.severity-success {
            background: linear-gradient(135deg, rgb(34 197 94 / 12%) 0%, rgb(20 20 30 / 92%) 100%);
            border-color: rgb(34 197 94 / 20%);
        }

        &.severity-info {
            background: linear-gradient(135deg, rgb(59 130 246 / 12%) 0%, rgb(20 20 30 / 92%) 100%);
            border-color: rgb(59 130 246 / 20%);
        }

        &.severity-warning {
            background: linear-gradient(135deg, rgb(245 158 11 / 12%) 0%, rgb(20 20 30 / 92%) 100%);
            border-color: rgb(245 158 11 / 20%);
        }

        &.severity-error {
            background: linear-gradient(135deg, rgb(239 68 68 / 12%) 0%, rgb(20 20 30 / 92%) 100%);
            border-color: rgb(239 68 68 / 20%);
        }
    }

    .max-toast-icon {
        width: 32px;
        height: 32px;
        border-radius: 8px;
        display: grid;
        place-items: center;
        flex-shrink: 0;
        margin-top: 1px;

        &.severity-success {
            background-color: rgb(34 197 94 / 18%);
            color: #4ade80;
        }

        &.severity-info {
            background-color: rgb(59 130 246 / 18%);
            color: #60a5fa;
        }

        &.severity-warning {
            background-color: rgb(245 158 11 / 18%);
            color: #fbbf24;
        }

        &.severity-error {
            background-color: rgb(239 68 68 / 18%);
            color: #f87171;
        }
    }

    .max-toast-content {
        min-width: 0;
        padding-bottom: 12px;

        .max-toast-title {
            font-size: 0.85rem;
            font-weight: 600;
            color: rgb(255 255 255 / 90%);
            line-height: 1.35;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .max-toast-message {
            font-size: 0.78rem;
            color: rgb(255 255 255 / 55%);
            margin-top: 3px;
            line-height: 1.4;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }
    }

    .max-toast-close {
        background: none;
        border: none;
        color: rgb(255 255 255 / 35%);
        cursor: pointer;
        width: 24px;
        height: 24px;
        display: grid;
        place-items: center;
        border-radius: 6px;
        transition: background-color 0.15s ease, color 0.15s ease;
        padding: 0;

        &:hover {
            background-color: rgb(255 255 255 / 10%);
            color: rgb(255 255 255 / 70%);
        }
    }

    /* Barra de progresso */
    .max-toast-progress {
        grid-column: 1 / -1;
        height: 3px;
        background: rgb(255 255 255 / 6%);
        border-radius: 0 0 10px 10px;
        overflow: hidden;
    }

    .max-toast-progress-bar {
        height: 100%;
        border-radius: 3px;
        animation: max-toast-shrink linear forwards;

        .severity-success & {
            background: linear-gradient(90deg, #4ade80, #22c55e);
        }

        .severity-info & {
            background: linear-gradient(90deg, #60a5fa, #3b82f6);
        }

        .severity-warning & {
            background: linear-gradient(90deg, #fbbf24, #f59e0b);
        }

        .severity-error & {
            background: linear-gradient(90deg, #f87171, #ef4444);
        }

        &.paused {
            animation-play-state: paused;
        }
    }

    @keyframes max-toast-shrink {
        from {
            width: 100%;
        }

        to {
            width: 0%;
        }
    }

    /* Animações de entrada e saída (TransitionGroup) */
    .max-toast-enter-active {
        transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .max-toast-leave-active {
        transition: all 0.25s cubic-bezier(0.4, 0, 1, 1);
    }

    .max-toast-enter-from {
        opacity: 0;
        transform: translateX(80px) scale(0.95);
    }

    .max-toast-leave-to {
        opacity: 0;
        transform: translateX(80px) scale(0.95);
    }

    .max-toast-move {
        transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
</style>
