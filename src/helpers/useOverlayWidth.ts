/** Margem mínima entre o overlay e a borda da viewport. */
export const VIEWPORT_GUTTER = 10;

/** Teto padrão de largura de overlay de campo (dropdown de select/autocomplete). */
export const MAX_OVERLAY_WIDTH = 420;

interface OverlayWidthArgs {
    /** Largura do elemento-gatilho (o campo). */
    triggerWidth: number;
    /** Largura da viewport. */
    windowWidth: number;
    /** Piso: o overlay nunca fica menor que isto. */
    minWidth?: number;
    /** Teto: o overlay nunca fica maior que isto. */
    maxWidth?: number;
}

/**
 * Largura do overlay de um campo.
 *
 * O overlay acompanha a largura do campo — comportamento herdado do PrimeVue —
 * mas o campo costuma ser `width: 100%` dentro do `InputBase`, então em
 * formulários largos isso gerava dropdowns atravessando a tela. Aqui a largura
 * fica limitada pelo teto e pelo espaço realmente disponível na viewport.
 */
export function getOverlayWidth({ triggerWidth, windowWidth, minWidth = 160, maxWidth = MAX_OVERLAY_WIDTH }: OverlayWidthArgs): number {
    const available = Math.max(minWidth, windowWidth - VIEWPORT_GUTTER * 2);
    return Math.min(Math.max(triggerWidth, minWidth), maxWidth, available);
}

/**
 * Posição horizontal do overlay, impedindo que ele vaze pela direita.
 *
 * Recebe a largura já calculada em vez de medir o overlay: `useElementSize`
 * devolve 0 no frame em que o overlay é montado, e o clamp baseado nessa medida
 * não corrigia nada — daí o vazamento ser intermitente.
 */
export function getOverlayLeft(triggerX: number, width: number, windowWidth: number): number {
    if (triggerX + width <= windowWidth) return triggerX;
    return Math.max(VIEWPORT_GUTTER, windowWidth - width - VIEWPORT_GUTTER);
}
