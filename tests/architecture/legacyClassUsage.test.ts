import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

function getVueFiles(dir: string): string[] {
    const results: string[] = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) results.push(...getVueFiles(fullPath));
        else if (entry.isFile() && entry.name.endsWith('.vue')) results.push(fullPath);
    }

    return results;
}

const COMPONENTS_DIR = path.resolve(__dirname, '../../src/components');
const vueFiles = getVueFiles(COMPONENTS_DIR);

/**
 * Allowlist de seletores .p-* estritamente documentados como aliases de compatibilidade
 * transitória na Fase 2. Nenhum novo seletor .p-* fora desta lista pode ser introduzido.
 */
const LEGACY_COMPAT_ALLOWLIST = new Set([
    'MaxUserSection.vue',
    'MaxTopToolbar.vue',
    'MaxTagSelect.vue',
    'MaxTable.vue',
    'MaxInputIconPicker.vue',
    'MaxInputFileUploadButton.vue',
    'MaxInputFileUpload.vue'
]);

describe('Auditoria Arquitetural: Uso de Classes Legadas e Desacoplamento PrimeVue', () => {
    it('nenhum componente em src/components/ deve importar pacotes PrimeVue', () => {
        const violations: { file: string; match: string }[] = [];

        for (const file of vueFiles) {
            const content = fs.readFileSync(file, 'utf-8');
            const primeImportRegex = /from\s+['"](?:primevue|@primevue|@primeuix)[^'"]*['"]/g;
            let match;
            while ((match = primeImportRegex.exec(content)) !== null) violations.push({
                file: path.basename(file),
                match: match[0]
            });

        }

        expect(violations).toEqual([]);
    });

    it('apenas componentes allowlisted na Fase 2 podem conter seletores .p-* em seus blocos de estilo', () => {
        const filesWithLegacyStyleSelectors: string[] = [];

        for (const file of vueFiles) {
            const basename = path.basename(file);
            const content = fs.readFileSync(file, 'utf-8');
            const styleMatch = content.match(/<style\b[^>]*>([\s\S]*?)<\/style>/gi);

            if (!styleMatch) continue;

            const styleContent = styleMatch.join('\n');
            const hasLegacySelector = /\.p-[a-z0-9_-]+/i.test(styleContent);

            if (hasLegacySelector && !LEGACY_COMPAT_ALLOWLIST.has(basename)) filesWithLegacyStyleSelectors.push(basename);
        }

        expect(filesWithLegacyStyleSelectors).toEqual([]);
    });

    it('todos os componentes allowlisted devem possuir classes canônicas .max-* em seus templates', () => {
        for (const allowedFile of LEGACY_COMPAT_ALLOWLIST) {
            const filePath = path.join(COMPONENTS_DIR, allowedFile);
            if (!fs.existsSync(filePath)) continue;

            const content = fs.readFileSync(filePath, 'utf-8');
            const hasCanonicalMaxClass = /class=["'][^"']*\bmax-[a-z0-9_-]+/i.test(content);

            expect(
                hasCanonicalMaxClass,
                `Componente ${allowedFile} deve possuir ao menos uma classe canônica .max-*`
            ).toBe(true);
        }
    });
});
