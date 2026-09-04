import { getColorFromVar } from '@maxvue/max-use';

export interface StatItemColors {
    /** Fundo do card ou da pílula */
    background: string;
    /** Fundo do ícone (retângulo com bordas arredondadas ou círculo) */
    iconBackground: string;
    /** Cor para títulos, labels e sublabels */
    textColor: string;
    /** Cor de destaque para o valor numérico e para o ícone */
    accentColor: string;
}

/**
 * Converte HSL (h: 0..360, s: 0..1, l: 0..1) para RGB (0..255).
 */
export function hslToRgb(h: number, s: number, l: number): [number, number, number] {
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;
    let r = 0;
    let g = 0;
    let b = 0;

    if (h >= 0 && h < 60) [r, g, b] = [c, x, 0];
    else if (h >= 60 && h < 120) [r, g, b] = [x, c, 0];
    else if (h >= 120 && h < 180) [r, g, b] = [0, c, x];
    else if (h >= 180 && h < 240) [r, g, b] = [0, x, c];
    else if (h >= 240 && h < 300) [r, g, b] = [x, 0, c];
    else [r, g, b] = [c, 0, x];

    return [
        Math.min(255, Math.max(0, Math.round((r + m) * 255))),
        Math.min(255, Math.max(0, Math.round((g + m) * 255))),
        Math.min(255, Math.max(0, Math.round((b + m) * 255)))
    ];
}

/**
 * Converte RGB (0..255) para HSL (h: 0..360, s: 0..1, l: 0..1).
 */
export function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
    const nr = r / 255;
    const ng = g / 255;
    const nb = b / 255;

    const max = Math.max(nr, ng, nb);
    const min = Math.min(nr, ng, nb);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case nr:
                h = ((ng - nb) / d + (ng < nb ? 6 : 0)) * 60;
                break;
            case ng:
                h = ((nb - nr) / d + 2) * 60;
                break;
            case nb:
                h = ((nr - ng) / d + 4) * 60;
                break;
        }
    }

    return [h, s, l];
}

/**
 * Calcula a Luminância Relativa (WCAG 2.1) a partir de canais RGB (0..255).
 * Fórmula: L = 0.2126 * Rlin + 0.7152 * Glin + 0.0722 * Blin
 */
