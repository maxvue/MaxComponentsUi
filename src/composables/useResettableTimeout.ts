import { onBeforeUnmount, ref } from 'vue';

export interface UseResettableTimeoutReturn {
    start: (callback: () => void, delayMs?: number) => void;
    clear: () => void;
    readonly isActive: boolean;
}

/**
 * Composable que gerencia um timeout renovável com cancelamento idempotente
 * e proteção automática de ciclo de vida no unmount.
 */
export function useResettableTimeout(defaultDelayMs = 2000): UseResettableTimeoutReturn {
    let timerId: ReturnType<typeof setTimeout> | null = null;
    let isMounted = true;
    const activeRef = ref(false);

    const clear = () => {
        if (timerId !== null) {
            clearTimeout(timerId);
            timerId = null;
        }
        activeRef.value = false;
    };

    const start = (callback: () => void, delayMs = defaultDelayMs) => {
        clear();
        activeRef.value = true;
        timerId = setTimeout(() => {
            timerId = null;
            activeRef.value = false;
            if (isMounted) callback();
        }, delayMs);
    };

    onBeforeUnmount(() => {
        isMounted = false;
        clear();
    });

    return {
        start,
        clear,
        get isActive() {
            return activeRef.value;
        }
    };
}
