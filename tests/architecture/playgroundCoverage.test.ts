import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { PLAYGROUND_CATALOG, FAMILIES, getCoverageStats } from '../../playground/src/catalog';

const ROOT_DIR = path.resolve(__dirname, '../../');
const MANIFEST_PATH = path.resolve(ROOT_DIR, 'src/components-manifest.json');
const PLAYGROUND_DIR = path.resolve(ROOT_DIR, 'playground');

describe('E10-10: Cobertura do Playground e Identidade Canônica', () => {
    const manifestRaw = fs.readFileSync(MANIFEST_PATH, 'utf-8');
    const manifestComponents: string[] = JSON.parse(manifestRaw).components;

    it('100% dos componentes do manifesto constam no catálogo do playground', () => {
        const catalogComponentNames = new Set(PLAYGROUND_CATALOG.map((c) => c.name));

        const missing = manifestComponents.filter((comp) => !catalogComponentNames.has(comp));
        expect(missing).toEqual([]);

        const stats = getCoverageStats();
        expect(stats.total).toBe(manifestComponents.length);
        expect(stats.coveragePercentage).toBe(100);
    });

    it('todo componente no catálogo possui família válida e cenário associado', () => {
        const validFamilies = new Set(FAMILIES.map((f) => f.id));

        for (const item of PLAYGROUND_CATALOG) {
            expect(validFamilies.has(item.family)).toBe(true);
            expect(item.scenarioId).toBeDefined();
            expect(item.scenarioId.length).toBeGreaterThan(0);
            expect(item.description).toBeDefined();
            expect(item.description.length).toBeGreaterThan(0);
        }
    });

    it('todos os aliases apontam para um componente canônico existente', () => {
        const componentNames = new Set(manifestComponents);

        const aliases = PLAYGROUND_CATALOG.filter((item) => item.isAlias);
        expect(aliases.length).toBeGreaterThan(0);

        for (const alias of aliases) {
            expect(alias.aliasOf).toBeDefined();
            expect(componentNames.has(alias.aliasOf!)).toBe(true);
        }
    });

    it('shell do playground não contém gradiente roxo nem fontes ad-hoc concorrentes', () => {
        const appVuePath = path.resolve(PLAYGROUND_DIR, 'src/App.vue');
        const stylesScssPath = path.resolve(PLAYGROUND_DIR, 'src/styles.scss');

        const appContent = fs.readFileSync(appVuePath, 'utf-8');
        const stylesContent = fs.readFileSync(stylesScssPath, 'utf-8');

        const combined = appContent + '\n' + stylesContent;

        // Proibição expressa do gradiente roxo genérico (#667eea e #764ba2)
        expect(combined).not.toContain('#667eea');
        expect(combined).not.toContain('#764ba2');

        // Shell deve usar a variável canônica --font-sans e não fontes de sistema soltas
        expect(combined).not.toContain('-apple-system, BlinkMacSystemFont');
    });

    it('playground importa o tema canônico em main.ts e styles.scss', () => {
        const mainTsPath = path.resolve(PLAYGROUND_DIR, 'src/main.ts');
        const mainContent = fs.readFileSync(mainTsPath, 'utf-8');
        expect(mainContent).toMatch(/import\s+['"]\.\/styles(?:\.scss)?['"]/);

        const stylesScssPath = path.resolve(PLAYGROUND_DIR, 'src/styles.scss');
        const stylesContent = fs.readFileSync(stylesScssPath, 'utf-8');
        expect(stylesContent).toMatch(/@use\s+['"].*\/themes\/all(?:\.scss)?['"]/);
    });

    it('PlaygroundToolbar implementa alternância de tema (.dark) e as 4 larguras de tela', () => {
        const toolbarPath = path.resolve(PLAYGROUND_DIR, 'src/components/PlaygroundToolbar.vue');
        const toolbarContent = fs.readFileSync(toolbarPath, 'utf-8');

        // As 4 larguras exigidas
        expect(toolbarContent).toContain('desktop');
        expect(toolbarContent).toContain('tablet');
        expect(toolbarContent).toContain('mobile');
        expect(toolbarContent).toContain('narrow');
        expect(toolbarContent).toContain('240px');
        expect(toolbarContent).toContain('320px');
        expect(toolbarContent).toContain('768px');

        // Alternância de tema escuro
        expect(toolbarContent).toContain('isDark');
        expect(toolbarContent).toContain('toggleDark');
    });

    it('R19: todos os 36 arquivos de cenário existem fisicamente em playground/src/scenarios/', () => {
        const scenariosDir = path.resolve(PLAYGROUND_DIR, 'src/scenarios');
        expect(fs.existsSync(scenariosDir)).toBe(true);

        const scenarioIds = [...new Set(PLAYGROUND_CATALOG.map((c) => c.scenarioId))];
        expect(scenarioIds.length).toBe(36);

        for (const id of scenarioIds) {
            const scenarioFile = path.resolve(scenariosDir, `${id}.vue`);
            expect(fs.existsSync(scenarioFile), `Arquivo de cenário ${id}.vue deve existir`).toBe(true);
        }
    });

    it('R19: cálculo de cobertura é determinístico e reflete cenários implementados', () => {
        const stats = getCoverageStats();
        expect(stats.coveredCount).toBe(stats.total);
        expect(stats.coveragePercentage).toBe(100);
    });
});
