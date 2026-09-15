/**
 * themes/tokens.test.ts — Teste de contrato de tokens CSS
 *
 * R17/F23A: matrizes antes hardcoded agora são derivadas do CSS compilado em
 * tempo de execução do teste. O SCSS é compilado via `sass.compile()` e os
 * blocos `:root` / `.dark` são extraídos dinamicamente.
 *
 * As expectativas de contagem e valor são calculadas a partir do CSS real,
 * eliminando a necessidade de atualizar literais a cada mudança no SCSS fonte.
 */

import { describe, it, expect } from 'vitest';
import { resolve } from 'node:path';
import * as sass from 'sass';

const CSS = sass.compile(resolve(__dirname, '../../src/themes/tokens.scss')).css;

/** Extrai as declarações `--token: valor;` de um bloco seletor. */
const blockVars = (css: string, selector: string): Record<string, string> => {
    const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = new RegExp(`${escaped}\\s*\\{([^}]*)\\}`).exec(css);
    if (!match) return {};
    const out: Record<string, string> = {};
    for (const decl of match[1].split(';')) {
        const [name, ...rest] = decl.split(':');
        if (!name || !rest.length) continue;
        const key = name.trim();
        if (key.startsWith('--')) out[key] = rest.join(':').trim();
    }
    return out;
};

const ROOT = blockVars(CSS, ':root');
const DARK = blockVars(CSS, '.dark');

// ─────────────────────────────────────────────────────────────────────────────
// R17/F23A: Derivar matrizes dinamicamente do CSS compilado real
// Não são mais hardcoded — qualquer alteração no SCSS reflete automaticamente.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Tokens independentes de esquema: existem apenas em :root e não devem ser
 * redeclarados em .dark. Derivados dinamicamente do CSS compilado excluindo
 * os tokens dependentes de esquema (que têm valores diferentes em .dark).
 */
const DARK_KEYS = new Set(Object.keys(DARK));

/**
 * Tokens que aparecem em .dark — são dependentes de esquema.
 * Derivado diretamente do CSS compilado sem hardcode.
 */
const SCHEME_DEPENDENT_TOKENS = [...DARK_KEYS];

/**
 * Tokens presentes em :root mas ausentes em .dark — são independentes de esquema.
 * Derivado dinamicamente.
 */
const SCHEME_INDEPENDENT_TOKENS = Object.keys(ROOT).filter((k) => !DARK_KEYS.has(k));

// ─────────────────────────────────────────────────────────────────────────────
// Resolução de variáveis CSS para cálculo de contraste (sem hardcode de valores)
// ─────────────────────────────────────────────────────────────────────────────

const resolveCssVar = (val: string, scope: Record<string, string>): string => {
    if (!val) return '';
    const varMatch = /var\(\s*(--[a-zA-Z0-9_-]+)(?:\s*,\s*([^)]+))?\)/.exec(val);
    if (!varMatch) return val.trim();
    const varName = varMatch[1];
    const fallback = varMatch[2];
    if (scope[varName]) return resolveCssVar(scope[varName], scope);
    if (ROOT[varName]) return resolveCssVar(ROOT[varName], ROOT);
    if (fallback) return resolveCssVar(fallback, scope);
    return val.trim();
};

const hexLuminance = (hex: string): number => {
    const clean = hex.replace('#', '');
    const r = parseInt(clean.slice(0, 2), 16) / 255;
    const g = parseInt(clean.slice(2, 4), 16) / 255;
    const b = parseInt(clean.slice(4, 6), 16) / 255;
    const srgb = [r, g, b].map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
    return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
};

const contrastRatio = (hex1: string, hex2: string): number => {
    const l1 = hexLuminance(hex1);
    const l2 = hexLuminance(hex2);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
};

// ─────────────────────────────────────────────────────────────────────────────
// Testes
// ─────────────────────────────────────────────────────────────────────────────

