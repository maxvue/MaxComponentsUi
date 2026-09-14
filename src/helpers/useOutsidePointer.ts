import { ref, watch, onBeforeUnmount, type Ref, unref } from 'vue';

export interface UseOutsidePointerOptions {
    /** Função que retorna elementos que compõem o overlay / trigger e NÃO devem disparar fechamento */
    elements: () => (Node | null | undefined)[];
    /** Callback chamado ao solicitar o fechamento (por clique fora ou tecla Escape) */
    onClose: (reason: 'outside' | 'escape') => void;
    /** Se deve fechar ao pressionar a tecla Escape. Padrão: true */
    closeOnEscape?: boolean | Ref<boolean | undefined>;
    /** Se deve fechar ao clicar fora. Padrão: true */
    dismissable?: boolean | Ref<boolean | undefined>;
    /** Se deve restaurar o foco no fechamento. Padrão: true */
    restoreFocus?: boolean;
    /** Elemento explícito de trigger para restauração de foco */
    triggerEl?: Ref<HTMLElement | null | undefined> | (() => HTMLElement | null | undefined);
    /** Callback opcional de reposicionamento disparado em scroll ou resize */
    onReposition?: () => void;
    /** Se deve monitorar scroll ancestral para reposicionamento. Padrão: false */
    repositionOnScroll?: boolean;
    /** Se deve monitorar resize de janela para reposicionamento. Padrão: false */
    repositionOnResize?: boolean;
}

export interface UseOutsidePointerResult {
    /** Ativa manualmente os listeners */
    activate: () => void;
    /** Desativa manualmente os listeners */
    deactivate: () => void;
    /** Indica se o handler está atualmente ativo */
    isActive: Ref<boolean>;
}

interface OverlayEntry {
    id: number;
    elements: () => (Node | null | undefined)[];
    onClose: (reason: 'outside' | 'escape') => void;
    closeOnEscape?: boolean | Ref<boolean | undefined>;
    dismissable?: boolean | Ref<boolean | undefined>;
}

let nextId = 1;
const overlayStack: OverlayEntry[] = [];
let activeListenerCount = 0;

export function getActiveOutsidePointerListenersCount(): number {
    return activeListenerCount;
}

export function getOverlayStackDepth(): number {
    return overlayStack.length;
}

function isInsideElements(target: Node | null, elements: (Node | null | undefined)[]): boolean {
    if (!target) return false;
    for (const el of elements) {
        if (!el) continue;
        if (el === target || el.contains(target)) return true;
    }
    return false;
}

/**
 * Primitiva unificada para overlays:
 * - Outside pointer com clique-through (não engole cliques externos legítimos)
 * - Tecla Escape coordenada por pilha (apenas o overlay do topo fecha)
 * - Retorno de foco acessível
 * - Reposicionamento opcional com scroll ancestral e resize
 * - Teardown estrito e determinístico (zero listeners vazados)
 */
