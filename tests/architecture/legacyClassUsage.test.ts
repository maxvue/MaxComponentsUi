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
    /** Seletores .p-* exatamente permitidos no bloco <style> */
    allowedStyleSelectors: string[];
    /** Classes p-* exatamente permitidas no bloco <template> */
    allowedTemplateClasses: string[];
    /** Classes canônicas .max-* obrigatórias que devem existir no arquivo */
    requiredCanonicalClasses: string[];
}

/**
 * Catálogo granular e estrito de exceções de compatibilidade transitória da Fase 2.
 * Nenhuma exceção é controlada apenas por nome de arquivo; cada seletor e classe .p-*
 * permitida é catalogada explicitamente. Qualquer seletor arbitrário adicionado falhará.
 */
export const LEGACY_COMPAT_CATALOG: Record<string, LegacyExceptionCatalogEntry> = {
    'MaxUserSection.vue': {
        allowedStyleSelectors: ['.p-avatar'],
        allowedTemplateClasses: [],
        requiredCanonicalClasses: ['max-user-section']
    },
    'MaxTopToolbar.vue': {
        allowedStyleSelectors: [
            '.p-menubar-root-list',
            '.p-menubar-item',
            '.p-menubar-item-content',
            '.p-menubar-item-active',
            '.p-menubar-submenu-root',
            '.p-focus'
        ],
        allowedTemplateClasses: [
            'p-menubar-root-list',
            'p-menubar-item',
            'p-menubar-item-content',
            'p-menubar-submenu-root'
        ],
        requiredCanonicalClasses: [
            'max-top-toolbar',
            'max-top-toolbar-root-list',
            'max-top-toolbar-item',
            'max-top-toolbar-item-content',
            'max-top-toolbar-submenu-root'
        ]
    },
    'MaxTopToolbarSubmenu.vue': {
        allowedStyleSelectors: [],
        allowedTemplateClasses: [
            'p-menubar-submenu',
            'p-menubar-item',
            'p-menubar-item-content',
            'p-menubar-submenu-nested'
        ],
        requiredCanonicalClasses: [
            'max-top-toolbar-submenu',
            'max-top-toolbar-item',
            'max-top-toolbar-item-content',
            'max-top-toolbar-submenu-nested'
        ]
    },
    'MaxTagSelect.vue': {
        allowedStyleSelectors: ['.p-select', '.p-select-label'],
        allowedTemplateClasses: [],
        requiredCanonicalClasses: ['max-tag-select']
    },
    'MaxTable.vue': {
        allowedStyleSelectors: [
            '.p-datatable',
            '.p-datatable-table-container',
            '.p-datatable-column-header-content',
            '.p-datatable-column-title'
        ],
        allowedTemplateClasses: [
            'p-datatable',
            'p-datatable-scrollable',
            'p-datatable-table-container',
            'p-datatable-cell',
            'p-column',
            'p-datatable-column-header-content',
            'p-datatable-column-title'
        ],
        requiredCanonicalClasses: [
            'max-table',
            'max-table-main-div'
        ]
    },
    'MaxInputIconPicker.vue': {
        allowedStyleSelectors: [
            '.p-drawer-header',
            '.p-drawer-title',
            '.p-drawer-close-button',
            '.p-drawer-content'
        ],
        allowedTemplateClasses: [
            'p-drawer-bottom',
            'p-drawer-header',
            'p-drawer-title',
            'p-drawer-close-button',
            'p-drawer-content'
        ],
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
        allowedStyleSelectors: [
            '.p-fileupload',
            '.p-fileupload-header',
            '.p-fileupload-file',
            '.p-fileupload-content',
            '.p-fileupload-cancel-button',
            '.p-button'
        ],
        allowedTemplateClasses: [],
        requiredCanonicalClasses: [
            'max-input-file-upload-button'
        ]
    },
    'MaxInputFileUpload.vue': {
        allowedStyleSelectors: [
            '.p-fileupload',
            '.p-button',
            '.p-fileupload-content'
        ],
        allowedTemplateClasses: [
            'p-fileupload',
            'p-button',
            'p-fileupload-choose',
            'p-fileupload-content'
        ],
        requiredCanonicalClasses: [
            'max-input-file-upload'
        ]
    }
};

