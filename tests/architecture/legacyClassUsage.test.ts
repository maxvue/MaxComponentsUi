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

export interface LegacyExceptionCatalogEntry {
    /** Seletores .p-* com contagem exata de ocorrências no bloco <style> */
    allowedStyleSelectors: Record<string, number>;
    /** Classes p-* com contagem exata de ocorrências no bloco <template> */
    allowedTemplateClasses: Record<string, number>;
    /** Classes canônicas .max-* obrigatórias que devem existir no arquivo */
    requiredCanonicalClasses: string[];
}

/**
 * Catálogo granular e estrito de exceções de compatibilidade transitória da Fase 2.
 * Nenhuma exceção é controlada apenas por Set ou presença solta;
 * cada seletor e classe .p-* possui cardinalidade estrita (ocorrências exatas).
 * Qualquer ocorrência a mais, a menos ou não catalogada falha a auditoria.
 */
export const LEGACY_COMPAT_CATALOG: Record<string, LegacyExceptionCatalogEntry> = {
    'MaxUserSection.vue': {
        allowedStyleSelectors: {
            '.p-avatar': 2
        },
        allowedTemplateClasses: {},
        requiredCanonicalClasses: ['max-user-section']
    },
    'MaxTopToolbar.vue': {
        allowedStyleSelectors: {
            '.p-menubar-root-list': 1,
            '.p-menubar-item': 2,
            '.p-menubar-item-content': 5,
            '.p-menubar-item-active': 2,
            '.p-menubar-submenu-root': 1,
            '.p-focus': 1
        },
        allowedTemplateClasses: {
            'p-menubar-root-list': 1,
            'p-menubar-item': 1,
            'p-menubar-item-content': 1,
            'p-menubar-submenu-root': 1
        },
        requiredCanonicalClasses: [
            'max-top-toolbar',
            'max-top-toolbar-root-list',
            'max-top-toolbar-item',
            'max-top-toolbar-item-content',
            'max-top-toolbar-submenu-root'
        ]
    },
    'MaxTopToolbarSubmenu.vue': {
        allowedStyleSelectors: {},
        allowedTemplateClasses: {
            'p-menubar-submenu': 1,
            'p-menubar-item': 1,
            'p-menubar-item-content': 1,
            'p-menubar-submenu-nested': 1
        },
        requiredCanonicalClasses: [
            'max-top-toolbar-submenu',
            'max-top-toolbar-item',
            'max-top-toolbar-item-content',
            'max-top-toolbar-submenu-nested'
        ]
    },
    'MaxTagSelect.vue': {
        allowedStyleSelectors: {
            '.p-select': 1,
            '.p-select-label': 1
        },
        allowedTemplateClasses: {},
        requiredCanonicalClasses: ['max-tag-select']
    },
    'MaxTable.vue': {
        allowedStyleSelectors: {},
        allowedTemplateClasses: {
            'p-datatable': 1,
            'p-datatable-table-container': 1,
            'p-datatable-cell': 3,
            'p-column': 1
        },
        requiredCanonicalClasses: [
            'max-table',
            'max-table-main-div',
            'max-table-container',
            'max-table-column-header-content',
            'max-table-column-title'
        ]
    },
    'MaxInputIconPicker.vue': {
        allowedStyleSelectors: {
            '.p-drawer-header': 1,
            '.p-drawer-title': 1,
            '.p-drawer-close-button': 1,
            '.p-drawer-content': 1
        },
        allowedTemplateClasses: {},
        requiredCanonicalClasses: [
            'max-icon-picker',
            'max-icon-picker-drawer',
            'max-icon-picker-header',
            'max-icon-picker-title',
            'max-icon-picker-close-button',
            'max-icon-picker-content'
        ]
    },
    'MaxInputFileUploadButton.vue': {
        allowedStyleSelectors: {
            '.p-fileupload': 1,
            '.p-fileupload-header': 1,
            '.p-fileupload-file': 1,
            '.p-fileupload-content': 1,
            '.p-fileupload-cancel-button': 1,
            '.p-button': 1
        },
        allowedTemplateClasses: {},
        requiredCanonicalClasses: [
            'max-input-file-upload-button'
        ]
    },
    'MaxInputFileUpload.vue': {
        allowedStyleSelectors: {
            '.p-fileupload': 1,
            '.p-button': 2,
            '.p-fileupload-content': 1
        },
        allowedTemplateClasses: {
            'p-fileupload': 1,
            'p-button': 2,
            'p-fileupload-choose': 1,
            'p-fileupload-content': 1
        },
        requiredCanonicalClasses: [
            'max-input-file-upload'
        ]
    }
};

