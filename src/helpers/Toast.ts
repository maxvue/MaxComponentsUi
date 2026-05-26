import { useToastStore } from '../stores/useToast.Store';
import type { ToastPayload } from '../stores/useToast.Store';

/**
 * Helper global para exibir toasts de notificação.
 * Encapsula a store Pinia em uma API simples e direta.
 *
 * @example
 * Toast.show({ title: 'Salvo!', severity: 'success' });
 * Toast.hide(id);
 */
export const Toast = {

    /** Exibe um novo toast e retorna o ID gerado */
    add(payload: ToastPayload): string {
        return useToastStore().add(payload);
    },

    /** Alias de add — exibe um novo toast */
    show(payload: ToastPayload): string {
        return useToastStore().add(payload);
    },

    /** Remove um toast pelo ID */
    hide(id: string): void {
        useToastStore().remove(id);
    },

    /** Alias de hide — remove um toast pelo ID */
    delete(id: string): void {
        useToastStore().remove(id);
    },

    /** Limpa todos os toasts visíveis */
    clear(): void {
        useToastStore().clear();
    }
};
