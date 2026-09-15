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
    isActive: Ref<boolean>;
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

interface RegisteredListener {
    target: EventTarget;
    type: string;
    listener: EventListenerOrEventListenerObject;
    options?: boolean | AddEventListenerOptions;
}

let nextId = 1;
const overlayStack: OverlayEntry[] = [];
let isGlobalAttached = false;
let globalRafId: number | null = null;
let pointerDownTargetInsideTop = false;
let lastCloseReason: 'outside' | 'escape' | null = null;

const registeredGlobalListeners: RegisteredListener[] = [];

function addGlobalListener(
    target: EventTarget,
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
) {
    if (options !== undefined) target.addEventListener(type, listener, options);
    else target.addEventListener(type, listener);

    registeredGlobalListeners.push({ target, type, listener, options });
}

function removeAllGlobalListeners() {
    for (const entry of registeredGlobalListeners) if (entry.options !== undefined) entry.target.removeEventListener(entry.type, entry.listener, entry.options);
    else entry.target.removeEventListener(entry.type, entry.listener);


    registeredGlobalListeners.length = 0;
}

export function getActiveOutsidePointerListenersCount(): number {
    return registeredGlobalListeners.length;
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

function restoreOverlayFocus(entry: OverlayEntry, reason: 'outside' | 'escape') {
    if (entry.restoreFocus === false || typeof document === 'undefined') return;

    const currentActive = document.activeElement;
    const isFocusOnExternalControl =
        currentActive &&
        currentActive !== document.body &&
        currentActive !== document.documentElement &&
        !isInsideElements(currentActive, entry.elements());

    // Não rouba foco do controle clicado no clique-through.
    if (reason !== 'escape' && isFocusOnExternalControl) return;

    const explicitTrigger = typeof entry.triggerEl === 'function' ? entry.triggerEl() : entry.triggerEl?.value;
    const targetToFocus =
        explicitTrigger && (explicitTrigger.isConnected ?? document.body.contains(explicitTrigger))
            ? explicitTrigger
            : entry.previousActiveElement && (entry.previousActiveElement.isConnected ?? document.body.contains(entry.previousActiveElement))
                ? entry.previousActiveElement
                : null;

    if (targetToFocus && typeof targetToFocus.focus === 'function') targetToFocus.focus();
}

/**
 * Remove a entrada antes de notificar o consumidor. A mudança reativa de
 * `isOpen` só acontece no tick seguinte, portanto ela não pode ser a barreira
 * contra dois eventos globais consecutivos solicitarem o mesmo fechamento.
 */
function requestClose(entry: OverlayEntry, reason: 'outside' | 'escape') {
    const idx = overlayStack.findIndex((item) => item.id === entry.id);
    if (idx < 0) return;

    overlayStack.splice(idx, 1);
    entry.isActive.value = false;
    lastCloseReason = reason;
    restoreOverlayFocus(entry, reason);

    if (overlayStack.length === 0 && isGlobalAttached) {
        detachGlobalListeners();
        pointerDownTargetInsideTop = false;
    }

    entry.onClose(reason);
}

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
        requestClose(topOverlay, 'escape');
    }
};

const onGlobalPointerDown = (e: PointerEvent | MouseEvent | TouchEvent) => {
    if (overlayStack.length === 0) {
        pointerDownTargetInsideTop = false;
        return;
    }
    const target = e.target as Node | null;
    const topOverlay = overlayStack[overlayStack.length - 1];

    // Verifica se o pointerdown ocorreu dentro da camada superior (topo da pilha)
    pointerDownTargetInsideTop = isInsideElements(target, topOverlay.elements());
};

const onGlobalClick = (e: MouseEvent) => {
    if (overlayStack.length === 0) {
        pointerDownTargetInsideTop = false;
        return;
    }

    const topOverlay = overlayStack[overlayStack.length - 1];
    const target = e.target as Node | null;

    const isInsideTop = isInsideElements(target, topOverlay.elements());
    const startedInsideTop = pointerDownTargetInsideTop;
    pointerDownTargetInsideTop = false;

    // Se começou dentro do topo ou terminou dentro do topo, não fecha o topo
    if (startedInsideTop || isInsideTop) return;

    const canDismiss = topOverlay.dismissable !== undefined ? Boolean(unref(topOverlay.dismissable)) : true;
    if (canDismiss) requestClose(topOverlay, 'outside');
};

const handleGlobalReposition = () => {
    if (globalRafId !== null) return;
    const runReposition = () => {
        globalRafId = null;
        for (const overlay of overlayStack) if (overlay.onReposition && (overlay.repositionOnScroll || overlay.repositionOnResize)) {
            // Se o trigger/âncora foi desconectado do DOM, fecha o overlay em vez de reposicionar erraticamente
            const trigger = typeof overlay.triggerEl === 'function' ? overlay.triggerEl() : overlay.triggerEl?.value;
            if (trigger && !trigger.isConnected) {
                requestClose(overlay, 'outside');
                continue;
            }
            overlay.onReposition();
        }

    };

    if (typeof requestAnimationFrame !== 'undefined') globalRafId = requestAnimationFrame(runReposition);
    else runReposition();

};

const attachGlobalListeners = () => {
    if (isGlobalAttached || typeof window === 'undefined') return;

    // Keydown unificado em document (eliminando registro duplicado em window)
    addGlobalListener(document, 'keydown', onGlobalKeydown as EventListener);

    // Pointerdown e click em document capture para clique-through
    addGlobalListener(document, 'pointerdown', onGlobalPointerDown as EventListener, true);
    addGlobalListener(document, 'click', onGlobalClick as EventListener, true);

    // Reposition em scroll e resize da janela
    addGlobalListener(window, 'scroll', handleGlobalReposition as EventListener, true);
    addGlobalListener(window, 'resize', handleGlobalReposition as EventListener, true);

    // Suporte a zoom e redimensionamento via visualViewport quando disponível
    if (window.visualViewport) {
        addGlobalListener(window.visualViewport, 'resize', handleGlobalReposition as EventListener);
        addGlobalListener(window.visualViewport, 'scroll', handleGlobalReposition as EventListener);
    }

    isGlobalAttached = true;
};

const detachGlobalListeners = () => {
    if (!isGlobalAttached || typeof window === 'undefined') return;
    if (globalRafId !== null && typeof cancelAnimationFrame !== 'undefined') {
        cancelAnimationFrame(globalRafId);
        globalRafId = null;
    }
    removeAllGlobalListeners();
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
            isActive,
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
            restoreOverlayFocus(entry, lastCloseReason ?? 'outside');
        }

        if (overlayStack.length === 0 && isGlobalAttached) {
            detachGlobalListeners();
            lastCloseReason = null;
            pointerDownTargetInsideTop = false;
        }
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
    lastHandledKeyEvent = null;
    lastCloseReason = null;
    pointerDownTargetInsideTop = false;
    if (isGlobalAttached) detachGlobalListeners();

}
