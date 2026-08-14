import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { MaxStyle } from '../../src/styles/style';

const SOURCE = readFileSync(resolve(__dirname, '../../src/styles/style.ts'), 'utf8');
const RAMPS = ['primary', 'success', 'info', 'warning', 'danger'] as const;
const SHADES = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];

describe('styles/style.ts — MaxStyle', () => {
    it('não depende do Aura nem de @primeuix/themes', () => {
        // Mira imports e chamadas reais — comentários explicativos podem citar os nomes.
        expect(SOURCE).not.toMatch(/^\s*import[\s\S]*?from\s*'@primeuix\/themes/m);
        expect(SOURCE).not.toMatch(/definePreset\s*\(/);
    });

    it.each(RAMPS)('declara a rampa semântica %s completa', (ramp) => {
        const value = (MaxStyle.semantic as Record<string, Record<string, string>>)[ramp];
        expect(value).toBeDefined();
        expect(Object.keys(value).sort()).toEqual([...SHADES].sort());
    });

    it('mantém os valores da rampa primária usados em tokens.scss', () => {
        expect(MaxStyle.semantic.primary['100']).toBe('#56C2D7');
        expect(MaxStyle.semantic.primary['200']).toBe('#46BCD4');
        expect(MaxStyle.semantic.primary['400']).toBe('#178DA5');
        expect(MaxStyle.semantic.primary['500']).toBe('#00768E');
        expect(MaxStyle.semantic.primary['600']).toBe('#005F77');
    });
});