/**
 * Extrai todos os seletores que casam com .p-* de blocos <style>, mantendo a contagem de ocorrências.
 */
export function extractStylePSelectors(content: string): Record<string, number> {
    const styleMatches = content.match(/<style\b[^>]*>([\s\S]*?)<\/style>/gi);
    if (!styleMatches) return {};

    const occurrences: Record<string, number> = {};
    const selectorRegex = /\.p-[a-z0-9_-]+/gi;

    for (const block of styleMatches) {
        let match: RegExpExecArray | null;
        while ((match = selectorRegex.exec(block)) !== null) {
            const sel = match[0].toLowerCase();
            occurrences[sel] = (occurrences[sel] || 0) + 1;
        }
    }

    return occurrences;
}

/**
 * Extrai classes com prefixo p-* no bloco <template>, mantendo a contagem de ocorrências.
 */
export function extractTemplatePClasses(content: string): Record<string, number> {
    const templateMatch = content.match(/<template\b[^>]*>([\s\S]*?)<\/template>/i);
    if (!templateMatch) return {};

    const templateContent = templateMatch[1];
    const occurrences: Record<string, number> = {};

    const classAttrRegex = /\bclass=["']([^"']+)["']/g;
    let match: RegExpExecArray | null;

    while ((match = classAttrRegex.exec(templateContent)) !== null) {
        const classNames = match[1].split(/\s+/);
        for (const cls of classNames) if (/^p-[a-z0-9_-]+$/i.test(cls)) {
            const c = cls.toLowerCase();
            occurrences[c] = (occurrences[c] || 0) + 1;
        }

    }

    return occurrences;
}

/**
 * Validador arquitetural estrito com cardinalidade: avalia conformidade de um arquivo Vue contra o catálogo.
 */
