import { nextTick, type Ref } from 'vue';

export interface FocusTrap {
    activate: () => void;
    deactivate: () => void;
    onKeydown: (event: KeyboardEvent) => void;
}

/** Seletor dos elementos que podem receber foco pelo teclado. */
const FOCUSABLE = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])'
].join(',');

/**
 * Mantem o foco do teclado dentro de um container enquanto ele estiver ativo,
 * devolvendo o foco ao elemento de origem quando desativado. Usado pelo
 * MaxDrawer para que a tabulacao nao escape para o conteudo atras da mascara.
 */
export const useFocusTrap = (el: Ref<HTMLElement | null>): FocusTrap => {

    /** Elemento que tinha o foco antes de o trap ser ativado. */
    let previous: HTMLElement | null = null;
    let isActive = false;

    const isBrowser = (): boolean => typeof window !== 'undefined' && typeof document !== 'undefined';

    /**
     * Verifica se o elemento e todos os seus ancestrais ate o container estao visiveis.
     */
    const isVisible = (element: HTMLElement): boolean => {
        if (typeof HTMLElement !== 'undefined' && !(element instanceof HTMLElement)) return false;
        let curr: HTMLElement | null = element;
        while (curr && curr !== el.value) {
            if (curr.hidden) return false;
            if (curr.style?.display === 'none') return false;
            if (curr.style?.visibility === 'hidden') return false;
            if (curr.getAttribute?.('aria-hidden') === 'true') return false;
            curr = curr.parentElement;
        }
        return true;
    };

    const focusable = (): HTMLElement[] => {
        if (!isBrowser() || !el.value) return [];
        return Array.from(el.value.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(isVisible);
    };

    const activate = () => {
        if (!isBrowser() || isActive) return;
        isActive = true;
        previous = (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement)
            ? document.activeElement
            : null;
        nextTick(() => {
            if (!isBrowser() || !isActive) return;
            const items = focusable();
            if (items.length > 0) items[0]?.focus();
            else if (el.value) {
                if (!el.value.hasAttribute('tabindex')) el.value.setAttribute('tabindex', '-1');

                el.value.focus();
            }
        });
    };

    const deactivate = () => {
        if (!isBrowser() || !isActive) {
            previous = null;
            return;
        }
        isActive = false;
        if (previous?.isConnected) previous.focus();

        previous = null;
    };

    const onKeydown = (event: KeyboardEvent) => {
        if (!isBrowser() || event.key !== 'Tab') return;

        const items = focusable();
        if (!items.length) {
            event.preventDefault();
            if (el.value) {
                if (!el.value.hasAttribute('tabindex')) el.value.setAttribute('tabindex', '-1');
                el.value.focus();
            }
            return;
        }

        const first = items[0];
        const last = items[items.length - 1];
        const target = event.target as HTMLElement | null;

        if (!target || !items.includes(target)) {
            event.preventDefault();
            (event.shiftKey ? last : first).focus();
            return;
        }

        if (event.shiftKey && target === first) {
            event.preventDefault();
            last.focus();
            return;
        }

        if (!event.shiftKey && target === last) {
            event.preventDefault();
            first.focus();
        }
    };

    return { activate, deactivate, onKeydown };
};
