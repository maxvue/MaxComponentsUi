import { computed, toValue, getCurrentInstance, type ComputedRef, type MaybeRefOrGetter } from 'vue';
import { useModalContext, resolveModalZIndex } from '../helpers/modalContext';

export type OverlayLayer = 'dropdown' | 'popover' | 'modal' | 'fullscreen' | 'tooltip';

export interface UseOverlayZIndexOptions {
    /** Elemento âncora/gatilho para detecção do container ancestral no DOM */
    target?: MaybeRefOrGetter<HTMLElement | null | undefined>;
    /** Tipo da camada (padrão: 'dropdown') */
    layer?: OverlayLayer;
    /** Offset adicional de z-index (-100 a 100) */
    layerOffset?: number;
}

const DEFAULT_LAYER_TOKENS: Record<OverlayLayer, string> = {
    dropdown: 'var(--max-z-index-dropdown, var(--max-layer-dropdown, 1000))',
    popover: 'var(--max-z-index-popover, var(--max-layer-popover, 1200))',
    modal: 'var(--max-z-index-modal, var(--max-layer-modal, 1310))',
    fullscreen: 'var(--max-z-index-fullscreen, var(--max-layer-fullscreen, 1400))',
    tooltip: 'var(--max-z-index-tooltip, var(--max-layer-tooltip, 1600))'
};

function getDomModalZIndex(targetEl: HTMLElement | null | undefined): string | number | null {
    if (!targetEl || typeof window === 'undefined') return null;

    const modalEl = targetEl.closest?.('.max-modal, .max-drawer, [role="dialog"], .background-modal') as HTMLElement | null;
    if (!modalEl) return null;

    if (modalEl.style?.zIndex) return modalEl.style.zIndex;

    const computedZ = window.getComputedStyle(modalEl).zIndex;
    if (computedZ && computedZ !== 'auto') {
        const num = Number(computedZ);
        if (!Number.isNaN(num) && num > 0) return num;
    }

    return 'var(--max-layer-modal, 1310)';
}

export function useOverlayZIndex(options: UseOverlayZIndexOptions = {}): ComputedRef<string | number> {
    const modalContext = getCurrentInstance() ? useModalContext() : null;

    return computed(() => {
        const rawOffset = options.layerOffset ?? 0;
        const offset = Math.max(-100, Math.min(100, rawOffset));
        const layer = options.layer ?? 'dropdown';

        // Tooltip e fullscreen preservam suas camadas elevadas nativas
        if (layer === 'tooltip') {
            const token = DEFAULT_LAYER_TOKENS.tooltip;
            return offset !== 0 ? `calc(${token} + ${offset})` : token;
        }

        if (layer === 'fullscreen') {
            const token = DEFAULT_LAYER_TOKENS.fullscreen;
            return offset !== 0 ? `calc(${token} + ${offset})` : token;
        }

        // 1. Tenta obter o z-index via injeção reativa do contexto do modal
        const contextZIndex = resolveModalZIndex(modalContext);

        // 2. Fallback resiliente: inspeciona o DOM a partir do target
        let resolvedParentZIndex = contextZIndex;
        if (!resolvedParentZIndex) {
            const rawTarget = toValue(options.target);
            const targetEl = (rawTarget as any)?.$el ?? rawTarget;
            resolvedParentZIndex = getDomModalZIndex(targetEl);
        }

        // Se estiver dentro de um modal/drawer, o overlay deve se posicionar acima do diálogo
        if (resolvedParentZIndex) {
            const elevation = 10 + offset;
            if (typeof resolvedParentZIndex === 'number') return resolvedParentZIndex + elevation;

            const trimmed = String(resolvedParentZIndex).trim();
            const numeric = Number(trimmed);
            if (!Number.isNaN(numeric)) return numeric + elevation;

            return elevation !== 0 ? `calc(${trimmed} + ${elevation})` : trimmed;
        }

        // 3. Fora de modal: utiliza o token padrão da camada
        const defaultToken = DEFAULT_LAYER_TOKENS[layer] ?? DEFAULT_LAYER_TOKENS.dropdown;
        if (offset !== 0) return `calc(${defaultToken} + ${offset})`;

        return defaultToken;
    });
}