export function auditVueFileForLegacyClasses(filename: string, content: string): string[] {
    const basename = path.basename(filename);
    const violations: string[] = [];

    const styleSelectors = extractStylePSelectors(content);
    const templateClasses = extractTemplatePClasses(content);
    const catalogEntry = LEGACY_COMPAT_CATALOG[basename];

    if (!catalogEntry) {
        // Arquivo não está na allowlist: qualquer seletor ou classe .p-* é violação imediata
        for (const [sel, count] of Object.entries(styleSelectors)) violations.push(`${basename}: seletor de estilo não autorizado '${sel}' (${count} ocorrência(s))`);

        for (const [cls, count] of Object.entries(templateClasses)) violations.push(`${basename}: classe de template não autorizada '${cls}' (${count} ocorrência(s))`);

        return violations;
    }

    // Validação estrita de cardinalidade nos seletores de estilo
    for (const [sel, count] of Object.entries(styleSelectors)) {
        const expectedCount = catalogEntry.allowedStyleSelectors[sel];
        if (expectedCount === undefined) violations.push(`${basename}: seletor de estilo não catalogado '${sel}' (${count} ocorrência(s))`);
        else if (count !== expectedCount) violations.push(`${basename}: cardinalidade incorreta para o seletor '${sel}': esperado ${expectedCount}, encontrado ${count}`);

    }

    // Verifica seletores catalogados ausentes no arquivo
    for (const [expectedSel, expectedCount] of Object.entries(catalogEntry.allowedStyleSelectors)) if (!styleSelectors[expectedSel]) violations.push(`${basename}: seletor catalogado ausente '${expectedSel}': esperado ${expectedCount}, encontrado 0`);


    // Validação estrita de cardinalidade nas classes de template
    for (const [cls, count] of Object.entries(templateClasses)) {
        const expectedCount = catalogEntry.allowedTemplateClasses[cls];
        if (expectedCount === undefined) violations.push(`${basename}: classe de template não catalogada '${cls}' (${count} ocorrência(s))`);
        else if (count !== expectedCount) violations.push(`${basename}: cardinalidade incorreta para a classe '${cls}': esperado ${expectedCount}, encontrado ${count}`);

    }

    // Verifica classes de template catalogadas ausentes no arquivo
    for (const [expectedCls, expectedCount] of Object.entries(catalogEntry.allowedTemplateClasses)) if (!templateClasses[expectedCls]) violations.push(`${basename}: classe catalogada ausente '${expectedCls}': esperado ${expectedCount}, encontrado 0`);


    // Anatomia canônica obrigatória: deve conter todas as classes .max-* requeridas
    for (const req of catalogEntry.requiredCanonicalClasses) {
        const hasReqClass = new RegExp(`\\b${req}\\b`, 'i').test(content);
        if (!hasReqClass) violations.push(`${basename}: ausência da anatomia canônica obrigatória '${req}'`);

    }

    return violations;
}

