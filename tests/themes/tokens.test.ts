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
    '--max-primary-50': '#67C8DB',
    '--max-primary-100': '#56C2D7',
    '--max-primary-200': '#46BCD4',
    '--max-primary-300': '#2EA4BC',
    '--max-primary-400': '#178DA5',
    '--max-primary-500': '#00768E',
    '--max-primary-600': '#005F77',
    '--max-primary-700': '#004860',
    '--max-primary-800': '#003048',
    '--max-primary-900': '#001931',
    '--max-primary-950': '#00152A',
    '--max-orange-500': '#f97316',
    '--max-red-600': '#dc2626',
    '--max-success-500': '#10B981',
    '--max-success-600': '#059669',
    '--max-danger-500': '#EF4444',
    '--max-danger-600': '#dc2626',
    '--max-danger-700': '#b91c1c',
    '--max-danger-surface': 'var(--max-danger-600, #dc2626)',
    '--max-warning-500': '#F59E0B',
    '--max-warning-600': '#d97706',
    '--max-info-500': '#0EA5E9',
    '--max-info-600': '#0284c7',
    '--max-whatsapp-500': '#25d366',
    '--max-whatsapp-600': '#1da851',
    '--max-whatsapp-700': '#075e54',
    '--max-whatsapp-surface': 'var(--max-whatsapp-700, #075e54)',
    '--max-whatsapp-content': '#ffffff',
    '--max-help-500': '#7c3aed',
    '--max-help-600': '#6d28d9',
    '--max-help-surface': 'var(--max-help-500, #7c3aed)',
    '--max-floatlabel-active-font-weight': '400',
    '--max-floatlabel-on-border-radius': '2px',
    '--max-layer-sticky': '100',
    '--max-layer-navigation': '500',
    '--max-layer-dropdown': '1000',
    '--max-layer-popover': '1200',
    '--max-layer-modal-backdrop': '1300',
    '--max-layer-modal': '1310',
    '--max-layer-fullscreen': '1400',
    '--max-layer-toast': '1500',
    '--max-layer-tooltip': '1600',
    '--max-layer-screen-block': '10000',
    '--z-dropdown': 'var(--max-layer-dropdown, 1000)',
    '--z-sticky': 'var(--max-layer-sticky, 100)',
    '--z-modal-backdrop': 'var(--max-layer-modal-backdrop, 1300)',
    '--z-modal': 'var(--max-layer-modal, 1310)',
    '--z-popover': 'var(--max-layer-popover, 1200)',
    '--z-toast': 'var(--max-layer-toast, 1500)',
    '--z-tooltip': 'var(--max-layer-tooltip, 1600)',
    '--max-primary-content': '#ffffff',
    '--max-secondary-content': '#00152A',
    '--max-success-content': '#00152A',
    '--max-info-content': '#00152A',
    '--max-warning-content': '#00152A',
    '--max-danger-content': '#ffffff',
    '--max-help-content': '#ffffff',
    '--max-table-header-height': '40px',
    '--max-table-header-padding': '0 6px',
    '--max-table-header-gap': '6px',
    '--max-table-row-padding': '3px 6px',
    '--max-table-row-gap': '6px'
};

const SCHEME_DEPENDENT: Record<string, { light: string; dark: string }> = {
    '--max-focus-ring-color': {
        light: 'var(--max-primary-500, #00768E)',
        dark: 'var(--max-primary-400, #178DA5)'
    },
    '--max-focus-ring-offset-color': {
        light: 'var(--background-0, #ffffff)',
        dark: 'var(--background-900, #18181b)'
    },
    '--max-focus-ring': {
        light: '0 0 0 2px var(--background-0, #ffffff), 0 0 0 4px var(--max-primary-500, #00768E)',
        dark: '0 0 0 2px var(--max-focus-ring-offset-color), 0 0 0 4px var(--max-focus-ring-color)'
    },
    '--max-focus-outline': {
        light: '2px solid var(--max-primary-500, #00768E)',
        dark: '2px solid var(--max-focus-ring-color)'
    },
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
    '--max-button-contrast-border-color': { light: '#020617', dark: '#ffffff' },
    '--max-contrast-content': { light: '#ffffff', dark: '#020617' },
    '--max-content-secondary': { light: '#334155', dark: '#cbd5e1' },
    '--max-content-placeholder': { light: '#475569', dark: '#94a3b8' },
    '--max-content-help': { light: '#475569', dark: '#94a3b8' },
    '--max-content-disabled': { light: 'var(--background-650, #94a3b8)', dark: 'var(--background-650, #52525b)' },
    '--max-selection-background': {
        light: 'var(--max-primary-500, #00768E)',
        dark: 'var(--max-primary-400, #178DA5)'
    },
    '--max-selection-content': { light: '#ffffff', dark: '#001524' },
    '--max-selection-hover-background': {
        light: 'var(--max-primary-600, #005F77)',
        dark: 'var(--max-primary-500, #00768E)'
    },
    '--max-selection-hover-content': { light: '#ffffff', dark: '#ffffff' },
    '--max-table-header-bg': {
        light: 'var(--table-header-bg, #003B53)',
        dark: 'var(--table-header-bg, #1E344B)'
    },
    '--max-table-header-text': {
        light: 'var(--table-header-text, #8AD6E8)',
        dark: 'var(--table-header-text, #DDF2F7)'
    },
    '--max-table-row-even-bg': {
        light: 'var(--primary-25)',
        dark: 'var(--primary-25)'
    },
    '--max-table-row-odd-bg': {
        light: 'var(--primary-100)',
        dark: 'var(--primary-100)'
    },
    '--max-table-row-selected-bg': {
        light: 'var(--primary-200)',
        dark: 'var(--primary-200)'
    },
    '--max-table-border-color': {
        light: 'var(--background-300)',
        dark: 'var(--background-300)'
    }
};

describe('themes/tokens.scss', () => {
    it('declara os tokens em :root', () => {
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

    it('par de seleção atinge contraste >= 4.5:1 nos temas claro e escuro (WCAG AA)', () => {
        const getLuminance = (hex: string): number => {
            const clean = hex.replace('#', '');
            const r = parseInt(clean.substring(0, 2), 16) / 255;
            const g = parseInt(clean.substring(2, 4), 16) / 255;
            const b = parseInt(clean.substring(4, 6), 16) / 255;
            const a = [r, g, b].map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
            return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
        };
        const getContrast = (bg: string, fg: string): number => {
            const l1 = getLuminance(bg);
            const l2 = getLuminance(fg);
            return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
        };

        // Light: --max-primary-500 (#00768E) / --max-selection-content (#ffffff)
        expect(getContrast('#00768E', '#ffffff')).toBeGreaterThanOrEqual(4.5);

        // Dark: --max-primary-400 (#178DA5) / --max-selection-content (#001524)
        expect(getContrast('#178DA5', '#001524')).toBeGreaterThanOrEqual(4.5);
    });
});
