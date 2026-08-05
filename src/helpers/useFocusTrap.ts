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

    /**
     * Verifica se o elemento esta visivel. `offsetParent` e
     * `getBoundingClientRect` nao funcionam de forma confiavel no happy-dom
     * (ambiente de teste), entao a checagem se restringe a atributos e
     * estilos inline que sao verificaveis tanto no browser quanto nos testes.
     */
    const isVisible = (element: HTMLElement): boolean => {
        if (element.hidden) return false;
        if (element.style.display === 'none') return false;
        if (element.style.visibility === 'hidden') return false;
        if (element.getAttribute('aria-hidden') === 'true') return false;
        return true;
    };

    const focusable = (): HTMLElement[] => {
        if (! el.value) return [];
        return Array.from(el.value.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(isVisible);
    };

    const activate = () => {
        previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        nextTick(() => {
            const items = focusable();
            items[0]?.focus();
        });
    };

    const deactivate = () => {
        // Se o elemento de origem foi removido do DOM enquanto o trap estava
        // ativo, `focus()` seria um no-op silencioso. Nesse caso, optamos por
        // nao devolver o foco a lugar nenhum, em vez de tentar um fallback.
        if (previous?.isConnected) previous.focus();

        previous = null;
    };

    const onKeydown = (event: KeyboardEvent) => {

        if (event.key !== 'Tab') return;

        const items = focusable();
        if (! items.length) return;

        const first = items[0];
        const last = items[items.length - 1];
        const target = event.target as HTMLElement | null;

        if (! target || ! items.includes(target)) {
            event.preventDefault();
            (event.shiftKey ? last : first).focus();
            return;
        }

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
