import { describe, it, expect } from 'vitest';
import { getCssSize } from '../../src/helpers/getCssSize';

describe('getCssSize', () => {
    it('converte número para px', () => {
        expect(getCssSize(100)).toBe('100px');
        expect(getCssSize(0)).toBe('0px');
        expect(getCssSize(1.5)).toBe('1.5px');
    });

    it('converte string numérica para px', () => {
        expect(getCssSize('50')).toBe('50px');
        expect(getCssSize('1.5')).toBe('1.5px');
        expect(getCssSize('0')).toBe('0px');
    });

    it('retorna string com unidade CSS sem alteração', () => {
        expect(getCssSize('2rem')).toBe('2rem');
        expect(getCssSize('100%')).toBe('100%');
        expect(getCssSize('10vw')).toBe('10vw');
        expect(getCssSize('auto')).toBe('auto');
    });

    it('retorna expressões CSS complexas sem alteração', () => {
        expect(getCssSize('calc(100% - 20px)')).toBe('calc(100% - 20px)');
        expect(getCssSize('var(--spacing)')).toBe('var(--spacing)');
    });
});