/**
 * Extrai todos os seletores que casam com .p-* de blocos <style>.
 */
export function extractStylePSelectors(content: string): string[] {
    const styleMatches = content.match(/<style\b[^>]*>([\s\S]*?)<\/style>/gi);
    if (!styleMatches) return [];

    const selectors = new Set<string>();
    const selectorRegex = /\.p-[a-z0-9_-]+/gi;

    for (const block of styleMatches) {
        let match: RegExpExecArray | null;
        while ((match = selectorRegex.exec(block)) !== null) selectors.add(match[0].toLowerCase());

    }

    return Array.from(selectors);
}

/**
 * Extrai classes com prefixo p-* no bloco <template>.
 * Exclui falsos positivos como img-p-* ou seletores semânticos próprios.
 */
export function extractTemplatePClasses(content: string): string[] {
    const templateMatch = content.match(/<template\b[^>]*>([\s\S]*?)<\/template>/i);
    if (!templateMatch) return [];

    const templateContent = templateMatch[1];
    const classes = new Set<string>();

    const classAttrRegex = /\bclass=["']([^"']+)["']/g;
    let match: RegExpExecArray | null;

    while ((match = classAttrRegex.exec(templateContent)) !== null) {
        const classNames = match[1].split(/\s+/);
        for (const cls of classNames) if (/^p-[a-z0-9_-]+$/i.test(cls)) classes.add(cls.toLowerCase());


    }

    return Array.from(classes);
}

/**
 * Validador arquitetural estrito: avalia conformidade de um arquivo Vue contra o catálogo.
 */
export function auditVueFileForLegacyClasses(filename: string, content: string): string[] {
    const basename = path.basename(filename);
    const violations: string[] = [];

    const styleSelectors = extractStylePSelectors(content);
    const templateClasses = extractTemplatePClasses(content);
    const catalogEntry = LEGACY_COMPAT_CATALOG[basename];

    if (!catalogEntry) {
        // Arquivo não está na allowlist: qualquer seletor ou classe .p-* é violação
        for (const sel of styleSelectors) violations.push(`${basename}: seletor de estilo não autorizado '${sel}'`);

        for (const cls of templateClasses) violations.push(`${basename}: classe de template não autorizada '${cls}'`);

        return violations;
    }

    // Arquivo na allowlist: validação precisa de cada ocorrência
    const allowedStyleSet = new Set(catalogEntry.allowedStyleSelectors.map((s) => s.toLowerCase()));
    for (const sel of styleSelectors) if (!allowedStyleSet.has(sel.toLowerCase())) violations.push(`${basename}: seletor de estilo não catalogado '${sel}'`);


    const allowedTemplateSet = new Set(catalogEntry.allowedTemplateClasses.map((c) => c.toLowerCase()));
    for (const cls of templateClasses) if (!allowedTemplateSet.has(cls.toLowerCase())) violations.push(`${basename}: classe de template não catalogada '${cls}'`);


    // Anatomia canônica obrigatória: deve conter todas as classes .max-* requeridas
    for (const req of catalogEntry.requiredCanonicalClasses) {
        const hasReqClass = new RegExp(`\\b${req}\\b`, 'i').test(content);
        if (!hasReqClass) violations.push(`${basename}: ausência da anatomia canônica obrigatória '${req}'`);

    }

    return violations;
}

describe('Auditoria Arquitetural: Uso de Classes Legadas e Desacoplamento PrimeVue', () => {
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

    it('apenas componentes estritamente catalogados na Fase 2 podem conter seletores .p-*', () => {
        const uncatalogedFilesWithLegacy: string[] = [];

        for (const file of vueFiles) {
            const basename = path.basename(file);
            const content = fs.readFileSync(file, 'utf-8');
            const styleSelectors = extractStylePSelectors(content);

            if (styleSelectors.length > 0 && !LEGACY_COMPAT_CATALOG[basename]) uncatalogedFilesWithLegacy.push(`${basename}: ${styleSelectors.join(', ')}`);

        }

        expect(uncatalogedFilesWithLegacy).toEqual([]);
    });

    it('cada componente catalogado deve respeitar rigorosamente seu catálogo preciso de seletores e classes .p-*', () => {
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

    describe('Mutation test: rejeição de seletores .p-* arbitrários adicionados', () => {
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
    });
});