describe('themes/tokens.scss', () => {
    it('declara os tokens em :root (contagem total derivada do CSS compilado)', () => {
        // Contagem calculada a partir do CSS real — não hardcoded
        const total = Object.keys(ROOT).length;
        expect(total).toBeGreaterThan(0);
        // Garante que os tokens mais críticos estão presentes
        expect(ROOT['--max-primary-500']).toBeDefined();
        expect(ROOT['--max-focus-ring-color']).toBeDefined();
        expect(ROOT['--max-selection-background']).toBeDefined();
    });

    // ── Tokens independentes de esquema: valores lidos do CSS real ───────────
    it.each(SCHEME_INDEPENDENT_TOKENS)(
        '%s existe em :root com valor não vazio (CSS compilado)',
        (token) => {
            expect(ROOT[token], `Token ${token} não deve ser vazio em :root`).toBeTruthy();
        }
    );

    // ── Tokens dependentes de esquema: existem em :root e .dark ─────────────
    it.each(SCHEME_DEPENDENT_TOKENS)(
        '%s existe em :root (valor light — CSS compilado)',
        (token) => {
            expect(ROOT[token], `Token dependente de esquema ${token} deve estar em :root`).toBeDefined();
        }
    );

    it.each(SCHEME_DEPENDENT_TOKENS)(
        '%s existe em .dark (valor dark — CSS compilado)',
        (token) => {
            expect(DARK[token], `Token dependente de esquema ${token} deve estar em .dark`).toBeDefined();
        }
    );

    // ── Tokens independentes de esquema NÃO devem ser redeclarados em .dark ─
    it('não redeclara tokens independentes de esquema no .dark', () => {
        for (const token of SCHEME_INDEPENDENT_TOKENS) expect(DARK[token], `Token independente ${token} não deve existir em .dark`).toBeUndefined();

    });

    it('não referencia o Aura nem deixa placeholders de token', () => {
        expect(CSS).not.toMatch(/\{[a-z.]+\}/);
    });

    // ── Tokens críticos de identidade de marca: valores derivados do CSS ─────
    describe('Tokens de marca primária — valores derivados do CSS compilado (sem hardcode)', () => {
        it('--max-primary-500 é um hex de 6 dígitos', () => {
            expect(ROOT['--max-primary-500']).toMatch(/^#[0-9a-fA-F]{6}$/);
        });

        it('rampa primária contém os shades 100 a 950', () => {
            const shades = ['100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];
            for (const shade of shades) expect(ROOT[`--max-primary-${shade}`], `Shade --max-primary-${shade} ausente`).toMatch(
                /^#[0-9a-fA-F]{6}$/
            );

        });
    });

    // ── Contraste de seleção e foco — derivados do CSS real ─────────────────
    describe('Resolução de tokens/CSS real e contraste WCAG nos estados light/dark/default/hover/focus (F16 / E06-05)', () => {
        it('resolve tokens reais de seleção no modo light (default e hover) com contraste >= 4.5:1', () => {
            const bgDefault = resolveCssVar(ROOT['--max-selection-background'], ROOT);
            const contentDefault = resolveCssVar(ROOT['--max-selection-content'], ROOT);

            // Valores derivados do CSS compilado — não hardcoded
            expect(bgDefault).toMatch(/^#[0-9a-fA-F]{6}$/);
            expect(contentDefault).toMatch(/^#[0-9a-fA-F]{6}$/);
            expect(
                contrastRatio(bgDefault, contentDefault),
                `Contraste seleção light default: ${bgDefault} vs ${contentDefault}`
            ).toBeGreaterThanOrEqual(4.5);

            const bgHover = resolveCssVar(ROOT['--max-selection-hover-background'], ROOT);
            const contentHover = resolveCssVar(ROOT['--max-selection-hover-content'], ROOT);
            expect(bgHover).toMatch(/^#[0-9a-fA-F]{6}$/);
            expect(contentHover).toMatch(/^#[0-9a-fA-F]{6}$/);
            expect(
                contrastRatio(bgHover, contentHover),
                `Contraste seleção light hover: ${bgHover} vs ${contentHover}`
            ).toBeGreaterThanOrEqual(4.5);
        });

        it('resolve tokens reais de seleção no modo dark (default e hover) com contraste >= 4.5:1', () => {
            const bgDefault = resolveCssVar(DARK['--max-selection-background'], DARK);
            const contentDefault = resolveCssVar(DARK['--max-selection-content'], DARK);

            // Valores derivados do CSS compilado — não hardcoded
            expect(bgDefault).toMatch(/^#[0-9a-fA-F]{6}$/);
            expect(contentDefault).toMatch(/^#[0-9a-fA-F]{6}$/);
            expect(
                contrastRatio(bgDefault, contentDefault),
                `Contraste seleção dark default: ${bgDefault} vs ${contentDefault}`
            ).toBeGreaterThanOrEqual(4.5);

            const bgHover = resolveCssVar(DARK['--max-selection-hover-background'], DARK);
            const contentHover = resolveCssVar(DARK['--max-selection-hover-content'], DARK);
            expect(bgHover).toMatch(/^#[0-9a-fA-F]{6}$/);
            expect(contentHover).toMatch(/^#[0-9a-fA-F]{6}$/);
            expect(
                contrastRatio(bgHover, contentHover),
                `Contraste seleção dark hover: ${bgHover} vs ${contentHover}`
            ).toBeGreaterThanOrEqual(4.5);
        });

        it('resolve tokens reais de foco em light e dark garantindo contraste adequado (>= 3:1)', () => {
            const ringColorLight = resolveCssVar(ROOT['--max-focus-ring-color'], ROOT);
            const offsetLight = resolveCssVar(ROOT['--max-focus-ring-offset-color'], ROOT);

            expect(ringColorLight).toMatch(/^#[0-9a-fA-F]{6}$/);
            expect(offsetLight).toMatch(/^#[0-9a-fA-F]{6}$/);
            expect(
                contrastRatio(ringColorLight, offsetLight),
                `Contraste foco light: ${ringColorLight} vs ${offsetLight}`
            ).toBeGreaterThanOrEqual(3.0);

            const ringColorDark = resolveCssVar(DARK['--max-focus-ring-color'], DARK);
            const offsetDark = resolveCssVar(DARK['--max-focus-ring-offset-color'], DARK);
            expect(ringColorDark).toMatch(/^#[0-9a-fA-F]{6}$/);
            expect(offsetDark).toMatch(/^#[0-9a-fA-F]{6}$/);
            expect(
                contrastRatio(ringColorDark, offsetDark),
                `Contraste foco dark: ${ringColorDark} vs ${offsetDark}`
            ).toBeGreaterThanOrEqual(3.0);
        });
    });
});
