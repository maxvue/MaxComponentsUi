import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('Arquitetura - Contrato de Exports e Subpaths Públicos', () => {
    const pkgPath = path.resolve(__dirname, '../../package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    const distDir = path.resolve(__dirname, '../../dist');

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

    it('todos os arquivos referenciados em exports devem existir em dist', () => {
        // Se dist existir, valida todos os caminhos estáticos
        if (fs.existsSync(distDir)) {
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

            // Verifica o diretório copiado de temas
            const themesDir = path.resolve(distDir, 'themes');
            expect(fs.existsSync(themesDir), 'dist/themes deve existir').toBe(true);
            expect(fs.existsSync(path.resolve(themesDir, 'all.scss')), 'dist/themes/all.scss deve existir').toBe(true);
        }
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

    it('sideEffects deve incluir somente folhas de estilo e poupar todos os entries JavaScript', () => {
        const sideEffects = pkg.sideEffects;
        expect(Array.isArray(sideEffects)).toBe(true);
        expect(sideEffects).toContain('**/*.css');
        expect(sideEffects).toContain('**/*.scss');
        expect(sideEffects).not.toContain('./dist/index.es.js');

        // Entries modulares livres de side-effect para permitir tree-shaking
        expect(sideEffects).not.toContain('./dist/stores.es.js');
        expect(sideEffects).not.toContain('./dist/preset.es.js');
        expect(sideEffects).not.toContain('./dist/resolver.es.js');
        expect(sideEffects).not.toContain('./dist/styles.es.js');
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
