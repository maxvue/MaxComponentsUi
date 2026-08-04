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

    const focusable = (): HTMLElement[] => {
        if (! el.value) return [];
        return Array.from(el.value.querySelectorAll<HTMLElement>(FOCUSABLE));
    };

    const activate = () => {
        previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        nextTick(() => {
            const items = focusable();
            items[0]?.focus();
        });
    };

    const deactivate = () => {
        previous?.focus();
        previous = null;
    };

    const onKeydown = (event: KeyboardEvent) => {

        if (event.key !== 'Tab') return;

        const items = focusable();
        if (! items.length) return;

        const first = items[0];
        const last = items[items.length - 1];
        const target = event.target as HTMLElement | null;

        if (event.shiftKey && target === first) {
            event.preventDefault();
            last.focus();
            return;
        }

        if (! event.shiftKey && target === last) {
            event.preventDefault();
            first.focus();
        }
    };

    return { activate, deactivate, onKeydown };
};
