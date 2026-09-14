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
 * Allowlist estrita de seletores .p-* por arquivo e por seletor, com justificativa documentada.
 * O guard falha caso qualquer arquivo contenha um seletor .p-* fora de sua lista explícita,
 * impedindo novas dependências internas mesmo em arquivos já compatíveis.
 */
interface LegacySelectorSpec {
    selectors: Set<string>;
    justification: string;
}

const DOCUMENTED_LEGACY_SELECTORS: Record<string, LegacySelectorSpec> = {
    'MaxInputFileUpload.vue': {
        selectors: new Set(['.p-fileupload', '.p-button', '.p-fileupload-content']),
        justification: 'Compatibilidade legada com seletores de upload do PrimeVue'
    },
    'MaxInputFileUploadButton.vue': {
        selectors: new Set([
            '.p-fileupload',
            '.p-fileupload-header',
            '.p-fileupload-file',
            '.p-fileupload-content',
            '.p-fileupload-cancel-button',
            '.p-button'
        ]),
        justification: 'Compatibilidade transitória com botão avançado de upload'
    },
    'MaxInputIconPicker.vue': {
        selectors: new Set([
            '.p-drawer-header',
            '.p-drawer-title',
            '.p-drawer-close-button',
            '.p-drawer-content'
        ]),
        justification: 'Compatibilidade com personalização legada do drawer de ícones'
    },
    'MaxTable.vue': {
        selectors: new Set([
            '.p-datatable',
            '.p-datatable-table-container',
            '.p-datatable-column-header-content',
            '.p-datatable-column-title'
        ]),
        justification: 'Compatibilidade com regras externas aplicadas à estrutura da tabela'
    },
    'MaxTagSelect.vue': {
        selectors: new Set(['.p-select', '.p-select-label']),
        justification: 'Compatibilidade legada com seletores de select do PrimeVue'
    },
    'MaxTopToolbar.vue': {
        selectors: new Set([
            '.p-menubar-root-list',
            '.p-menubar-item',
            '.p-menubar-item-content',
            '.p-menubar-item-active',
            '.p-menubar-submenu-root',
            '.p-focus'
        ]),
        justification: 'Compatibilidade com classes da barra de menu superior'
    },
    'MaxUserSection.vue': {
        selectors: new Set(['.p-avatar']),
        justification: 'Compatibilidade com personalização de avatar de usuário'
    }
};

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

    it('apenas seletores .p-* estritamente documentados por arquivo e ocorrência são permitidos em <style>', () => {
        const unauthorizedSelectors: { file: string; selector: string }[] = [];

        for (const file of vueFiles) {
            const basename = path.basename(file);
            const content = fs.readFileSync(file, 'utf-8');
            const styleMatch = content.match(/<style\b[^>]*>([\s\S]*?)<\/style>/gi);

            if (!styleMatch) continue;

            const styleContent = styleMatch.join('\n');
            const matches = styleContent.match(/\.p-[a-z0-9_-]+/gi);

            if (!matches) continue;

            const allowedSpec = DOCUMENTED_LEGACY_SELECTORS[basename];
            if (!allowedSpec) {
                for (const sel of matches) {
                    unauthorizedSelectors.push({ file: basename, selector: sel });
                }
                continue;
            }

            for (const sel of matches) {
                if (!allowedSpec.selectors.has(sel.toLowerCase())) {
                    unauthorizedSelectors.push({ file: basename, selector: sel });
                }
            }
        }

        expect(unauthorizedSelectors).toEqual([]);
    });

    it('todos os componentes allowlisted devem possuir classes canônicas .max-* em seus templates', () => {
        for (const allowedFile of Object.keys(DOCUMENTED_LEGACY_SELECTORS)) {
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
