import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('Arquitetura - Dependências de Runtime', () => {
    const pkgPath = path.resolve(__dirname, '../../package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));

    it('não deve conter pacotes obsoletos ou redundantes em dependencies', () => {
        const forbidden = [
            'quill',
            'oxc-parser',
            '@tiptap/pm',
            '@vue/compiler-core',
            '@vue/compiler-dom',
            '@vue/compiler-sfc',
            '@vue/reactivity',
            '@vue/runtime-core',
            '@vue/runtime-dom'
        ];

        for (const dep of forbidden) expect(pkg.dependencies?.[dep], `Dependência ${dep} não deve estar em dependencies`).toBeUndefined();

    });

    it('deve declarar @maxvue/max-pinia como peerDependency opcional', () => {
        expect(pkg.dependencies?.['@maxvue/max-pinia']).toBeUndefined();
        expect(pkg.peerDependencies?.['@maxvue/max-pinia']).toBeDefined();
        expect(pkg.peerDependenciesMeta?.['@maxvue/max-pinia']?.optional).toBe(true);
    });

    it('deve declarar pdfjs-dist como dependência direta por ser importado pelo visualizador de PDF', () => {
        expect(pkg.dependencies?.['pdfjs-dist']).toBeDefined();
    });

    it('toda dependência declarada em dependencies deve possuir import direto em src ou exceção documentada', () => {
        const srcDir = path.resolve(__dirname, '../../src');
        const imports = new Set<string>();

        function scan(dir: string) {
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                if (entry.isDirectory()) scan(fullPath);
                else if (/\.(ts|vue|js)$/.test(entry.name)) {
                    const content = fs.readFileSync(fullPath, 'utf-8');
                    // Regex para imports estáticos e dinâmicos
                    const regex = /(?:import\s+(?:[\s\S]*?from\s+)?['"]([^'"]+)['"]|import\(['"]([^'"]+)['"]\))/g;
                    let match;
                    while ((match = regex.exec(content)) !== null) {
                        const target = match[1] || match[2];
                        if (target && !target.startsWith('.') && !target.startsWith('@/')) {
                            // Extrai nome do pacote raiz/scoped
                            const parts = target.split('/');
                            const pkgName = target.startsWith('@') ? `${parts[0]}/${parts[1]}` : parts[0];
                            imports.add(pkgName);
                        }
                    }
                }
            }
        }

        scan(srcDir);

        // Exceções contratuais documentadas em docs/DEPENDENCIES.md
        const allowedExceptions = new Set([
            'sass', // Necessário para processamento/compilação SCSS dos temas
            'maska' // Diretiva v-maska utilizada nos templates de inputs
        ]);

        const declaredDependencies = Object.keys(pkg.dependencies || {});

        for (const dep of declaredDependencies) {
            const isImported = imports.has(dep);
            const isException = allowedExceptions.has(dep);
            expect(
                isImported || isException,
                `Dependência "${dep}" em dependencies não é importada em src/ nem é uma exceção documentada`
            ).toBe(true);
        }
    });

    const EXPECTED_TIPTAP_PACKAGES = [
        '@tiptap/core',
        '@tiptap/extension-image',
        '@tiptap/extension-link',
        '@tiptap/extension-table',
        '@tiptap/extension-table-cell',
        '@tiptap/extension-table-header',
        '@tiptap/extension-table-row',
        '@tiptap/extension-text-align',
        '@tiptap/extension-underline',
        '@tiptap/starter-kit',
        '@tiptap/vue-3'
    ];
    const TIPTAP_PINNED_VERSION = '3.31.3';

    it('deve exigir exatamente os 11 pacotes diretos @tiptap/* com versão literal 3.31.3 em package.json', () => {
        for (const pkgName of EXPECTED_TIPTAP_PACKAGES) {
            const currentVersion = pkg.dependencies?.[pkgName];
            expect(
                currentVersion,
                `Dependência ${pkgName} deve estar presente em dependencies e fixada em ${TIPTAP_PINNED_VERSION}`
            ).toBe(TIPTAP_PINNED_VERSION);
        }

        // Garante que nenhuma futura adição @tiptap/* passe com versão flutuante
        for (const [dep, version] of Object.entries(pkg.dependencies || {})) {
            if (!dep.startsWith('@tiptap/')) continue;
            expect(
                EXPECTED_TIPTAP_PACKAGES.includes(dep),
                `Pacote @tiptap inesperado em dependencies: "${dep}"`
            ).toBe(true);
            expect(
                version,
                `Pacote "${dep}" em package.json não deve possuir versão flutuante`
            ).toBe(TIPTAP_PINNED_VERSION);
        }
    });

    it('deve sincronizar os 11 pacotes @tiptap/* no bloco raiz de package-lock.json', () => {
        const lockPath = path.resolve(__dirname, '../../package-lock.json');
        const lock = JSON.parse(fs.readFileSync(lockPath, 'utf-8'));
        const rootDeps = lock.packages?.['']?.dependencies || {};

        for (const pkgName of EXPECTED_TIPTAP_PACKAGES) {
            const currentVersion = rootDeps[pkgName];
            expect(
                currentVersion,
                `Pacote ${pkgName} no bloco raiz do lockfile deve estar sincronizado em ${TIPTAP_PINNED_VERSION}`
            ).toBe(TIPTAP_PINNED_VERSION);
        }

        for (const [dep, version] of Object.entries(rootDeps)) {
            if (!dep.startsWith('@tiptap/')) continue;
            expect(
                version,
                `Pacote "${dep}" no bloco raiz de package-lock.json deve ser versão literal ${TIPTAP_PINNED_VERSION}`
            ).toBe(TIPTAP_PINNED_VERSION);
        }
    });

    it('todas as entradas resolvidas @tiptap/* no grafo do lockfile devem ser 3.31.3 sem deriva', () => {
        const lockPath = path.resolve(__dirname, '../../package-lock.json');
        const lock = JSON.parse(fs.readFileSync(lockPath, 'utf-8'));
        const packages = lock.packages || {};

        const tiptapResolvedEntries = Object.entries(packages).filter(([key]) => key.includes('node_modules/@tiptap/'));
        expect(tiptapResolvedEntries.length, 'Grafo do lockfile deve conter entradas resolvidas de @tiptap/*').toBeGreaterThanOrEqual(11);

        for (const [key, entry] of tiptapResolvedEntries) {
            const typedEntry = entry as { version?: string };
            expect(
                typedEntry.version,
                `Pacote resolvido "${key}" deve ter versão exata ${TIPTAP_PINNED_VERSION}`
            ).toBe(TIPTAP_PINNED_VERSION);
        }

        // Garante que @tiptap/pm existe de forma transitiva na versão correta
        expect(
            packages['node_modules/@tiptap/pm']?.version,
            `@tiptap/pm deve existir como dependência transitiva resolvida em ${TIPTAP_PINNED_VERSION}`
        ).toBe(TIPTAP_PINNED_VERSION);
    });
});
