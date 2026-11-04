import { defineStore } from 'pinia';
import { ref } from 'vue';
import {
    DEFAULT_BASE_COLORS,
    type BaseColorPalette,
    type ColorPaletteCacheEntry,
    type ColorScales,
    type PartialColorPalette
} from '../types/colors';
import {
    applyPaletteToDom,
    generateColorScales,
    generateCssVariables,
    generatePaletteSignature,
    normalizePalette
} from '../helpers/colorPalette';
import { COLORS_CACHE_PREFIX } from '../helpers/maxCacheKeys';

export const ALGORITHM_VERSION = 'v1';

function loadFromCache(signature: string): string | null {
    if (typeof localStorage === 'undefined') return null;
    try {
        const raw = localStorage.getItem(`${COLORS_CACHE_PREFIX}${signature}`);
        if (!raw) return null;
        const entry: ColorPaletteCacheEntry = JSON.parse(raw);
        if (entry.version === ALGORITHM_VERSION && entry.signature === signature && entry.css) return entry.css;

        return null;
    } catch {
        return null;
    }
}

function saveToCache(signature: string, css: string): void {
    if (typeof localStorage === 'undefined') return;
    try {
        const entry: ColorPaletteCacheEntry = {
            version: ALGORITHM_VERSION,
            signature,
            css
        };
        localStorage.setItem(`${COLORS_CACHE_PREFIX}${signature}`, JSON.stringify(entry));
    } catch {
        // Tolerante a quota/security error
    }
}

export const useColorsStore = defineStore('colors', () => {
    const colors = ref<BaseColorPalette>({ ...DEFAULT_BASE_COLORS });
    const isReady = ref<boolean>(false);
    const css = ref<string>('');
    const scales = ref<ColorScales | null>(null);

    function setColors(customColors?: PartialColorPalette): void {
        const normalized = normalizePalette(customColors);
        colors.value = normalized;

        const signature = generatePaletteSignature(normalized);
        const cachedCss = loadFromCache(signature);

        if (cachedCss) {
            css.value = cachedCss;
            applyPaletteToDom(cachedCss);
            isReady.value = true;
            return;
        }

        const newScales = generateColorScales(normalized);
        scales.value = newScales;
        const generatedCss = generateCssVariables(normalized, newScales);
        css.value = generatedCss;

        saveToCache(signature, generatedCss);
        applyPaletteToDom(generatedCss);
        isReady.value = true;
    }

    function resetColors(): void {
        setColors(DEFAULT_BASE_COLORS);
    }

    // Inicialização padrão imediata para aplicar estilos no DOM
    setColors(DEFAULT_BASE_COLORS);

    return {
        colors,
        isReady,
        css,
        scales,
        setColors,
        resetColors
    };
});