export function getWcagRelativeLuminance(r: number, g: number, b: number): number {
    const linearize = (c: number): number => {
        const v = c / 255;
        return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    };

    return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

/**
 * Converte canais RGB para string hexadecimal `#rrggbb`.
 */
export function rgbToHex(r: number, g: number, b: number): string {
    const toHex = (n: number) => n.toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Extrai canais [r, g, b] a partir de uma cor em formato string (hex, rgb, hsl, nome ou variável CSS).
 */
export function parseColorToRgb(colorStr: string): [number, number, number] {
    if (!colorStr || typeof colorStr !== 'string') return [59, 130, 246]; // Fallback para azul #3b82f6

    try {
        const instance = getColorFromVar(colorStr.trim());
        const rgbArray = instance.rgb().array();
        if (Array.isArray(rgbArray) && rgbArray.length >= 3) return [
            Math.round(rgbArray[0]),
            Math.round(rgbArray[1]),
            Math.round(rgbArray[2])
        ];
    } catch {
        // Fallback seguro se não conseguir parsear
    }

    return [59, 130, 246];
}

/**
 * Ajusta a luminância de uma cor para atingir o valor de Luminância Relativa WCAG alvo.
 * Mantém o matiz (Hue) e saturação (Saturation), variando a luminosidade (Lightness) via bissecção.
 *
 * @param colorStr - Cor base (ex: `#3b82f6`, `var(--primary)`, `blue`)
 * @param targetLuminance - Luminância Relativa WCAG desejada (0.0 a 1.0)
 * @returns Cor ajustada em formato hexadecimal `#rrggbb`
 */
export function adjustToWcagLuminance(colorStr: string, targetLuminance: number): string {
    const clampedTarget = Math.max(0, Math.min(1, targetLuminance));
    const [r, g, b] = parseColorToRgb(colorStr);
    const [h, s] = rgbToHsl(r, g, b);

    // Ajuste por busca binária sobre Lightness no espaço HSL
    let low = 0;
    let high = 1;
    let bestRgb: [number, number, number] = [r, g, b];

    for (let i = 0; i < 20; i++) {
        const mid = (low + high) / 2;
        const rgbCandidate = hslToRgb(h, s, mid);
        const lum = getWcagRelativeLuminance(...rgbCandidate);
        bestRgb = rgbCandidate;

        if (lum < clampedTarget) low = mid;
        else high = mid;
    }

    return rgbToHex(...bestRgb);
}

// Cache de memoização para evitar recalcular cores idênticas em renderizações consecutivas
const colorCache = new Map<string, StatItemColors>();

/**
 * Resolve as cores do item estatístico de acordo com as especificações WCAG.
 *
 * Paleta Unificada (sem distinção entre Dark e Light Mode):
 * - Fundo do item (Background): Luminância Relativa WCAG em 90% (0.90) -> Mais Claro
 * - Fundo do ícone: Luminância Relativa WCAG em 77% (0.77) -> Suave
 * - Label e Sublabel (Título e Subtítulo): Luminância Relativa WCAG em 18% (0.18) -> Levemente mais claro que Ícones e Valor
 * - Value e Ícone (Ícone e Valor): Luminância Relativa WCAG em 10% (0.10) -> Mais Escuro / Alto Contraste
 *
 * @param baseColor - Cor base do indicador
 * @param _isDark - Mantido por retrocompatibilidade de API, sem distinção de tema
 */
export function resolveStatItemColors(baseColor: string, _isDark?: boolean): StatItemColors {
    const key = baseColor || '#3b82f6';
    const cached = colorCache.get(key);
    if (cached) return cached;

    const result: StatItemColors = {
        background: adjustToWcagLuminance(baseColor, 0.90),
        iconBackground: adjustToWcagLuminance(baseColor, 0.77),
        textColor: adjustToWcagLuminance(baseColor, 0.18),
        accentColor: adjustToWcagLuminance(baseColor, 0.10)
    };

    colorCache.set(key, result);
    return result;
}

export interface BadgeColors {
    /** Fundo do badge */
    background: string;
    /** Cor do texto e do ícone */
    text: string;
    /** Fundo do overlay de contagem/notificação */
    overlayBg: string;
    /** Cor do texto dentro do overlay */
    overlayText: string;
    /** Borda opcional (estilo neon) */
    border?: string;
    /** Sombra com brilho opcional (estilo neon) */
    boxShadow?: string;
}

export const BADGE_STATUS_COLORS: Record<string, string> = {
    done: 'var(--emerald-650)',
    success: 'var(--emerald-650)',
    error: 'var(--red-b-650)',
    danger: 'var(--red-b-650)',
    info: 'var(--blue-650)',
    help: 'var(--violet-650)',
    warn: 'var(--orange-b-650)',
    caution: 'var(--yellow-650)'
};

const badgeColorCache = new Map<string, BadgeColors>();

/**
 * Resolve as cores do MaxBadge de acordo com as especificações WCAG, tema e estilo neon.
 *
 * - Cor escura (Luminância Relativa WCAG < 0.5):
 *   - Modo Claro: Background 83%, Texto/Ícone 18%, Background Overlay 50%, Texto Overlay 83%
 *   - Modo Escuro: Invertido (Background 18%, Texto/Ícone 83%, Background Overlay 50%, Texto Overlay 18%)
 * - Cor clara (Luminância Relativa WCAG >= 0.5):
 *   - Modo Claro: Background 18%, Texto/Ícone 83%, Background Overlay 50%, Texto Overlay 18%
 *   - Modo Escuro: Invertido (Background 83%, Texto/Ícone 18%, Background Overlay 50%, Texto Overlay 83%)
 * - Estilo Neon:
 *   - Fundo semitransparente (~12% opacidade)
 *   - Texto vibrante com a cor calculada
 *   - Borda de 1px com a mesma cor do texto e ícone
 *   - Glow suave (box-shadow)
 */
export function resolveBadgeColors(
    baseColor: string = 'var(--blue-600)',
    isDark: boolean = false,
    isNeon: boolean = false
): BadgeColors {
    const key = `${baseColor || 'var(--blue-600)'}_${isDark ? 'dark' : 'light'}_${isNeon ? 'neon' : 'normal'}`;
    const cached = badgeColorCache.get(key);
    if (cached) return cached;

    const [r, g, b] = parseColorToRgb(baseColor);
    const lum = getWcagRelativeLuminance(r, g, b);
    const isBaseDark = lum < 0.5;

    // Se a base é escura, no modo claro o fundo é claro (83%) e o texto é escuro (18%).
    // No modo escuro, inverte: o fundo é escuro (18%) e o texto é claro (83%).
    // Se a base é clara, no modo claro o fundo é escuro (18%) e o texto é claro (83%).
    // No modo escuro, inverte: o fundo é claro (83%) e o texto é escuro (18%).
    const hasLightBackground = isDark ? !isBaseDark : isBaseDark;

    const bgLum = hasLightBackground ? 0.83 : 0.18;
    const textLum = hasLightBackground ? 0.18 : 0.83;
    const overlayBgLum = 0.50;
    const overlayTextLum = hasLightBackground ? 0.83 : 0.18;

    const background = adjustToWcagLuminance(baseColor, bgLum);
    const text = adjustToWcagLuminance(baseColor, textLum);
    const overlayBg = adjustToWcagLuminance(baseColor, overlayBgLum);
    const overlayText = adjustToWcagLuminance(baseColor, overlayTextLum);

    let result: BadgeColors;

    if (isNeon) {
        const [tr, tg, tb] = parseColorToRgb(text);
        result = {
            background: `rgba(${tr}, ${tg}, ${tb}, 0.12)`,
            text,
            overlayBg,
            overlayText,
            border: `1px solid ${text}`,
            boxShadow: `0 0 8px rgba(${tr}, ${tg}, ${tb}, 0.35)`
        };
    } else result = {
        background,
        text,
        overlayBg,
        overlayText
    };


    badgeColorCache.set(key, result);
    return result;
}

