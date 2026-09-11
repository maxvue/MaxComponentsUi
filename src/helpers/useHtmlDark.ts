import { ref, type Ref } from 'vue';

let isHtmlDarkRef: Ref<boolean> | null = null;
let sharedObserver: MutationObserver | null = null;

const checkDark = () => {
    if (typeof document !== 'undefined') return document.documentElement.classList.contains('dark');
    return false;
};

/**
 * Retorna uma Ref reativa compartilhada que detecta se o elemento <html>
 * possui a classe .dark, utilizando um único MutationObserver global.
 */
export function useHtmlDark(): Ref<boolean> {
    if (!isHtmlDarkRef) isHtmlDarkRef = ref(checkDark());

    if (typeof MutationObserver !== 'undefined' && typeof document !== 'undefined' && !sharedObserver) {
        sharedObserver = new MutationObserver(() => {
            if (isHtmlDarkRef) isHtmlDarkRef.value = checkDark();
        });

        sharedObserver.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class']
        });
    }

    return isHtmlDarkRef;
}

/**
 * Utilitário para testes unitários resetarem o estado do observer singleton.
 */
export function _resetHtmlDarkObserverForTesting(): void {
    if (sharedObserver) {
        sharedObserver.disconnect();
        sharedObserver = null;
    }
    isHtmlDarkRef = null;
}
