import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, join } from 'node:path';
import * as sass from 'sass';
import { MaxStyle } from '../../src/styles/style';

const CSS = sass.compile(resolve(__dirname, '../../src/themes/tokens.scss')).css;

/** Extrai declarações de variáveis CSS de um seletor */
function extractVars(css: string, selector: string): Record<string, string> {
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
}

const ROOT_VARS = extractVars(CSS, ':root');

function getAllSourceFiles(dir: string): string[] {
    const files: string[] = [];
    for (const item of readdirSync(dir)) {
        const fullPath = join(dir, item);
        const st = statSync(fullPath);
        if (st.isDirectory()) files.push(...getAllSourceFiles(fullPath));
        else if (/\.(vue|scss|ts)$/.test(item) && !item.endsWith('.d.ts')) files.push(fullPath);
    }
    return files;
}

describe('primaryTokenContract (E10-01)', () => {
    it('materializa os 10 shades primários aprovados em :root idênticos ao MaxStyle', () => {
        const expectedPalette = MaxStyle.semantic.primary;
        const shades = [100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;

        for (const shade of shades) {
            const tokenName = `--max-primary-${shade}`;
            expect(ROOT_VARS[tokenName], `Token ${tokenName} deve existir em tokens.scss`).toBeDefined();
            expect(ROOT_VARS[tokenName].toUpperCase()).toBe(expectedPalette[shade].toUpperCase());
        }
    });

    it('não duplica a rampa primária em .dark', () => {
        const darkVars = extractVars(CSS, '.dark');
        const shades = [100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;
        for (const shade of shades) {
            const tokenName = `--max-primary-${shade}`;
            expect(darkVars[tokenName], `Rampa ${tokenName} não deve ser duplicada em .dark`).toBeUndefined();
        }
    });

    it('todas as referências a var(--max-primary-N) em src/ possuem declaração e fallback teal correto', () => {
        const srcDir = resolve(__dirname, '../../src');
        const files = getAllSourceFiles(srcDir);
        const expectedPalette = MaxStyle.semantic.primary;

        const regex = /var\(\s*(--max-primary-(\d+))(?:\s*,\s*([^)]+))?\)/g;
        const violations: { file: string; token: string; fallback?: string; expectedHex: string }[] = [];

        for (const file of files) {
            // Ignora o próprio tokens.scss
            if (file.endsWith('tokens.scss')) continue;

            const content = readFileSync(file, 'utf-8');
            let match: RegExpExecArray | null;

            while ((match = regex.exec(content)) !== null) {
                const token = match[1];
                const shadeNum = Number(match[2]) as keyof typeof expectedPalette;
                const fallback = match[3]?.trim();

                const expectedHex = expectedPalette[shadeNum];
                if (!expectedHex) {
                    violations.push({ file, token, fallback, expectedHex: 'SHADE_INEXISTENTE' });
                    continue;
                }

                // Se houver fallback hexadecimal, deve bater case-insensitive com o shade oficial
                if (fallback && /^#[0-9a-fA-F]{3,8}$/.test(fallback) && fallback.toUpperCase() !== expectedHex.toUpperCase()) violations.push({ file, token, fallback, expectedHex });
            }
        }

        expect(violations, 'Nenhuma referência a --max-primary-N pode ter fallback divergente').toEqual([]);
    });

    it('link Markdown resolve para --max-primary-700 (#004860)', () => {
        const mdFile = resolve(__dirname, '../../src/components/MaxInputMarkdown.vue');
        const content = readFileSync(mdFile, 'utf-8');
        expect(content).toContain('--max-primary-700');
        expect(content).not.toContain('#1d4ed8');
    });
});
