import { ref, type Ref } from 'vue';

export const DEFAULT_FONT_SIZE = 16;
export const MIN_FONT_SIZE = 10;
export const MAX_FONT_SIZE = 24;
export const FONT_SIZE_STORAGE_KEY = 'max_font_size';

let sharedFontSizeRef: Ref<number> | null = null;

/**
 * Garante que o tamanho da fonte fique dentro do intervalo permitido [MIN_FONT_SIZE, MAX_FONT_SIZE].
 */
export function clampFontSize(size: number): number {
    if (Number.isNaN(size)) return DEFAULT_FONT_SIZE;
    return Math.min(MAX_FONT_SIZE, Math.max(MIN_FONT_SIZE, Math.round(size)));
}

/**
 * Lê o tamanho da fonte previamente salvo no localStorage, ou retorna o padrão se inválido.
 */
export function getStoredFontSize(): number {
    if (typeof localStorage === 'undefined') return DEFAULT_FONT_SIZE;
    const stored = localStorage.getItem(FONT_SIZE_STORAGE_KEY);
    if (stored !== null) {
        const parsed = parseInt(stored, 10);
        if (!Number.isNaN(parsed)) return clampFontSize(parsed);
    }
    return DEFAULT_FONT_SIZE;
}

/**
 * Aplica o tamanho da fonte no elemento <html> (document.documentElement),
 * atualiza a variável CSS --max-font-size-base, grava no localStorage e
 * sincroniza a Ref reativa global se instanciada.
 */
export function applyHtmlFontSize(size: number): number {
    const clamped = clampFontSize(size);

    if (typeof document !== 'undefined') {
        document.documentElement.style.fontSize = `${clamped}px`;
        document.documentElement.style.setProperty('--max-font-size-base', `${clamped}px`);
    }

    if (typeof localStorage !== 'undefined') try {
        localStorage.setItem(FONT_SIZE_STORAGE_KEY, String(clamped));
    } catch {
        // Ignora erro em ambientes restritos (como cookies desativados)
    }

    if (sharedFontSizeRef) sharedFontSizeRef.value = clamped;

    return clamped;
}

/**
 * Composable reativo que compartilha o estado do tamanho da fonte da aplicação.
 */
export function useHtmlFontSize(): {
    fontSize: Ref<number>;
    setFontSize: (size: number) => number;
    incrementFontSize: (step?: number) => number;
    decrementFontSize: (step?: number) => number;
    resetFontSize: () => number;
} {
    if (!sharedFontSizeRef) sharedFontSizeRef = ref(getStoredFontSize());

    const setFontSize = (size: number): number => {
        return applyHtmlFontSize(size);
    };

    const incrementFontSize = (step = 1): number => {
        const current = sharedFontSizeRef ? sharedFontSizeRef.value : DEFAULT_FONT_SIZE;
        return applyHtmlFontSize(current + step);
    };

    const decrementFontSize = (step = 1): number => {
        const current = sharedFontSizeRef ? sharedFontSizeRef.value : DEFAULT_FONT_SIZE;
        return applyHtmlFontSize(current - step);
    };

    const resetFontSize = (): number => {
        return applyHtmlFontSize(DEFAULT_FONT_SIZE);
    };

    return {
        fontSize: sharedFontSizeRef,
        setFontSize,
        incrementFontSize,
        decrementFontSize,
        resetFontSize
    };
}

/**
 * Utilitário para testes unitários resetarem a ref singleton e os estilos.
 */
export function _resetHtmlFontSizeForTesting(): void {
    sharedFontSizeRef = null;
}
