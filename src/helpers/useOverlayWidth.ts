/** Margem mínima entre o overlay e a borda da viewport. */
export const VIEWPORT_GUTTER = 10;

/** Teto padrão de largura de overlay de campo (dropdown de select/autocomplete): min(500px, calc(100vw - 50px)). */
export const MAX_OVERLAY_WIDTH = 500;

interface OverlayWidthArgs {
    /** Largura do elemento-gatilho (o campo). */
    triggerWidth: number;
    /** Largura da viewport. */
    windowWidth: number;
    /** Largura intrínseca do conteúdo, quando o painel deve crescer para acomodá-lo. */
    contentWidth?: number;
    /** Piso: o overlay nunca fica menor que isto. */
    minWidth?: number;
    /** Teto: o overlay nunca fica maior que isto. */
    maxWidth?: number;
}

/**
 * Largura do overlay de um campo.
 *
 * Acompanha a largura do conteúdo interno, respeitando piso mínimo da largura do
 * próprio campo disparador e teto em min(500px, calc(100vw - 50px)).
 */
export function getOverlayWidth({
    triggerWidth,
    windowWidth,
    contentWidth = 0,
    minWidth = 160,
    maxWidth = MAX_OVERLAY_WIDTH
}: OverlayWidthArgs): number {
    const available = Math.max(minWidth, windowWidth - 50);
    const maxAllowed = Math.min(maxWidth, available);
    const effectiveMin = Math.min(Math.max(triggerWidth, minWidth), maxAllowed);
    const preferred = Math.max(effectiveMin, contentWidth);
    return Math.min(preferred, maxAllowed);
}

/**
 * Posição horizontal do overlay, impedindo que ele vaze pela direita ou esquerda.
 */
export function getOverlayLeft(triggerX: number, width: number, windowWidth: number): number {
    if (triggerX + width <= windowWidth) return triggerX;
    return Math.max(VIEWPORT_GUTTER, windowWidth - width - VIEWPORT_GUTTER);
}
