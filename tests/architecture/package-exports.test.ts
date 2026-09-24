import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import * as sass from 'sass';

describe('Arquitetura - Contrato de Exports e Subpaths Públicos', () => {
    const pkgPath = path.resolve(__dirname, '../../package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    const distDir = path.resolve(__dirname, '../../dist');
    const srcDir = path.resolve(__dirname, '../../src');

    function assertFreshBuild() {
        expect(fs.existsSync(distDir), 'dist/ deve existir obrigatoriamente (build prévio obrigatório)').toBe(true);
        const distIndex = path.resolve(distDir, 'index.es.js');
        expect(fs.existsSync(distIndex), 'dist/index.es.js deve existir obrigatoriamente').toBe(true);
        const distMtime = fs.statSync(distIndex).mtimeMs;

        function checkFreshness(dir: string) {
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                if (entry.isDirectory()) checkFreshness(fullPath);
                else if (/\.(vue|ts|js|scss|css)$/.test(entry.name)) {
                    const srcMtime = fs.statSync(fullPath).mtimeMs;
                    expect(
                        srcMtime <= distMtime,
                        `Build desatualizado: o arquivo fonte ${path.relative(process.cwd(), fullPath)} foi modificado após dist/index.es.js. Execute 'npm run build'.`
                    ).toBe(true);
                }
            }
        }
        checkFreshness(srcDir);
    }

    it('deve conter o mapa de exports com os subpaths obrigatórios', () => {
        expect(pkg.exports).toBeDefined();

        // Raiz (.)
        expect(pkg.exports['.']).toBeDefined();
        expect(pkg.exports['.'].types).toBe('./dist/index.d.ts');
        expect(pkg.exports['.'].import).toBe('./dist/index.es.js');

        // ./stores (E11-05)
        expect(pkg.exports['./stores']).toBeDefined();
        expect(pkg.exports['./stores'].types).toBe('./dist/stores/index.d.ts');
        expect(pkg.exports['./stores'].import).toBe('./dist/stores.es.js');

        // ./preset
        expect(pkg.exports['./preset']).toBeDefined();
        expect(pkg.exports['./preset'].types).toBe('./dist/presetMaxUno.d.ts');
        expect(pkg.exports['./preset'].import).toBe('./dist/preset.es.js');

        // ./resolver
        expect(pkg.exports['./resolver']).toBeDefined();
        expect(pkg.exports['./resolver'].types).toBe('./dist/helpers/MaxComponentsUiResolver.d.ts');
        expect(pkg.exports['./resolver'].import).toBe('./dist/resolver.es.js');

        // ./styles (E11-04)
        expect(pkg.exports['./styles']).toBeDefined();
        expect(pkg.exports['./styles'].types).toBe('./dist/styles.d.ts');
        expect(pkg.exports['./styles'].import).toBe('./dist/styles.es.js');

        // CSS e temas (E11-04)
        expect(pkg.exports['./style.css']).toBe('./dist/style.css');
        expect(pkg.exports['./styles.css']).toBe('./dist/style.css');
        expect(pkg.exports['./themes/*']).toBe('./dist/themes/*');
    });

    it('NÃO deve conter o subpath obsoleto ./prime em exports', () => {
        expect(pkg.exports['./prime']).toBeUndefined();
    });

    it('todos os arquivos referenciados em exports estáticos devem existir em dist com build fresco', () => {
        assertFreshBuild();

        const staticExportPaths = [
            pkg.exports['.'].types,
            pkg.exports['.'].import,
            pkg.exports['./stores'].types,
            pkg.exports['./stores'].import,
            pkg.exports['./preset'].types,
            pkg.exports['./preset'].import,
            pkg.exports['./resolver'].types,
            pkg.exports['./resolver'].import,
            pkg.exports['./styles'].types,
            pkg.exports['./styles'].import,
            pkg.exports['./style.css'],
            pkg.exports['./styles.css']
        ];

        for (const relPath of staticExportPaths) {
            const fullPath = path.resolve(__dirname, '../../', relPath);
            expect(fs.existsSync(fullPath), `Arquivo de export ${relPath} deve existir`).toBe(true);
        }
    });

    it('deve validar e compilar o SCSS de dist/themes/all.scss com sass e inspecionar seu conteúdo', () => {
        assertFreshBuild();

        const themesDir = path.resolve(distDir, 'themes');
        const allScssPath = path.resolve(themesDir, 'all.scss');
        expect(fs.existsSync(themesDir), 'dist/themes deve existir').toBe(true);
        expect(fs.existsSync(allScssPath), 'dist/themes/all.scss deve existir').toBe(true);

        // Inspeção do conteúdo bruto do arquivo SCSS de entrada de temas
        const scssContent = fs.readFileSync(allScssPath, 'utf-8');
        expect(scssContent).toContain('@use \'./app.scss\'');
        expect(scssContent).toContain('@use \'./colors.scss\'');
        expect(scssContent).toContain('@forward \'./focus\'');
        expect(scssContent).toContain('@forward \'./table-anatomy\'');
        expect(scssContent).toContain('@use \'./tokens.scss\'');
        expect(scssContent).toContain('box-sizing: border-box');

        // Compilação real com o compilador sass oficial
        const compiled = sass.compile(allScssPath, {
            loadPaths: [themesDir]
        });
        expect(compiled.css).toBeDefined();
        expect(compiled.css.length).toBeGreaterThan(10000);

        // Inspeção de tokens centrais e seletores no CSS compilado
        expect(compiled.css).toContain('--max-primary-500');
        expect(compiled.css).toContain('--max-focus-ring');
        expect(compiled.css).toContain('--background-0');
        expect(compiled.css).toContain('box-sizing: border-box');
    });

    it('o subpath ./stores deve exportar todas as stores Pinia públicas', async () => {
        const stores = await import('../../src/stores/index');

        expect(stores.useIconStore).toBeDefined();
        expect(stores.usePopoverStore).toBeDefined();
        expect(stores.useModalStore).toBeDefined();
        expect(stores.useConfirmStore).toBeDefined();
        expect(stores.useLoadingStore).toBeDefined();
        expect(stores.useUserStore).toBeDefined();
        expect(stores.useSystemStore).toBeDefined();
        expect(stores.useLoginStore).toBeDefined();
        expect(stores.useSearchBarStore).toBeDefined();
        expect(stores.useListMenusStore).toBeDefined();
        expect(stores.useTopToolbarStore).toBeDefined();
        expect(stores.useToastStore).toBeDefined();
    });

    it('a raiz deve reexportar as stores para retrocompatibilidade', async () => {
        const root = await import('../../src/index');

        expect(root.useIconStore).toBeDefined();
        expect(root.usePopoverStore).toBeDefined();
        expect(root.useModalStore).toBeDefined();
        expect(root.useConfirmStore).toBeDefined();
        expect(root.useLoadingStore).toBeDefined();
        expect(root.useUserStore).toBeDefined();
        expect(root.useSystemStore).toBeDefined();
        expect(root.useLoginStore).toBeDefined();
        expect(root.useSearchBarStore).toBeDefined();
        expect(root.useListMenusStore).toBeDefined();
        expect(root.useTopToolbarStore).toBeDefined();
        expect(root.useToastStore).toBeDefined();
    });

    it('o subpath ./styles deve exportar MaxStyle e tipagens de tema', async () => {
        const styles = await import('../../src/styles');

        expect(styles.MaxStyle).toBeDefined();
        expect(styles.MaxStyle.semantic).toBeDefined();
        expect(styles.MaxStyle.semantic.primary).toBeDefined();
        expect(styles.MaxStyle.semantic.primary[500]).toBe('#00768E');
    });

    it('sideEffects deve listar apenas arquivos CSS/SCSS e não conter o bundle raiz index.es.js para permitir tree-shaking', () => {
        const sideEffects = pkg.sideEffects;
        expect(Array.isArray(sideEffects)).toBe(true);
        expect(sideEffects).toContain('**/*.css');
        expect(sideEffects).toContain('**/*.scss');
        expect(sideEffects).toContain('./dist/style.css');
        expect(sideEffects).not.toContain('./dist/index.es.js');

        // Entries modulares livres de side-effect para permitir tree-shaking
        expect(sideEffects).not.toContain('./dist/stores.es.js');
        expect(sideEffects).not.toContain('./dist/preset.es.js');
        expect(sideEffects).not.toContain('./dist/resolver.es.js');
        expect(sideEffects).not.toContain('./dist/styles.es.js');
    });

    it('deve conter mapa explícito de exports para todos os 118 componentes Vue com types e import apontando para arquivos reais em dist', () => {
        assertFreshBuild();

        const componentsDir = path.resolve(srcDir, 'components');
        const vueFiles = fs.readdirSync(componentsDir)
            .filter((f) => f.endsWith('.vue'))
            .map((f) => f.replace('.vue', ''));

        // Garantia de catálogo completo dos 121 componentes Vue
        expect(vueFiles.length).toBe(121);

        for (const componentName of vueFiles) {
            const subpath = `./components/${componentName}`;
            const exportEntry = pkg.exports[subpath];

            expect(exportEntry, `Subpath ${subpath} deve estar explicitamente mapeado em package.json exports`).toBeDefined();
            expect(exportEntry.types).toBe(`./dist/components/${componentName}.vue.d.ts`);
            expect(exportEntry.import).toBe(`./dist/components/${componentName}.es.js`);

            // Verificação de existência física em dist/
            const typesFullPath = path.resolve(__dirname, '../../', exportEntry.types);
            const importFullPath = path.resolve(__dirname, '../../', exportEntry.import);

            expect(fs.existsSync(typesFullPath), `Arquivo de tipos ${exportEntry.types} deve existir fisicamente em dist/`).toBe(true);
            expect(fs.existsSync(importFullPath), `Arquivo de código ${exportEntry.import} deve existir fisicamente em dist/`).toBe(true);
        }

        // Wildcard de compatibilidade
        expect(pkg.exports['./components/*']).toBeDefined();
    });

    it('CSS global deve ser estritamente opt-in (dist/style.css), sem injeção automática em index.es.js', () => {
        assertFreshBuild();

        const styleCssPath = path.resolve(distDir, 'style.css');
        expect(fs.existsSync(styleCssPath), 'dist/style.css deve existir como bundle de estilo opt-in').toBe(true);
        expect(fs.statSync(styleCssPath).size).toBeGreaterThan(50000);

        const indexEsPath = path.resolve(distDir, 'index.es.js');
        const indexContent = fs.readFileSync(indexEsPath, 'utf-8');

        // index.es.js não deve injetar CSS no DOM automaticamente
        expect(
            indexContent.includes('document.createElement("style")') ||
            indexContent.includes('document.createElement(\'style\')'),
            'dist/index.es.js não deve injetar CSS via document.createElement'
        ).toBe(false);

        // index.es.js não deve conter import estático de CSS
        expect(
            /import\s+['"][^'"]+\.css['"]/.test(indexContent),
            'dist/index.es.js não deve importar CSS estaticamente'
        ).toBe(false);
    });

    it('documentação principal não deve recomendar o subpath obsoleto ./prime', () => {
        const readme = fs.readFileSync(path.resolve(__dirname, '../../README.md'), 'utf-8');
        const autoImport = fs.readFileSync(path.resolve(__dirname, '../../docs/AUTO-IMPORT.md'), 'utf-8');

        // README não lista /prime como entry point ativo na tabela
        expect(readme).not.toMatch(/\|\s*`@maxvue\/max-components-ui\/prime`\s*\|/);

        // AUTO-IMPORT não instrui importar de @maxvue/max-components-ui/prime
        expect(autoImport).not.toContain('importa de `@maxvue/max-components-ui/prime`');
        expect(autoImport).not.toContain('vêm de `@maxvue/max-components-ui/prime`');
    });
});
