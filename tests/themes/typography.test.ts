import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

describe('Tipografia Canônica do Design System (E10-07)', () => {
    const srcDir = resolve(__dirname, '../../src');
    const componentsDir = resolve(srcDir, 'components');
    const appScss = readFileSync(resolve(srcDir, 'themes/app.scss'), 'utf-8');
    const fontScss = readFileSync(resolve(srcDir, 'themes/font.scss'), 'utf-8');

    it('define --font-sans como token público canônico em app.scss', () => {
        expect(appScss).toMatch(/--font-sans:\s*['"]?Quicksand['"]?,/i);
        expect(appScss).toContain('Instrument Sans');
        expect(appScss).toContain('sans-serif');
    });

    it('faz body, html e #app consumirem var(--font-sans) em font.scss', () => {
        expect(fontScss).toMatch(/body,\s*html,\s*#app\s*\{[^}]*font-family:\s*var\(--font-sans/);
    });

    it('garante que nenhum componente em src/components/ referencia a fonte legada Jost', () => {
        const files = readdirSync(componentsDir).filter((f) => f.endsWith('.vue'));
        const violations: string[] = [];

        for (const file of files) {
            const content = readFileSync(resolve(componentsDir, file), 'utf-8');
            if (/Jost/i.test(content)) violations.push(file);
        }

        expect(violations).toEqual([]);
    });

    it('remove declaração forçada de Jost em MaxInputToggle', () => {
        const sfc = readFileSync(resolve(componentsDir, 'MaxInputToggle.vue'), 'utf-8');
        expect(sfc).not.toMatch(/font-family:\s*Jost/i);
    });

    it('remove declarações forçadas de Jost em MaxTable e MaxTableFields', () => {
        const maxTable = readFileSync(resolve(componentsDir, 'MaxTable.vue'), 'utf-8');
        const maxTableFields = readFileSync(resolve(componentsDir, 'MaxTableFields.vue'), 'utf-8');

        expect(maxTable).not.toMatch(/font-family:\s*Jost/i);
        expect(maxTableFields).not.toMatch(/font-family:\s*Jost/i);
    });
});
