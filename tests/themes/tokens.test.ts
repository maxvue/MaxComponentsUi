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

const SCHEME_INDEPENDENT: Record<string, string> = {
    '--max-primary-100': '#56C2D7',
    '--max-primary-200': '#46BCD4',
    '--max-primary-400': '#178DA5',
    '--max-primary-500': '#00768E',
    '--max-primary-600': '#005F77',
    '--max-orange-500': '#f97316',
    '--max-red-600': '#dc2626',
    '--max-floatlabel-active-font-weight': '400',
    '--max-floatlabel-on-border-radius': '2px'
};

const SCHEME_DEPENDENT: Record<string, { light: string; dark: string }> = {
    '--max-inputtext-border-color': { light: '#cbd5e1', dark: '#52525b' },
    '--max-inputtext-disabled-background': { light: '#e2e8f0', dark: '#3f3f46' },
    '--max-inputtext-focus-border-color': { light: '#00768E', dark: '#178DA5' },
    '--max-form-field-disabled-background': { light: '#e2e8f0', dark: '#3f3f46' },
    '--max-floatlabel-on-active-background': { light: '#ffffff', dark: '#09090b' },
    '--max-surface-400': { light: '#94a3b8', dark: '#a1a1aa' },
    '--max-button-primary-border-color': { light: '#00768E', dark: '#178DA5' },
    '--max-button-secondary-border-color': { light: '#f1f5f9', dark: '#27272a' },
    '--max-button-info-border-color': { light: '#0ea5e9', dark: '#38bdf8' },
    '--max-button-success-border-color': { light: '#22c55e', dark: '#4ade80' },
    '--max-button-warn-border-color': { light: '#f97316', dark: '#fb923c' },
    '--max-button-help-border-color': { light: '#a855f7', dark: '#c084fc' },
    '--max-button-danger-border-color': { light: '#ef4444', dark: '#f87171' },
    '--max-button-contrast-border-color': { light: '#020617', dark: '#ffffff' }
};

describe('themes/tokens.scss', () => {
    it('declara os 23 tokens em :root', () => {
        const total = Object.keys(SCHEME_INDEPENDENT).length + Object.keys(SCHEME_DEPENDENT).length;
        expect(Object.keys(ROOT)).toHaveLength(total);
    });

    it.each(Object.entries(SCHEME_INDEPENDENT))('%s vale %s em :root', (token, value) => {
        expect(ROOT[token]).toBe(value);
    });

    it.each(Object.entries(SCHEME_DEPENDENT))('%s tem valor light em :root', (token, pair) => {
        expect(ROOT[token]).toBe(pair.light);
    });

    it.each(Object.entries(SCHEME_DEPENDENT))('%s tem valor dark em .dark', (token, pair) => {
        expect(DARK[token]).toBe(pair.dark);
    });

    it('não redeclara tokens independentes de esquema no .dark', () => {
        for (const token of Object.keys(SCHEME_INDEPENDENT)) expect(DARK[token]).toBeUndefined();
    });

    it('não referencia o Aura nem deixa placeholders de token', () => {
        expect(CSS).not.toMatch(/\{[a-z.]+\}/);
    });
});
