import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

describe('Tipografia Canônica do Design System (E10-07)', () => {
    const srcDir = resolve(__dirname, '../../src');
    const componentsDir = resolve(srcDir, 'components');
    const appScss = readFileSync(resolve(srcDir, 'themes/app.scss'), 'utf-8');
    const fontScss = readFileSync(resolve(srcDir, 'themes/font.scss'), 'utf-8');

    it('não impõe Quicksand ou --font-sans globalmente em app.scss, herdando a família do consumidor', () => {
        expect(appScss).not.toMatch(/--font-sans/i);
        expect(appScss).not.toMatch(/Quicksand/i);
    });

    it('não declara regra global de família em body, html ou #app em font.scss', () => {
        expect(fontScss).not.toContain('Quicksand');
        expect(fontScss).not.toContain('body,');
        expect(fontScss).not.toContain('html,');
        expect(fontScss).not.toContain('#app');
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
