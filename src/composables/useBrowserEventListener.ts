import { onBeforeUnmount, onMounted, watch, type Ref } from 'vue';

export interface UseBrowserEventListenerOptions {
    target?: 'document' | 'window' | EventTarget;
    capture?: boolean;
    passive?: boolean;
}

/**
 * Anexa um event listener de browser com segurança para SSR e ciclo de vida idempotente.
 *
 * - Em ambiente servidor (SSR), é um no-op completo (sem acesso a `window` ou `document`).
 * - Se fornecida uma condição reativa `isActive`, conecta o listener somente após a montagem
 *   (`onMounted`) quando `isActive` for verdadeiro, e desconecta quando passar a falso ou no unmount.
 * - Evita registros duplicados e garante cleanup simétrico.
 */
export function useBrowserEventListener(
    event: string,
    handler: (event: any) => void,
    isActive?: Ref<boolean> | (() => boolean),
    options?: UseBrowserEventListenerOptions
): { attach: () => void; detach: () => void } {
    let isAttached = false;
    let isMounted = false;

    const getTarget = (): EventTarget | null => {
        if (typeof window === 'undefined' || typeof document === 'undefined') return null;
        if (!options?.target || options.target === 'document') return document;
        if (options.target === 'window') return window;
        return options.target;
    };

    const attach = () => {
        if (isAttached) return;
        const target = getTarget();
        if (!target) return;
        target.addEventListener(event, handler, {
            capture: options?.capture,
            passive: options?.passive
        });
        isAttached = true;
    };

    const detach = () => {
        if (!isAttached) return;
        const target = getTarget();
        if (target) target.removeEventListener(event, handler, {
            capture: options?.capture
        });
        isAttached = false;
    };

    if (isActive) {
        const getter = typeof isActive === 'function' ? isActive : () => isActive.value;
        watch(getter, (active) => {
            if (!isMounted) return;
            if (active) attach();
            else detach();
        });
    }

    onMounted(() => {
        isMounted = true;
        if (isActive) {
            const active = typeof isActive === 'function' ? isActive() : isActive.value;
            if (active) attach();
        } else attach();
    });

    onBeforeUnmount(() => {
        detach();
    });

    return { attach, detach };
}