describe('Auditoria Arquitetural: Uso de Classes Legadas e Desacoplamento PrimeVue (R03 / F04)', () => {
    it('nenhum componente em src/components/ deve importar pacotes PrimeVue', () => {
        const violations: { file: string; match: string }[] = [];

        for (const file of vueFiles) {
            const content = fs.readFileSync(file, 'utf-8');
            const primeImportRegex = /from\s+['"](?:primevue|@primevue|@primeuix)[^'"]*['"]/g;
            let match: RegExpExecArray | null;
            while ((match = primeImportRegex.exec(content)) !== null) violations.push({
                file: path.basename(file),
                match: match[0]
            });

        }

        expect(violations).toEqual([]);
    });

    it('apenas componentes estritamente catalogados na Fase 2 podem conter seletores ou classes .p-*', () => {
        const uncatalogedFilesWithLegacy: string[] = [];

        for (const file of vueFiles) {
            const basename = path.basename(file);
            const content = fs.readFileSync(file, 'utf-8');
            const styleSelectors = Object.keys(extractStylePSelectors(content));
            const templateClasses = Object.keys(extractTemplatePClasses(content));

            if ((styleSelectors.length > 0 || templateClasses.length > 0) && !LEGACY_COMPAT_CATALOG[basename]) uncatalogedFilesWithLegacy.push(`${basename}: style=[${styleSelectors.join(', ')}], template=[${templateClasses.join(', ')}]`);

        }

        expect(uncatalogedFilesWithLegacy).toEqual([]);
    });

    it('cada componente catalogado deve respeitar rigorosamente a cardinalidade exata de seletores e classes .p-*', () => {
        const allViolations: string[] = [];

        for (const file of vueFiles) {
            const content = fs.readFileSync(file, 'utf-8');
            const violations = auditVueFileForLegacyClasses(file, content);
            if (violations.length > 0) allViolations.push(...violations);
        }

        expect(allViolations).toEqual([]);
    });

    it('todos os componentes catalogados devem implementar a anatomia canônica obrigatória .max-*', () => {
        for (const [filename, entry] of Object.entries(LEGACY_COMPAT_CATALOG)) {
            const filePath = path.join(COMPONENTS_DIR, filename);
            if (!fs.existsSync(filePath)) continue;

            const content = fs.readFileSync(filePath, 'utf-8');
            for (const requiredClass of entry.requiredCanonicalClasses) {
                const hasClass = new RegExp(`\\b${requiredClass}\\b`, 'i').test(content);
                expect(
                    hasClass,
                    `Componente ${filename} deve implementar a anatomia canônica '${requiredClass}'`
                ).toBe(true);
            }
        }
    });

    describe('Mutation test: rejeição de acréscimo, cardinalidade excedente e remoção de anatomia canônica', () => {
        it('falha na auditoria quando um seletor .p-* arbitrário é injetado em arquivo já catalogado (MaxTopToolbar.vue)', () => {
            const filePath = path.join(COMPONENTS_DIR, 'MaxTopToolbar.vue');
            const originalContent = fs.readFileSync(filePath, 'utf-8');

            const mutatedContent = originalContent.replace(
                '</style>',
                '    .p-arbitrary-unauthorized-selector { color: red; }\n</style>'
            );

            const violations = auditVueFileForLegacyClasses('MaxTopToolbar.vue', mutatedContent);
            expect(violations.length).toBeGreaterThan(0);
            expect(violations.some((v) => v.includes('.p-arbitrary-unauthorized-selector'))).toBe(true);
        });

        it('falha na auditoria quando uma segunda ocorrência de seletor allowlisted é adicionada (duplicação de cardinalidade)', () => {
            const filePath = path.join(COMPONENTS_DIR, 'MaxTagSelect.vue');
            const originalContent = fs.readFileSync(filePath, 'utf-8');

            // .p-select tem cardinalidade 1 em MaxTagSelect. Duplicamos para 2
            const mutatedContent = originalContent.replace(
                '.p-select {',
                '.p-select { color: blue; }\n    .p-select {'
            );

            const violations = auditVueFileForLegacyClasses('MaxTagSelect.vue', mutatedContent);
            expect(violations.length).toBeGreaterThan(0);
            expect(violations.some((v) => v.includes('cardinalidade incorreta para o seletor \'.p-select\''))).toBe(true);
        });

        it('falha na auditoria quando uma classe p-* arbitrária é injetada no template de componente catalogado', () => {
            const filePath = path.join(COMPONENTS_DIR, 'MaxTopToolbar.vue');
            const originalContent = fs.readFileSync(filePath, 'utf-8');

            const mutatedContent = originalContent.replace(
                'class="max-top-toolbar-root-list',
                'class="p-arbitrary-template-class max-top-toolbar-root-list'
            );

            const violations = auditVueFileForLegacyClasses('MaxTopToolbar.vue', mutatedContent);
            expect(violations.length).toBeGreaterThan(0);
            expect(violations.some((v) => v.includes('p-arbitrary-template-class'))).toBe(true);
        });

        it('falha na auditoria quando um seletor .p-* é adicionado em componente não catalogado (MaxButton.vue)', () => {
            const filePath = path.join(COMPONENTS_DIR, 'MaxButton.vue');
            const originalContent = fs.readFileSync(filePath, 'utf-8');

            const mutatedContent = originalContent.replace(
                '</style>',
                '    .p-button-legacy { display: none; }\n</style>'
            );

            const violations = auditVueFileForLegacyClasses('MaxButton.vue', mutatedContent);
            expect(violations.length).toBeGreaterThan(0);
            expect(violations.some((v) => v.includes('.p-button-legacy'))).toBe(true);
        });

        it('falha na auditoria quando uma classe canônica obrigatória .max-* é removida de componente catalogado', () => {
            const filePath = path.join(COMPONENTS_DIR, 'MaxUserSection.vue');
            const originalContent = fs.readFileSync(filePath, 'utf-8');

            const mutatedContent = originalContent.replace(/max-user-section/g, 'custom-user-section');

            const violations = auditVueFileForLegacyClasses('MaxUserSection.vue', mutatedContent);
            expect(violations.length).toBeGreaterThan(0);
            expect(violations.some((v) => v.includes('ausência da anatomia canônica obrigatória \'max-user-section\''))).toBe(true);
        });
    });
});
