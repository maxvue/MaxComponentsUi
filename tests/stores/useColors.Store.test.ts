import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useColorsStore, ALGORITHM_VERSION } from '../../src/stores/useColors.Store';
import { DEFAULT_BASE_COLORS } from '../../src/types/colors';
import { clearMaxCache } from '../../src/helpers/maxCacheKeys';
import * as colorPaletteHelpers from '../../src/helpers/colorPalette';

describe('useColorsStore', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        localStorage.clear();
        const styleEl = document.getElementById('max-dynamic-colors');
        if (styleEl) styleEl.remove();
    });

    afterEach(() => {
        localStorage.clear();
        const styleEl = document.getElementById('max-dynamic-colors');
        if (styleEl) styleEl.remove();
        vi.restoreAllMocks();
    });

    it('inicializa com a paleta padrão e aplica as variáveis no DOM', () => {
        const store = useColorsStore();

        expect(store.isReady).toBe(true);
        expect(store.colors.pink).toBe(DEFAULT_BASE_COLORS.pink);
        expect(store.colors.blue).toBe(DEFAULT_BASE_COLORS.blue);
        expect(store.css).toContain('--pink: #ED58A2;');

        const styleEl = document.getElementById('max-dynamic-colors');
        expect(styleEl).toBeTruthy();
        expect(styleEl?.textContent).toContain('--pink: #ED58A2;');
    });

    it('persiste no localStorage com a versão do algoritmo e assinatura', () => {
        const store = useColorsStore();
        store.setColors({ pink: '#AABBCC' });

        const sig = colorPaletteHelpers.generatePaletteSignature(
            colorPaletteHelpers.normalizePalette({ pink: '#AABBCC' })
        );

        const raw = localStorage.getItem(`max_colors_${sig}`);
        expect(raw).toBeTruthy();

        const entry = JSON.parse(raw!);
        expect(entry.version).toBe(ALGORITHM_VERSION);
        expect(entry.signature).toBe(sig);
        expect(entry.css).toContain('--pink: #AABBCC;');
    });

    it('reutiliza o cache do localStorage sem recalcular quando a assinatura coincide', () => {
        const store = useColorsStore();

        const sig = colorPaletteHelpers.generatePaletteSignature(DEFAULT_BASE_COLORS);
        const cachedCss = ':root { --cached-test: 1; }';
        localStorage.setItem(`max_colors_${sig}`, JSON.stringify({
            version: ALGORITHM_VERSION,
            signature: sig,
            css: cachedCss
        }));

        const calcSpy = vi.spyOn(colorPaletteHelpers, 'generateColorScales');

        store.setColors(DEFAULT_BASE_COLORS);

        expect(calcSpy).not.toHaveBeenCalled();
        expect(store.css).toBe(cachedCss);
        expect(document.getElementById('max-dynamic-colors')?.textContent).toBe(cachedCss);
    });

    it('recalcula quando o cache estiver corrompido ou versão desatualizada', () => {
        const store = useColorsStore();
        const sig = colorPaletteHelpers.generatePaletteSignature(DEFAULT_BASE_COLORS);

        // Cache com versão antiga
        localStorage.setItem(`max_colors_${sig}`, JSON.stringify({
            version: 'v0_antigo',
            signature: sig,
            css: ':root { --antigo: 1; }'
        }));

        const calcSpy = vi.spyOn(colorPaletteHelpers, 'generateColorScales');
        store.setColors(DEFAULT_BASE_COLORS);

        expect(calcSpy).toHaveBeenCalled();
        expect(store.css).toContain('--pink: #ED58A2;');
    });

    it('recalcula quando o JSON do cache for inválido', () => {
        const store = useColorsStore();
        const sig = colorPaletteHelpers.generatePaletteSignature(DEFAULT_BASE_COLORS);

        localStorage.setItem(`max_colors_${sig}`, '{ json_invalido_corrompido:');

        const calcSpy = vi.spyOn(colorPaletteHelpers, 'generateColorScales');
        store.setColors(DEFAULT_BASE_COLORS);

        expect(calcSpy).toHaveBeenCalled();
        expect(store.css).toContain('--pink: #ED58A2;');
    });

    it('resetColors restaura a paleta padrão', () => {
        const store = useColorsStore();
        store.setColors({ pink: '#999999' });
        expect(store.colors.pink).toBe('#999999');

        store.resetColors();
        expect(store.colors.pink).toBe(DEFAULT_BASE_COLORS.pink);
    });

    it('clearMaxCache remove as chaves da paleta de cores do localStorage', () => {
        const store = useColorsStore();
        store.setColors({ pink: '#112233' });

        const sig = colorPaletteHelpers.generatePaletteSignature(colorPaletteHelpers.normalizePalette({ pink: '#112233' }));
        expect(localStorage.getItem(`max_colors_${sig}`)).toBeTruthy();

        const removed = clearMaxCache();
        expect(removed.some((k) => k.startsWith('max_colors_'))).toBe(true);
        expect(localStorage.getItem(`max_colors_${sig}`)).toBeNull();
    });

    it('tolera falhas no localStorage (ex: SecurityError ou cota esgotada)', () => {
        vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
            throw new Error('QuotaExceededError');
        });

        const store = useColorsStore();
        expect(() => {
            store.setColors({ blue: '#123456' });
        }).not.toThrow();

        expect(store.colors.blue).toBe('#123456');
    });
});
