import { describe, it, expect } from 'vitest';
import { getColorFromVar } from '@maxvue/max-use';

describe('getColorFromVar', () => {
    it('retorna instância Color para cor RGB direta', () => {
        const color = getColorFromVar('rgb(255, 0, 0)');
        expect(color.red()).toBe(255);
        expect(color.green()).toBe(0);
        expect(color.blue()).toBe(0);
    });

    it('retorna instância Color para cor hex direta', () => {
        const color = getColorFromVar('#ff0000');
        expect(color.red()).toBe(255);
        expect(color.green()).toBe(0);
    });

    it('retorna instância Color para nome de cor CSS', () => {
        const color = getColorFromVar('red');
        expect(color.red()).toBe(255);
    });

    it('resolve variável CSS --var via getComputedStyle mock', () => {
        const color = getColorFromVar('--blue-500');
        // Mock retorna '#3b82f6' para --blue-500
        expect(color.hex()).toBe('#3B82F6');
    });

    it('resolve variável CSS var(--var) extraindo o nome', () => {
        const color = getColorFromVar('var(--red-500)');
        // Mock retorna '#ef4444' para --red-500
        expect(color.hex()).toBe('#EF4444');
    });

    it('ignora espaços ao redor do valor', () => {
        const color = getColorFromVar('  #00ff00  ');
        expect(color.green()).toBe(255);
    });
});
