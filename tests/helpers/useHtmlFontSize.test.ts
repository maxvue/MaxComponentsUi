import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
    useHtmlFontSize,
    applyHtmlFontSize,
    DEFAULT_FONT_SIZE,
    MIN_FONT_SIZE,
    MAX_FONT_SIZE,
    FONT_SIZE_STORAGE_KEY,
    _resetHtmlFontSizeForTesting
} from '../../src/helpers/useHtmlFontSize';

describe('useHtmlFontSize', () => {
    beforeEach(() => {
        _resetHtmlFontSizeForTesting();
        if (typeof localStorage !== 'undefined') localStorage.clear();
        if (typeof document !== 'undefined') {
            document.documentElement.style.fontSize = '';
            document.documentElement.style.removeProperty('--max-font-size-base');
        }
    });

    afterEach(() => {
        _resetHtmlFontSizeForTesting();
        if (typeof localStorage !== 'undefined') localStorage.clear();
        if (typeof document !== 'undefined') {
            document.documentElement.style.fontSize = '';
            document.documentElement.style.removeProperty('--max-font-size-base');
        }
    });

    it('inicia com o tamanho padrão 16px quando não há valor salvo', () => {
        const { fontSize } = useHtmlFontSize();
        expect(fontSize.value).toBe(DEFAULT_FONT_SIZE);
        expect(DEFAULT_FONT_SIZE).toBe(16);
    });

    it('carrega valor salvo do localStorage se válido e sincroniza DOM', () => {
        localStorage.setItem(FONT_SIZE_STORAGE_KEY, '18');
        const { fontSize } = useHtmlFontSize();
        expect(fontSize.value).toBe(18);
        expect(document.documentElement.style.fontSize).toBe('18px');
        expect(document.documentElement.style.getPropertyValue('--max-font-size-base')).toBe('18px');
    });

    it('aplica fontSize e CSS variable no documentElement', () => {
        const { setFontSize } = useHtmlFontSize();
        setFontSize(19);

        expect(document.documentElement.style.fontSize).toBe('19px');
        expect(document.documentElement.style.getPropertyValue('--max-font-size-base')).toBe('19px');
        expect(localStorage.getItem(FONT_SIZE_STORAGE_KEY)).toBe('19');
    });

    it('limita valores abaixo do mínimo (MIN_FONT_SIZE = 10)', () => {
        const { setFontSize, fontSize } = useHtmlFontSize();
        setFontSize(5);

        expect(fontSize.value).toBe(MIN_FONT_SIZE);
        expect(document.documentElement.style.fontSize).toBe(`${MIN_FONT_SIZE}px`);
    });

    it('limita valores acima do máximo (MAX_FONT_SIZE = 24)', () => {
        const { setFontSize, fontSize } = useHtmlFontSize();
        setFontSize(30);

        expect(fontSize.value).toBe(MAX_FONT_SIZE);
        expect(document.documentElement.style.fontSize).toBe(`${MAX_FONT_SIZE}px`);
    });

    it('incrementa e decrementa corretamente', () => {
        const { fontSize, incrementFontSize, decrementFontSize } = useHtmlFontSize();
        expect(fontSize.value).toBe(16);

        incrementFontSize();
        expect(fontSize.value).toBe(17);
        expect(document.documentElement.style.fontSize).toBe('17px');

        decrementFontSize();
        expect(fontSize.value).toBe(16);

        decrementFontSize();
        expect(fontSize.value).toBe(15);
    });

    it('reseta para o valor padrão 16px', () => {
        const { fontSize, setFontSize, resetFontSize } = useHtmlFontSize();
        setFontSize(20);
        expect(fontSize.value).toBe(20);

        resetFontSize();
        expect(fontSize.value).toBe(16);
        expect(document.documentElement.style.fontSize).toBe('16px');
    });

    it('applyHtmlFontSize funciona de forma direta', () => {
        const applied = applyHtmlFontSize(22);
        expect(applied).toBe(22);
        expect(document.documentElement.style.fontSize).toBe('22px');
        expect(localStorage.getItem(FONT_SIZE_STORAGE_KEY)).toBe('22');
    });
});
