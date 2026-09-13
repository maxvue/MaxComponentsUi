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
});
