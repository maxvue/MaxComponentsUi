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
    previousActiveElement: HTMLElement | null;
    triggerEl?: Ref<HTMLElement | null | undefined> | (() => HTMLElement | null | undefined);
    restoreFocus?: boolean;
    onReposition?: () => void;
    repositionOnScroll?: boolean;
    repositionOnResize?: boolean;
}

let nextId = 1;
const overlayStack: OverlayEntry[] = [];
let isGlobalAttached = false;
let globalRafId: number | null = null;
let pointerDownTargetInside: boolean = false;

export function getActiveOutsidePointerListenersCount(): number {
    return isGlobalAttached ? 5 : 0;
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

let lastHandledKeyEvent: KeyboardEvent | null = null;
const onGlobalKeydown = (e: KeyboardEvent) => {
    if (lastHandledKeyEvent === e) return;
    lastHandledKeyEvent = e;
    if (e.key !== 'Escape' || overlayStack.length === 0) return;

    // Apenas o overlay no TOPO da pilha fecha com Escape
    const topOverlay = overlayStack[overlayStack.length - 1];
    const canClose = topOverlay.closeOnEscape !== undefined ? Boolean(unref(topOverlay.closeOnEscape)) : true;

    if (canClose) {
        e.stopPropagation();
        e.preventDefault();
        topOverlay.onClose('escape');
    }
};

const onGlobalPointerDown = (e: PointerEvent | MouseEvent | TouchEvent) => {
    if (overlayStack.length === 0) return;
    const target = e.target as Node | null;

    pointerDownTargetInside = false;
    for (let i = overlayStack.length - 1; i >= 0; i--) if (isInsideElements(target, overlayStack[i].elements())) {
        pointerDownTargetInside = true;
        break;
    }

};

const onGlobalClick = (e: MouseEvent) => {
    if (overlayStack.length === 0) return;

    if (pointerDownTargetInside) {
        pointerDownTargetInside = false;
        return;
    }

    const target = e.target as Node | null;

    const topOverlay = overlayStack[overlayStack.length - 1];
    const canDismiss = topOverlay.dismissable !== undefined ? Boolean(unref(topOverlay.dismissable)) : true;

    if (canDismiss && !isInsideElements(target, topOverlay.elements())) topOverlay.onClose('outside');


    pointerDownTargetInside = false;
};

const handleGlobalReposition = () => {
    if (globalRafId !== null) return;
    if (typeof requestAnimationFrame !== 'undefined') globalRafId = requestAnimationFrame(() => {
        globalRafId = null;
        for (const overlay of overlayStack) if (overlay.onReposition && (overlay.repositionOnScroll || overlay.repositionOnResize)) overlay.onReposition();


    });
    else for (const overlay of overlayStack) if (overlay.onReposition && (overlay.repositionOnScroll || overlay.repositionOnResize)) overlay.onReposition();


};

const attachGlobalListeners = () => {
    if (isGlobalAttached || typeof window === 'undefined') return;
    window.addEventListener('keydown', onGlobalKeydown);
    document.addEventListener('keydown', onGlobalKeydown);
    document.addEventListener('pointerdown', onGlobalPointerDown, true);
    document.addEventListener('click', onGlobalClick, true);
    window.addEventListener('scroll', handleGlobalReposition, true);
    window.addEventListener('resize', handleGlobalReposition, true);
    isGlobalAttached = true;
};

const detachGlobalListeners = () => {
    if (!isGlobalAttached || typeof window === 'undefined') return;
    if (globalRafId !== null && typeof cancelAnimationFrame !== 'undefined') {
        cancelAnimationFrame(globalRafId);
        globalRafId = null;
    }
    window.removeEventListener('keydown', onGlobalKeydown);
    document.removeEventListener('keydown', onGlobalKeydown);
    document.removeEventListener('pointerdown', onGlobalPointerDown, true);
    document.removeEventListener('click', onGlobalClick, true);
    window.removeEventListener('scroll', handleGlobalReposition, true);
    window.removeEventListener('resize', handleGlobalReposition, true);
    isGlobalAttached = false;
};

export function useOutsidePointer(
    isOpen: Ref<boolean>,
    options: UseOutsidePointerOptions
): UseOutsidePointerResult {
    const id = nextId++;
    const isActive = ref(false);

    const activate = () => {
        if (isActive.value) return;
        isActive.value = true;

        const previousActiveElement = typeof document !== 'undefined' ? (document.activeElement as HTMLElement | null) : null;

        const entry: OverlayEntry = {
            id,
            elements: options.elements,
            onClose: options.onClose,
            closeOnEscape: options.closeOnEscape,
            dismissable: options.dismissable,
            previousActiveElement,
            triggerEl: options.triggerEl,
            restoreFocus: options.restoreFocus,
            onReposition: options.onReposition,
            repositionOnScroll: options.repositionOnScroll,
            repositionOnResize: options.repositionOnResize
        };

        overlayStack.push(entry);

        if (!isGlobalAttached) attachGlobalListeners();

    };

    const deactivate = () => {
        if (!isActive.value) return;
        isActive.value = false;

        const idx = overlayStack.findIndex((item) => item.id === id);
        if (idx >= 0) {
            const entry = overlayStack[idx];
            overlayStack.splice(idx, 1);

            if (entry.restoreFocus !== false && typeof document !== 'undefined') {
                const explicitTrigger = typeof entry.triggerEl === 'function' ? entry.triggerEl() : entry.triggerEl?.value;
                const targetToFocus = explicitTrigger ?? entry.previousActiveElement;
                if (targetToFocus && typeof targetToFocus.focus === 'function' && document.body.contains(targetToFocus)) targetToFocus.focus();

            }
        }

        if (overlayStack.length === 0 && isGlobalAttached) detachGlobalListeners();

    };

    watch(
        isOpen,
        (open) => {
            if (open) activate();
            else deactivate();
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

export function resetOutsidePointerStateForTests() {
    overlayStack.length = 0;
    if (isGlobalAttached) detachGlobalListeners();

}