export function useOutsidePointer(
    isOpen: Ref<boolean>,
    options: UseOutsidePointerOptions
): UseOutsidePointerResult {
    const id = nextId++;
    const isActive = ref(false);
    let previousActiveElement: HTMLElement | null = null;
    let rafId: number | null = null;
    let scrollAttached = false;
    let resizeAttached = false;
    let instanceListenersAttached = false;
    let pointerDownInside = false;

    const entry: OverlayEntry = {
        id,
        elements: options.elements,
        onClose: options.onClose,
        closeOnEscape: options.closeOnEscape,
        dismissable: options.dismissable
    };

    const onKeydown = (e: KeyboardEvent) => {
        if (e.key !== 'Escape') return;
        // Apenas o overlay no TOPO da pilha fecha com Escape
        if (overlayStack.length > 0 && overlayStack[overlayStack.length - 1].id !== id) {
            return;
        }
        const canClose = options.closeOnEscape !== undefined ? Boolean(unref(options.closeOnEscape)) : true;
        if (canClose) {
            e.stopPropagation();
            options.onClose('escape');
        }
    };

    const onDocPointerDown = (e: PointerEvent | MouseEvent | TouchEvent) => {
        const target = e.target as Node | null;
        pointerDownInside = isInsideElements(target, options.elements());
    };

    const onDocClick = (e: MouseEvent) => {
        const canDismiss = options.dismissable !== undefined ? Boolean(unref(options.dismissable)) : true;
        if (!canDismiss) return;

        if (pointerDownInside) {
            pointerDownInside = false;
            return;
        }

        const target = e.target as Node | null;
        if (!isInsideElements(target, options.elements())) {
            options.onClose('outside');
        }
    };

    const handleReposition = () => {
        if (!options.onReposition) return;
        if (typeof requestAnimationFrame !== 'undefined') {
            if (rafId !== null) cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(() => {
                rafId = null;
                options.onReposition?.();
            });
        } else {
            options.onReposition();
        }
    };

    const attachInstanceListeners = () => {
        if (instanceListenersAttached || typeof window === 'undefined') return;
        window.addEventListener('keydown', onKeydown);
        document.addEventListener('keydown', onKeydown);
        document.addEventListener('pointerdown', onDocPointerDown);
        document.addEventListener('click', onDocClick);
        instanceListenersAttached = true;
        activeListenerCount += 4;

        if (options.repositionOnScroll && !scrollAttached) {
            window.addEventListener('scroll', handleReposition, true);
            scrollAttached = true;
            activeListenerCount++;
        }
        if (options.repositionOnResize && !resizeAttached) {
            window.addEventListener('resize', handleReposition);
            resizeAttached = true;
            activeListenerCount++;
        }
    };

    const detachInstanceListeners = () => {
        if (typeof window === 'undefined') return;
        if (rafId !== null && typeof cancelAnimationFrame !== 'undefined') {
            cancelAnimationFrame(rafId);
            rafId = null;
        }
        if (scrollAttached) {
            window.removeEventListener('scroll', handleReposition, true);
            scrollAttached = false;
            activeListenerCount = Math.max(0, activeListenerCount - 1);
        }
        if (resizeAttached) {
            window.removeEventListener('resize', handleReposition);
            resizeAttached = false;
            activeListenerCount = Math.max(0, activeListenerCount - 1);
        }
        if (instanceListenersAttached) {
            window.removeEventListener('keydown', onKeydown);
            document.removeEventListener('keydown', onKeydown);
            document.removeEventListener('pointerdown', onDocPointerDown);
            document.removeEventListener('click', onDocClick);
            instanceListenersAttached = false;
            activeListenerCount = Math.max(0, activeListenerCount - 4);
        }
    };

    const activate = () => {
        if (isActive.value) return;
        isActive.value = true;

        if (typeof document !== 'undefined') {
            previousActiveElement = document.activeElement as HTMLElement | null;
        }

        pointerDownInside = false;
        overlayStack.push(entry);
        attachInstanceListeners();
    };

    const deactivate = () => {
        if (!isActive.value) return;
        isActive.value = false;

        const idx = overlayStack.findIndex((item) => item.id === id);
        if (idx >= 0) {
            overlayStack.splice(idx, 1);
        }

        detachInstanceListeners();

        if (options.restoreFocus !== false && typeof document !== 'undefined') {
            const explicitTrigger = typeof options.triggerEl === 'function' ? options.triggerEl() : options.triggerEl?.value;
            const targetToFocus = explicitTrigger ?? previousActiveElement;
            if (targetToFocus && typeof targetToFocus.focus === 'function' && document.body.contains(targetToFocus)) {
                targetToFocus.focus();
            }
        }
        previousActiveElement = null;
    };

    watch(
        isOpen,
        (open) => {
            if (open) {
                activate();
            } else {
                deactivate();
            }
        },
        { immediate: true }
    );

    onBeforeUnmount(() => {
        deactivate();
    });

    return {
        activate,
        deactivate,
        isActive
    };
}
