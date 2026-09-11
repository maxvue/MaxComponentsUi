import { ref, watch, onBeforeUnmount, unref, type Ref, type ComputedRef } from 'vue';

type MaybeRef<T> = Ref<T> | ComputedRef<T> | T;

export interface UseActiveElementBoundingOptions {
    /** Se true, reseta todas as variáveis para 0 quando inativo. Padrão: false (preserva última posição) */
    resetOnInactive?: boolean;
}

/**
 * Mede as coordenadas geométricas de um elemento no viewport sob demanda,
 * registrando ouvintes de `scroll` e `resize` exclusivamente quando `isActive` for true.
 */
export function useActiveElementBounding(
    target: MaybeRef<HTMLElement | null | undefined>,
    isActive: MaybeRef<boolean>,
    options: UseActiveElementBoundingOptions = {}
) {
    const x = ref(0);
    const y = ref(0);
    const top = ref(0);
    const bottom = ref(0);
    const left = ref(0);
    const right = ref(0);
    const width = ref(0);
    const height = ref(0);

    const update = () => {
        const raw = unref(target);
        const el = (raw as any)?.$el ?? raw;
        if (!el || typeof el.getBoundingClientRect !== 'function') {
            if (options.resetOnInactive) {
                x.value = 0;
                y.value = 0;
                top.value = 0;
                bottom.value = 0;
                left.value = 0;
                right.value = 0;
                width.value = 0;
                height.value = 0;
            }
            return;
        }

        const rect = el.getBoundingClientRect();
        x.value = rect.x ?? rect.left ?? 0;
        y.value = rect.y ?? rect.top ?? 0;
        top.value = rect.top ?? 0;
        bottom.value = rect.bottom ?? 0;
        left.value = rect.left ?? 0;
        right.value = rect.right ?? 0;
        width.value = rect.width ?? 0;
        height.value = rect.height ?? 0;
    };

    let isListening = false;

    const startListening = () => {
        if (isListening) return;
        isListening = true;
        update();
        if (typeof window !== 'undefined') {
            window.addEventListener('scroll', update, { capture: true, passive: true });
            window.addEventListener('resize', update, { passive: true });
        }
    };

    const stopListening = () => {
        if (!isListening) return;
        isListening = false;
        if (typeof window !== 'undefined') {
            window.removeEventListener('scroll', update, { capture: true });
            window.removeEventListener('resize', update);
        }
        if (options.resetOnInactive) update();

    };

    watch(
        [() => unref(isActive), () => unref(target)],
        ([active]) => {
            if (active) startListening();
            else stopListening();

        },
        { immediate: true, flush: 'sync' }
    );

    onBeforeUnmount(() => {
        stopListening();
    });

    return {
        x,
        y,
        top,
        bottom,
        left,
        right,
        width,
        height,
        update
    };
}
