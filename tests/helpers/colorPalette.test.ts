import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
    applyPaletteToDom,
    deriveColorScale,
    deriveGrayLightColor,
    deriveSecondaryBColor,
    generateColorScales,
    generateCssVariables,
    generatePaletteSignature,
    initDefaultColorPalette,
    normalizePalette
} from '../../src/helpers/colorPalette';
import {
    COLOR_SCALE_LEVELS,
    DEFAULT_BASE_COLORS,
    PRIMARY_COLOR_NAMES,
    type BaseColorPalette
} from '../../src/types/colors';

describe('colorPalette helper', () => {
    beforeEach(() => {
        const existing = document.getElementById('max-dynamic-colors');
        if (existing) existing.remove();
    });

    afterEach(() => {
        const existing = document.getElementById('max-dynamic-colors');
        if (existing) existing.remove();
    });

    describe('DEFAULT_BASE_COLORS e PRIMARY_COLOR_NAMES', () => {
        it('PRIMARY_COLOR_NAMES inclui text e border', () => {
            expect(PRIMARY_COLOR_NAMES).toContain('text');
            expect(PRIMARY_COLOR_NAMES).toContain('border');
            expect(PRIMARY_COLOR_NAMES).toContain('blue');
        });

        it('contém as cores base principais incluindo text e border com os valores padrões canônicos', () => {
            expect(DEFAULT_BASE_COLORS.pink).toBe('#ED58A2');
            expect(DEFAULT_BASE_COLORS.red).toBe('#E88188');
            expect(DEFAULT_BASE_COLORS['red-b']).toBe('#FF766F');
            expect(DEFAULT_BASE_COLORS.orange).toBe('#F9B182');
            expect(DEFAULT_BASE_COLORS['orange-b']).toBe('#FFAD48');
            expect(DEFAULT_BASE_COLORS.yellow).toBe('#FFE38B');
            expect(DEFAULT_BASE_COLORS['yellow-b']).toBe('#FDFD9F');
            expect(DEFAULT_BASE_COLORS.green).toBe('#96D796');
            expect(DEFAULT_BASE_COLORS['green-b']).toBe('#83E083');
            expect(DEFAULT_BASE_COLORS.emerald).toBe('#25BF8C');
            expect(DEFAULT_BASE_COLORS.seagreen).toBe('#34B9B1');
            expect(DEFAULT_BASE_COLORS.lime).toBe('#8FD02B');
            expect(DEFAULT_BASE_COLORS.blue).toBe('#56C2D7');
            expect(DEFAULT_BASE_COLORS['blue-b']).toBe('#8FBCF5');
            expect(DEFAULT_BASE_COLORS.violet).toBe('#AF64F7');
            expect(DEFAULT_BASE_COLORS.gray).toBe('#ABBBCD');
            expect(DEFAULT_BASE_COLORS['gray-light']).toBe('#D7E0E9');
            expect(DEFAULT_BASE_COLORS.zinc).toBe('#7D7D86');
            expect(DEFAULT_BASE_COLORS.white).toBe('#EEEEEE');
            expect(DEFAULT_BASE_COLORS.black).toBe('#111111');
            expect(DEFAULT_BASE_COLORS.background).toBe('#ABBBCD');
            expect(DEFAULT_BASE_COLORS.primary).toBe('#B8BFCA');
            expect(DEFAULT_BASE_COLORS.secondary).toBe('#7D7D86');
            expect(DEFAULT_BASE_COLORS.warn).toBe('#F5A621');
            expect(DEFAULT_BASE_COLORS.danger).toBe('#FF766F');
            expect(DEFAULT_BASE_COLORS.success).toBe('#83E083');
            expect(DEFAULT_BASE_COLORS.info).toBe('#23ADEB');
            expect(DEFAULT_BASE_COLORS.error).toBe('#E88188');
            expect(DEFAULT_BASE_COLORS.text).toBe('#334155');
            expect(DEFAULT_BASE_COLORS.border).toBe('#CBD5E1');
            expect(DEFAULT_BASE_COLORS['zinc-b']).toBe('#8A8A93');
        });
    });

    describe('derivação de cores secundárias (deriveSecondaryBColor e deriveGrayLightColor)', () => {
        it('deriveSecondaryBColor gera tom mais saturado e luminoso', () => {
            const b = deriveSecondaryBColor('#3B82F6');
            expect(b).toMatch(/^#[A-Fa-f0-9]{6}$/);
            expect(b).not.toBe('#3B82F6');
        });

        it('deriveGrayLightColor gera tom de cinza clareado em direção ao branco', () => {
            const light = deriveGrayLightColor('#ABBBCD');
            expect(light).toMatch(/^#[A-Fa-f0-9]{6}$/);
            expect(light).not.toBe('#ABBBCD');
        });
    });

    describe('normalizePalette', () => {
        it('retorna paleta padrão quando nenhum override for informado', () => {
            const result = normalizePalette();
            expect(result).toEqual(DEFAULT_BASE_COLORS);
        });

        it('aplica overrides parciais preservando os padrões restantes', () => {
            const result = normalizePalette({
                pink: '#112233',
                blue: '#445566'
            });

            expect(result.pink).toBe('#112233');
            expect(result.blue).toBe('#445566');
            expect(result.red).toBe(DEFAULT_BASE_COLORS.red);
            expect(result.background).toBe(DEFAULT_BASE_COLORS.background);
        });

        it('calcula automaticamente cores secundárias -b quando apenas as principais forem passadas', () => {
            const result = normalizePalette({
                blue: '#3B82F6',
                zinc: '#52525B',
                text: '#1E293B',
                border: '#E2E8F0'
            });

            expect(result.blue).toBe('#3B82F6');
            expect(result['blue-b']).toBe(deriveSecondaryBColor('#3B82F6'));
            expect(result['zinc-b']).toBe(deriveSecondaryBColor('#52525B'));
            expect(result['text-b']).toBe(deriveSecondaryBColor('#1E293B'));
            expect(result['border-b']).toBe(deriveSecondaryBColor('#E2E8F0'));
        });

        it('calcula automaticamente gray-light quando apenas gray for passado', () => {
            const result = normalizePalette({
                gray: '#64748B'
            });

            expect(result.gray).toBe('#64748B');
            expect(result['gray-light']).toBe(deriveGrayLightColor('#64748B'));
        });

        it('preserva cores canônicas padrão quando os valores padrão forem mantidos', () => {
            const result = normalizePalette({
                green: DEFAULT_BASE_COLORS.green,
                gray: DEFAULT_BASE_COLORS.gray
            });

            expect(result['green-b']).toBe('#83E083');
            expect(result['gray-light']).toBe('#D7E0E9');
        });

        it('respeita override explícito de cor secundária sobre o cálculo automático', () => {
            const result = normalizePalette({
                blue: '#3B82F6',
                'blue-b': '#990000',
                gray: '#64748B',
                'gray-light': '#EEEEEE'
            });

            expect(result.blue).toBe('#3B82F6');
            expect(result['blue-b']).toBe('#990000');
            expect(result.gray).toBe('#64748B');
            expect(result['gray-light']).toBe('#EEEEEE');
        });

        it('ignora chaves não reconhecidas ou valores em branco', () => {
            const result = normalizePalette({
                invalido: '#FFFFFF',
                pink: '   '
            } as any);

            expect((result as any).invalido).toBeUndefined();
            expect(result.pink).toBe(DEFAULT_BASE_COLORS.pink);
        });
    });

    describe('deriveColorScale', () => {
        it('gera escala com todos os 37 níveis de 0 a 900', () => {
            const scale = deriveColorScale('#ED58A2');
            const keys = Object.keys(scale).map(Number).sort((a, b) => a - b);

            expect(keys).toEqual([...COLOR_SCALE_LEVELS]);
        });

        it('nível 0 é sempre branco e nível 500 é a cor base', () => {
            const scale = deriveColorScale('#ED58A2');

            expect(scale[0]).toBe('#FFFFFF');
            expect(scale[500].toUpperCase()).toBe('#ED58A2');
        });

        it('níveis intermediários clareiam em direção a 0 e escurecem em direção a 900', () => {
            const scale = deriveColorScale('#ED58A2');

            // Nível 25 é muito claro (quase branco)
            expect(scale[25]).toMatch(/^#[A-Fa-f0-9]{6}$/);
            // Nível 900 é bem escuro
            expect(scale[900]).toMatch(/^#[A-Fa-f0-9]{6}$/);
        });
    });

    describe('generatePaletteSignature', () => {
        it('gera assinatura determinística e estável independente da ordem das chaves', () => {
            const pal1: BaseColorPalette = { ...DEFAULT_BASE_COLORS, pink: '#FF0000' };
            const pal2: BaseColorPalette = { ...DEFAULT_BASE_COLORS, pink: '#FF0000' };

            expect(generatePaletteSignature(pal1)).toBe(generatePaletteSignature(pal2));
        });

        it('detecta alteração em qualquer cor', () => {
            const sig1 = generatePaletteSignature(DEFAULT_BASE_COLORS);
            const sig2 = generatePaletteSignature({ ...DEFAULT_BASE_COLORS, blue: '#0000FF' });

            expect(sig1).not.toBe(sig2);
        });
    });

    describe('generateCssVariables', () => {
        it('gera bloco :root e :root.dark com variáveis e inversão 0-850', () => {
            const scales = generateColorScales(DEFAULT_BASE_COLORS);
            const css = generateCssVariables(DEFAULT_BASE_COLORS, scales);

            expect(css).toContain(':root {');
            expect(css).toContain(':root.dark,');
            expect(css).toContain('.dark {');

            // Variável base
            expect(css).toContain('--pink: #ED58A2;');
            expect(css).toContain('--pink-500:');
            expect(css).toContain('--text: #334155;');
            expect(css).toContain('--text-500:');
            expect(css).toContain('--border: #CBD5E1;');
            expect(css).toContain('--border-500:');

            // Inversão dark: nível 850 no dark corresponde ao nível 0 no light
            const pinkLight0 = scales.pink[0];
            expect(css).toContain(`--pink-850: ${pinkLight0};`);

            // Inversão dark: nível 350 no dark corresponde ao nível 500 no light (850 - 350 = 500)
            const pinkLight500 = scales.pink[500];
            expect(css).toContain(`--pink-350: ${pinkLight500};`);
        });
    });

    describe('applyPaletteToDom e initDefaultColorPalette', () => {
        it('cria o elemento style com id max-dynamic-colors no DOM', () => {
            applyPaletteToDom(':root { --teste: #123; }');

            const styleEl = document.getElementById('max-dynamic-colors');
            expect(styleEl).toBeTruthy();
            expect(styleEl?.textContent).toBe(':root { --teste: #123; }');
        });

        it('reutiliza o elemento existente ao atualizar o CSS', () => {
            applyPaletteToDom(':root { --teste: #1; }');
            applyPaletteToDom(':root { --teste: #2; }');

            const elements = document.querySelectorAll('#max-dynamic-colors');
            expect(elements.length).toBe(1);
            expect(elements[0].textContent).toBe(':root { --teste: #2; }');
        });

        it('initDefaultColorPalette injeta as cores padrões quando ausente', () => {
            expect(document.getElementById('max-dynamic-colors')).toBeNull();

            initDefaultColorPalette();

            const styleEl = document.getElementById('max-dynamic-colors');
            expect(styleEl).toBeTruthy();
            expect(styleEl?.textContent).toContain('--pink-500:');
            expect(styleEl?.textContent).toContain('--text-500:');
            expect(styleEl?.textContent).toContain('--border-500:');
        });
    });
});
