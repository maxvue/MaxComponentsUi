import { getColorFromVar as GetColor } from '@maxvue/max-use';
import {
    COLOR_SCALE_LEVELS,
    DEFAULT_BASE_COLORS,
    PRIMARY_COLOR_NAMES,
    type BaseColorName,
    type BaseColorPalette,
    type ColorScaleLevel,
    type ColorScales,
    type PartialColorPalette
} from '../types/colors';

/**
 * Deriva a escala de 37 níveis (0 a 900) para uma cor individual a partir de sua cor base.
 *
 * - Nível 0: branco (#FFFFFF)
 * - Nível 500: a própria cor base
 * - Níveis 25 a 475: clareamento progressivo interpolando com branco
 * - Níveis 525 a 900: escurecimento progressivo interpolando com preto
 */
export function deriveColorScale(baseColor: string): Record<ColorScaleLevel, string> {
    const colorInstance = GetColor(baseColor);
    const white = GetColor('#FFFFFF');
    const black = GetColor('#000000');

    const scale: Record<number, string> = {};

    for (const level of COLOR_SCALE_LEVELS) if (level === 0) scale[level] = '#FFFFFF';
    else if (level === 500) scale[level] = colorInstance.hex();
    else if (level < 500) {
        const weight = (500 - level) / 500;
        scale[level] = colorInstance.mix(white, weight).hex();
    } else {
        const weight = (level - 500) / 450;
        const clampedWeight = Math.min(Math.max(weight, 0), 1);
        scale[level] = colorInstance.mix(black, clampedWeight).hex();
    }


    return scale as Record<ColorScaleLevel, string>;
}

/**
 * Deriva a variante secundária -b a partir de uma cor base informada.
 * Aplica aumento harmônico de saturação e luminosidade (+20% saturação, +10% luminosidade).
 */
export function deriveSecondaryBColor(baseHex: string): string {
    const colorInstance = GetColor(baseHex);
    return colorInstance.saturate(0.2).lighten(0.1).hex();
}

/**
 * Deriva a variante gray-light a partir da cor gray informada.
 * Realiza uma mescla suave com branco (45% branco) para gerar o tom clareado.
 */
export function deriveGrayLightColor(grayHex: string): string {
    const colorInstance = GetColor(grayHex);
    const white = GetColor('#FFFFFF');
    return colorInstance.mix(white, 0.45).hex();
}

/**
 * Normaliza uma paleta parcial mesclando com as cores padrão canônicas.
 * Se apenas as cores principais forem informadas, calcula automaticamente
 * as cores secundárias correspondentes ('gray-light' e '*-b') caso não tenham sido passadas.
 */
export function normalizePalette(customColors?: PartialColorPalette): BaseColorPalette {
    const normalized: Record<string, string> = { ...DEFAULT_BASE_COLORS };

    if (!customColors || typeof customColors !== 'object') return normalized as BaseColorPalette;

    for (const [key, value] of Object.entries(customColors)) if (key in DEFAULT_BASE_COLORS && typeof value === 'string' && value.trim()) normalized[key] = value.trim();


    const hasExplicitGray = typeof customColors.gray === 'string' && Boolean(customColors.gray.trim());
    const hasExplicitGrayLight = typeof customColors['gray-light'] === 'string' && Boolean(customColors['gray-light']?.trim());

    if (hasExplicitGray && !hasExplicitGrayLight) if (customColors.gray === DEFAULT_BASE_COLORS.gray) normalized['gray-light'] = DEFAULT_BASE_COLORS['gray-light'];
    else normalized['gray-light'] = deriveGrayLightColor(normalized.gray);


    for (const primary of PRIMARY_COLOR_NAMES) {
        const bKey = `${primary}-b` as BaseColorName;
        const hasExplicitPrimary = typeof customColors[primary] === 'string' && Boolean(customColors[primary]?.trim());
        const hasExplicitB = typeof customColors[bKey] === 'string' && Boolean(customColors[bKey]?.trim());

        if (hasExplicitPrimary && !hasExplicitB) if (customColors[primary] === DEFAULT_BASE_COLORS[primary]) normalized[bKey] = DEFAULT_BASE_COLORS[bKey];
        else normalized[bKey] = deriveSecondaryBColor(normalized[primary]);


    }

    return normalized as BaseColorPalette;
}

/**
 * Gera uma assinatura estável da paleta para indexação de cache versionado.
 */
export function generatePaletteSignature(palette: BaseColorPalette): string {
    const keys = Object.keys(palette).sort() as BaseColorName[];
    return keys.map((k) => `${k}:${palette[k]}`).join('|');
}

/**
 * Gera as escalas de todas as cores da paleta usando o GetColor de MaxUse.
 */
export function generateColorScales(palette: BaseColorPalette): ColorScales {
    const scales: Record<string, Record<ColorScaleLevel, string>> = {};

    for (const [name, colorHex] of Object.entries(palette)) scales[name] = deriveColorScale(colorHex);

    return scales as ColorScales;
}

/**
 * Gera as declarações de variáveis CSS para `:root` (tema claro) e `:root.dark, .dark` (tema escuro).
 * Preserva o mapeamento inverso de 0 a 850 para o tema escuro.
 */
export function generateCssVariables(palette: BaseColorPalette, scales: ColorScales): string {
    const rootDeclarations: string[] = [];
    const darkDeclarations: string[] = [];

    const names = Object.keys(palette) as BaseColorName[];

    for (const name of names) {
        rootDeclarations.push(`    --${name}: ${palette[name]};`);
        darkDeclarations.push(`    --${name}: ${palette[name]};`);

        for (const level of COLOR_SCALE_LEVELS) rootDeclarations.push(`    --${name}-${level}: ${scales[name][level]};`);

        for (const level of COLOR_SCALE_LEVELS) if (level <= 850) {
            const invertedLevel = (850 - level) as ColorScaleLevel;
            darkDeclarations.push(`    --${name}-${level}: ${scales[name][invertedLevel]};`);
        }

    }

    return `:root {\n${rootDeclarations.join('\n')}\n}\n\n:root.dark,\n.dark {\n${darkDeclarations.join('\n')}\n}`;
}

/**
 * Aplica as variáveis CSS dinâmicas no DOM injetando ou atualizando a tag `<style id="max-dynamic-colors">`.
 * É SSR-safe (não quebra sem window/document).
 */
export function applyPaletteToDom(css: string): void {
    if (typeof document === 'undefined') return;

    let styleEl = document.getElementById('max-dynamic-colors') as HTMLStyleElement | null;
    if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'max-dynamic-colors';
        const target = document.head || document.documentElement;
        target.appendChild(styleEl);
    }

    if (styleEl.textContent !== css) styleEl.textContent = css;
}

/**
 * Inicialização padrão da paleta para consumo de componentes fora do MaxApp.
 */
export function initDefaultColorPalette(): void {
    if (typeof document === 'undefined') return;
    if (document.getElementById('max-dynamic-colors')) return;

    const scales = generateColorScales(DEFAULT_BASE_COLORS);
    const css = generateCssVariables(DEFAULT_BASE_COLORS, scales);
    applyPaletteToDom(css);
}
