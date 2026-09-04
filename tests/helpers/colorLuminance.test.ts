import { describe, it, expect } from 'vitest';
import {
    getWcagRelativeLuminance,
    adjustToWcagLuminance,
    resolveStatItemColors
} from '../../src/helpers/colorLuminance';

describe('colorLuminance Helper', () => {
    describe('getWcagRelativeLuminance', () => {
        it('calcula luminância relativa exata para branco e preto puros', () => {
            expect(getWcagRelativeLuminance(255, 255, 255)).toBeCloseTo(1.0, 3);
            expect(getWcagRelativeLuminance(0, 0, 0)).toBeCloseTo(0.0, 3);
        });

        it('calcula luminância relativa para cores primárias conforme fórmula WCAG', () => {
            // R puro: 0.2126
            expect(getWcagRelativeLuminance(255, 0, 0)).toBeCloseTo(0.2126, 3);
            // G puro: 0.7152
            expect(getWcagRelativeLuminance(0, 255, 0)).toBeCloseTo(0.7152, 3);
            // B puro: 0.0722
            expect(getWcagRelativeLuminance(0, 0, 255)).toBeCloseTo(0.0722, 3);
        });
    });

    describe('adjustToWcagLuminance', () => {
        it('ajusta qualquer cor para a luminância relativa WCAG desejada com alta precisão', () => {
            const baseColors = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444'];
            const targetLuminances = [0.83, 0.65, 0.23, 0.10];

            for (const color of baseColors) for (const target of targetLuminances) {
                const adjustedHex = adjustToWcagLuminance(color, target);
                expect(adjustedHex).toMatch(/^#[0-9a-f]{6}$/i);

                const r = parseInt(adjustedHex.slice(1, 3), 16);
                const g = parseInt(adjustedHex.slice(3, 5), 16);
                const b = parseInt(adjustedHex.slice(5, 7), 16);
                const actualLum = getWcagRelativeLuminance(r, g, b);

                // Tolerância pequena de 0.02 devido à quantização de 8-bit RGB
                expect(actualLum).toBeCloseTo(target, 1);
            }

        });

        it('lida graciosamente com valores de cor inválidos retornando fallback seguro', () => {
            const fallback = adjustToWcagLuminance('', 0.5);
            expect(fallback).toBeDefined();
            expect(fallback).toMatch(/^#[0-9a-f]{6}$/i);
        });
    });

    describe('resolveStatItemColors', () => {
        it('devolve paleta unificada com luminâncias 90%, 77%, 18% e 10%', () => {
            const colors = resolveStatItemColors('#3b82f6');

            expect(colors.background).toMatch(/^#[0-9a-f]{6}$/i);
            expect(colors.iconBackground).toMatch(/^#[0-9a-f]{6}$/i);
            expect(colors.textColor).toMatch(/^#[0-9a-f]{6}$/i);
            expect(colors.accentColor).toMatch(/^#[0-9a-f]{6}$/i);

            // Verificar luminâncias
            const parseLum = (hex: string) => {
                const r = parseInt(hex.slice(1, 3), 16);
                const g = parseInt(hex.slice(3, 5), 16);
                const b = parseInt(hex.slice(5, 7), 16);
                return getWcagRelativeLuminance(r, g, b);
            };

            expect(parseLum(colors.background)).toBeCloseTo(0.90, 1);
            expect(parseLum(colors.iconBackground)).toBeCloseTo(0.77, 1);
            expect(parseLum(colors.textColor)).toBeCloseTo(0.18, 1);
            expect(parseLum(colors.accentColor)).toBeCloseTo(0.10, 1);
        });

        it('não possui distinção entre modo Dark e modo Light (retorna a mesma paleta unificada)', () => {
            const lightColors = resolveStatItemColors('#3b82f6', false);
            const darkColors = resolveStatItemColors('#3b82f6', true);

            expect(lightColors.background).toBe(darkColors.background);
            expect(lightColors.iconBackground).toBe(darkColors.iconBackground);
            expect(lightColors.textColor).toBe(darkColors.textColor);
            expect(lightColors.accentColor).toBe(darkColors.accentColor);
        });

        it('utiliza cache de memoização para chamadas subsequentes com mesmos parâmetros', () => {
            const first = resolveStatItemColors('#10b981');
            const second = resolveStatItemColors('#10b981');
            expect(first).toBe(second);
        });
    });
});
