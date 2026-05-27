import { defineStore } from 'pinia';
import type { Ref } from 'vue';
import { ref } from 'vue';

/** Severidades suportadas pelo toast */
export type ToastSeverity = 'success' | 'info' | 'warning' | 'error' | 'whatsapp';

/** Estrutura de um toast individual */
export interface ToastItem {
    /** Identificador único do toast */
    id: string;
    /** Título principal exibido no toast */
    title: string;
    /** Mensagem secundária (opcional) */
    message?: string;
    /** Severidade que define a cor/ícone */
    severity: ToastSeverity;
    /** Ícone customizado (usa default do severity se omitido) */
    icon?: string;
    /** Duração em ms antes de fechar automaticamente (default: 5000) */
    duration: number;
    /** Timestamp de criação para controle interno */
    createdAt: number;
    /** Se o timer está pausado (hover) */
    paused: boolean;
    /** Tempo restante em ms quando foi pausado */
    remaining: number;
    /** ID do setTimeout ativo */
    timerId: ReturnType<typeof setTimeout> | null;
}

/** Payload para adicionar um toast (campos opcionais têm defaults) */
export interface ToastPayload {
    title: string;
    message?: string;
    severity?: ToastSeverity;
    icon?: string;
    duration?: number;
}

/**
 * Store Pinia para gerenciar toasts de notificação.
 * Controla a fila de toasts visíveis, timers de auto-remoção
 * e pausar/resumir ao hover.
 */
export const useToastStore = defineStore('max-toast', () => {

    const items: Ref<ToastItem[]> = ref([]);

    /** Gera ID único para cada toast */
    const generateId = (): string => `toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    /** Remove um toast pelo id */
    const remove = (id: string): void => {
        const index = items.value.findIndex((t) => t.id === id);
        if (index < 0) return;

        const toast = items.value[index];
        if (toast.timerId) clearTimeout(toast.timerId);

        items.value.splice(index, 1);
    };

    /** Inicia o timer de auto-remoção de um toast */
    const startTimer = (toast: ToastItem, delay?: number): void => {
        const ms = delay ?? toast.remaining;
        toast.timerId = setTimeout(() => remove(toast.id), ms);
        toast.paused = false;
    };

    /** Adiciona um novo toast à fila */
    const add = (payload: ToastPayload): string => {
        const id = generateId();
        const duration = payload.duration ?? 4000;

        const toast: ToastItem = {
            id,
            title: payload.title,
            message: payload.message,
            severity: payload.severity ?? 'info',
            icon: payload.icon,
            duration,
            createdAt: Date.now(),
            paused: false,
            remaining: duration,
            timerId: null
        };

        items.value.push(toast);
        startTimer(toast, duration);

        return id;
    };

    /** Pausa o timer de um toast (ao hover) */
    const pause = (id: string): void => {
        const toast = items.value.find((t) => t.id === id);
        if (!toast || toast.paused) return;

        if (toast.timerId) clearTimeout(toast.timerId);

        const elapsed = Date.now() - toast.createdAt;
        toast.remaining = Math.max(toast.duration - elapsed, 500);
        toast.paused = true;
        toast.timerId = null;
    };

    /** Retoma o timer de um toast (ao sair do hover) */
    const resume = (id: string): void => {
        const toast = items.value.find((t) => t.id === id);
        if (!toast || !toast.paused) return;

        toast.createdAt = Date.now() - (toast.duration - toast.remaining);
        startTimer(toast);
    };

    /** Limpa todos os toasts */
    const clear = (): void => {
        items.value.forEach((t) => {
            if (t.timerId) clearTimeout(t.timerId);
        });
        items.value = [];
    };

    return { items, add, remove, pause, resume, clear };
});
