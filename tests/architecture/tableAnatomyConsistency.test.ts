import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { parse as parseSfc } from '@vue/compiler-sfc';

export interface TableTemplateAstOccurrence {
    tag: string;
    parentTag: string;
    parentClasses: string[];
    ancestorClasses: string[];
    path: string;
    className: string;
    isDynamic: boolean;
    allClassesInNode: string[];
}

export interface TableStructuralRule {
    allowedTags: string[];
    /** O alias é válido apenas neste pai imediato da anatomia real. */
    allowedParentTags: string[];
    requiredParentCanonical?: string;
    /** Classes que precisam existir em algum ancestral, evitando aliases em divs irmãs plausíveis. */
    requiredAncestorCanonicals?: string[];
    requiredSiblingCanonical: string;
    expectedCount: number;
}

/**
 * Catálogo canônico estrutural de classes legadas permitidas em MaxTable.vue.
 * Controla arquivo, bloco, posição/contexto e cardinalidade exata.
 */
export const MAX_TABLE_STRUCTURAL_ALLOWLIST: Record<string, TableStructuralRule> = {
    'p-datatable': {
        allowedTags: ['div'],
        allowedParentTags: ['div'],
        requiredParentCanonical: 'max-table-main-div',
        requiredSiblingCanonical: 'max-table',
        expectedCount: 1
    },
    'p-datatable-scrollable': {
        allowedTags: ['div'],
        allowedParentTags: ['div'],
        requiredParentCanonical: 'max-table-main-div',
        requiredSiblingCanonical: 'max-table-scrollable',
        expectedCount: 1
    },
    'p-datatable-table-container': {
        allowedTags: ['div'],
        allowedParentTags: ['div'],
        requiredParentCanonical: 'max-table',
        requiredSiblingCanonical: 'max-table-container',
        expectedCount: 1
    },
    'p-datatable-cell': {
        allowedTags: ['td'],
        allowedParentTags: ['tr'],
        requiredAncestorCanonicals: ['max-table-container'],
        requiredSiblingCanonical: 'max-table-cell',
        expectedCount: 9
    },
    'p-column': {
        allowedTags: ['tr', 'th'],
        allowedParentTags: ['tbody', 'tr'],
        requiredAncestorCanonicals: ['max-table-container'],
        requiredSiblingCanonical: 'max-table-column',
        expectedCount: 2
    },
    'p-datatable-column-header-content': {
        allowedTags: ['div'],
        allowedParentTags: ['button', 'th'],
        requiredAncestorCanonicals: ['max-table-header-row'],
        requiredSiblingCanonical: 'max-table-column-header-content',
        expectedCount: 3
    },
    'p-datatable-column-title': {
        allowedTags: ['div'],
        allowedParentTags: ['div'],
        requiredParentCanonical: 'max-table-column-header-content',
        requiredSiblingCanonical: 'max-table-column-title',
        expectedCount: 3
    },
    'p-row-even': {
        allowedTags: ['tr'],
        allowedParentTags: ['tbody'],
        requiredAncestorCanonicals: ['max-table-container'],
        requiredSiblingCanonical: 'max-table-row-even',
        expectedCount: 2
    },
    'p-row-odd': {
        allowedTags: ['tr'],
        allowedParentTags: ['tbody'],
        requiredAncestorCanonicals: ['max-table-container'],
        requiredSiblingCanonical: 'max-table-row-odd',
        expectedCount: 2
    }
};

function extractStringLiterals(code: string): string[] {
    const literals: string[] = [];
    const strRegex = /['"`]([^'"`]+)['"`]/g;
    let m: RegExpExecArray | null;
    while ((m = strRegex.exec(code)) !== null) literals.push(...m[1].split(/\s+/).filter(Boolean));

    return literals;
}

/**
 * Analisador sintático e estrutural baseado na AST real do @vue/compiler-sfc.
 * Não é interrompido por templates aninhados e inspeciona tanto classes estáticas quanto :class dinâmicos.
 */
export function extractTableTemplateAstOccurrences(content: string): TableTemplateAstOccurrence[] {
    const parsed = parseSfc(content);
    const ast = parsed.descriptor.template?.ast;
    if (!ast) return [];

    const occurrences: TableTemplateAstOccurrence[] = [];
    function classesOf(node: any): string[] {
        if (!node?.props) return [];
        const classes: string[] = [];
        for (const prop of node.props) classes.push(...(
            prop.type === 6 && prop.name === 'class' && prop.value
                ? prop.value.content.split(/\s+/).filter(Boolean)
                : prop.type === 7 && prop.name === 'bind' && prop.arg?.content === 'class' && prop.exp
                    ? extractStringLiterals(prop.exp.content)
                    : []
        ));
        return classes;
    }

    function walk(node: any, parent: any, pathParts: string[] = [], ancestorClasses: string[] = []) {
        if (!node) return;
        if (node.type !== 1) { // não é ElementNode
            if (node.children) for (const child of node.children) walk(child, parent, pathParts, ancestorClasses);

            return;
        }

        const tag = node.tag;
        const currentPath = [...pathParts, tag];
        const staticClasses: string[] = [];
        const dynamicClasses: string[] = [];

        if (node.props) for (const prop of node.props) if (prop.type === 6 && prop.name === 'class' && prop.value) staticClasses.push(...prop.value.content.split(/\s+/).filter(Boolean));
        else if (prop.type === 7 && prop.name === 'bind' && prop.arg?.content === 'class' && prop.exp) dynamicClasses.push(...extractStringLiterals(prop.exp.content));


        const allClasses = [...staticClasses, ...dynamicClasses];
        for (const cls of allClasses) if (/^p-[a-z][a-z0-9_-]*$/i.test(cls)) occurrences.push({
            tag,
            parentTag: parent?.tag || 'root',
            parentClasses: classesOf(parent),
            ancestorClasses,
            path: currentPath.join(' > '),
            className: cls.toLowerCase(),
            isDynamic: !staticClasses.includes(cls),
            allClassesInNode: allClasses
        });


        // `<template>` é um agrupador Vue, não um nó DOM: a localização é
        // julgada contra o pai que realmente materializa a anatomia.
        const structuralParent = tag === 'template' ? parent : node;
        if (node.children) for (const child of node.children) walk(child, structuralParent, currentPath, [...ancestorClasses, ...allClasses]);


    }

    walk(ast, null);
    return occurrences;
}

/**
 * Validação arquitetural rigorosa de MaxTable.vue:
 * Controla arquivo, bloco, posição/contexto (tag, contexto, classe canônica associada) e cardinalidade exata.
 */
export function auditTableStructuralAnatomy(content: string, filename = 'MaxTable.vue'): string[] {
    const violations: string[] = [];
    const parsed = parseSfc(content);

    // 1. Controle de Bloco: o bloco <style> não pode conter nenhum seletor legado .p-*
    for (const style of parsed.descriptor.styles) {
        const styleMatches = style.content.match(/\.p-[a-z][a-z0-9_-]*/gi);
        if (styleMatches) for (const sel of styleMatches) violations.push(`${filename}: seletor de estilo legado não autorizado '${sel}' no bloco <style>`);


    }

    // 2. Análise Sintática e Estrutural da AST do Template
    const occurrences = extractTableTemplateAstOccurrences(content);
    const countedClasses: Record<string, number> = {};

    for (const occ of occurrences) {
        countedClasses[occ.className] = (countedClasses[occ.className] || 0) + 1;
        const rule = MAX_TABLE_STRUCTURAL_ALLOWLIST[occ.className];

        if (!rule) {
            violations.push(`${filename}: classe legada não autorizada '${occ.className}' no elemento <${occ.tag}>`);
            continue;
        }

        // Validação de Posição / Contexto Estrutural: tag do elemento
        if (!rule.allowedTags.includes(occ.tag)) violations.push(`${filename}: classe '${occ.className}' em posição/tag incorreta <${occ.tag}> (esperado: [${rule.allowedTags.join(', ')}])`);

        if (!rule.allowedParentTags.includes(occ.parentTag)) violations.push(`${filename}: classe '${occ.className}' fora do pai imediato permitido <${occ.parentTag}> (esperado: [${rule.allowedParentTags.join(', ')}])`);
        if (rule.requiredParentCanonical && !occ.parentClasses.includes(rule.requiredParentCanonical)) violations.push(`${filename}: classe '${occ.className}' fora da localização canônica: pai <${occ.parentTag}> sem '${rule.requiredParentCanonical}'`);
        if (rule.requiredAncestorCanonicals && !rule.requiredAncestorCanonicals.every((canonical) => occ.ancestorClasses.includes(canonical))) violations.push(`${filename}: classe '${occ.className}' fora do caminho canônico '${rule.requiredAncestorCanonicals.join(' > ')}' (caminho: ${occ.path})`);


        // Validação de Anatomia Canônica Associada: o elemento com alias DEVE conter a classe canônica .max-*
        if (!occ.allClassesInNode.includes(rule.requiredSiblingCanonical)) violations.push(`${filename}: classe de compatibilidade '${occ.className}' no nó <${occ.tag}> desprovida da anatomia canônica obrigatória '${rule.requiredSiblingCanonical}'`);

    }

    // 3. Controle Estrito de Cardinalidade por Classe
    for (const [cls, rule] of Object.entries(MAX_TABLE_STRUCTURAL_ALLOWLIST)) {
        const count = countedClasses[cls] || 0;
        if (count !== rule.expectedCount) violations.push(`${filename}: cardinalidade incorreta para '${cls}': esperado ${rule.expectedCount}, encontrado ${count}`);

    }

    return violations;
}

describe('Auditoria Arquitetural: Consistência de Anatomia de Tabelas e Desacoplamento Canônico (R03 / F04 e R20 / F26)', () => {
    const tableFile = path.resolve(__dirname, '../../src/components/MaxTable.vue');
    const tableColumnFile = path.resolve(__dirname, '../../src/components/MaxTableColumn.vue');
    const tableFieldsFile = path.resolve(__dirname, '../../src/components/MaxTableFields.vue');
    const tableAnatomyFile = path.resolve(__dirname, '../../src/themes/_table-anatomy.scss');

    describe('Contrato de Módulo Compartilhado e Mixins Canônicos (R20 / F26)', () => {
        it('ambos MaxTable e MaxTableFields devem importar o módulo compartilhado _table-anatomy', () => {
            const tableContent = fs.readFileSync(tableFile, 'utf-8');
            const tableFieldsContent = fs.readFileSync(tableFieldsFile, 'utf-8');

            expect(tableContent).toMatch(/@use\s+['"][^'"]*table-anatomy['"]\s+as\s+table/);
            expect(tableFieldsContent).toMatch(/@use\s+['"][^'"]*table-anatomy['"]\s+as\s+table/);
        });

        it('MaxTable deve incluir os mixins compartilhados de container, header, body e cell base', () => {
            const content = fs.readFileSync(tableFile, 'utf-8');

            expect(content).toContain('@include table.table-container');
            expect(content).toContain('@include table.table-header-row');
            expect(content).toContain('@include table.table-header-cell');
            expect(content).toContain('@include table.table-body-row');
            expect(content).toContain('@include table.table-row-zebra');
            expect(content).toContain('@include table.table-cell-base');
        });

        it('MaxTable não deve duplicar inline as propriedades fundamentais já definidas nos mixins', () => {
            const content = fs.readFileSync(tableFile, 'utf-8');
            const theadTrBlock = content.match(/thead\s*\{[\s\S]*?tr\s*\{([\s\S]*?)\}/)?.[1] ?? '';

            expect(theadTrBlock).not.toMatch(/height:\s*var\(--max-table-header-height/);
            expect(theadTrBlock).not.toMatch(/min-width:\s*100%\s*!important/);

            const tbodyTrBlock = content.match(/tbody\s*\{[\s\S]*?tr\s*\{([\s\S]*?td\s*\{)/)?.[1] ?? '';
            expect(tbodyTrBlock).not.toContain('&:first-of-type');
            expect(tbodyTrBlock).not.toContain('&:last-of-type');
        });

        it('o módulo _table-anatomy deve exportar mixins canônicos e compatíveis', () => {
            const anatomyContent = fs.readFileSync(tableAnatomyFile, 'utf-8');

            expect(anatomyContent).toContain('@mixin table-container');
            expect(anatomyContent).toContain('@mixin table-header-row');
            expect(anatomyContent).toContain('@mixin table-header-cell');
            expect(anatomyContent).toContain('@mixin table-body-row');
            expect(anatomyContent).toContain('@mixin table-row-zebra');
            expect(anatomyContent).toContain('@mixin table-cell-base');
            expect(anatomyContent).toContain('@mixin table-cell-input-feedback');
        });
    });

    describe('Anatomia Canônica .max-table-* e Aliases Legados Controlados (R03 / F04)', () => {
        it('MaxTable deve estruturar toda a sua anatomia com classes canônicas .max-table-*', () => {
            const content = fs.readFileSync(tableFile, 'utf-8');

            const canonicalClasses = [
                'max-table',
                'max-table-main-div',
                'max-table-container',
                'max-table-scrollable',
                'max-table-header-row',
                'max-table-th',
                'max-table-header-cell',
                'max-table-column-header-content',
                'max-table-column-title',
                'max-table-column',
                'max-table-row',
                'max-table-row-even',
                'max-table-row-odd',
                'max-table-td',
                'max-table-cell',
                'max-table-empty-cell'
            ];

            for (const cls of canonicalClasses) expect(
                content.includes(cls),
                `MaxTable.vue deve implementar a classe canônica '${cls}'`
            ).toBe(true);

        });

        it('MaxTableColumn deve documentar e materializar o contrato de anatomia canônica de coluna .max-table-column', () => {
            const content = fs.readFileSync(tableColumnFile, 'utf-8');

            expect(content).toContain('max-table-column');
            expect(content).toContain('max-table-th');
            expect(content).toContain('max-table-td');
            expect(content).toContain('max-table-cell');
        });

        it('o bloco <style> de MaxTable deve ser 100% canônico, sem seletores legados .p-*', () => {
            const content = fs.readFileSync(tableFile, 'utf-8');
            const parsed = parseSfc(content);

            for (const style of parsed.descriptor.styles) {
                const legacySelectors = style.content.match(/\.p-[a-z][a-z0-9_-]*/gi);
                expect(
                    legacySelectors ?? [],
                    `O bloco <style> de MaxTable.vue não pode conter seletores legados: ${legacySelectors?.join(', ')}`
                ).toEqual([]);
            }
        });

        it('MaxTable.vue passa integralmente na auditoria estrutural sintática com cardinalidade estrita', () => {
            const content = fs.readFileSync(tableFile, 'utf-8');
            const violations = auditTableStructuralAnatomy(content, 'MaxTable.vue');
            expect(violations).toEqual([]);
        });
    });

    describe('Mutation Testing: Comprovação de falha obrigatória diante de mover, duplicar ou corromper anatomia', () => {
        it('falha obrigatória quando uma ocorrência allowlisted é duplicada (excesso de cardinalidade)', () => {
            const content = fs.readFileSync(tableFile, 'utf-8');
            // Duplica a classe p-datatable no container de scroll
            const mutatedContent = content.replace(
                'class="max-table-container',
                'class="p-datatable max-table-container'
            );

            const violations = auditTableStructuralAnatomy(mutatedContent);
            expect(violations.length).toBeGreaterThan(0);
            expect(violations.some((v) => v.includes('cardinalidade incorreta para \'p-datatable\''))).toBe(true);
        });

        it('falha obrigatória quando uma ocorrência allowlisted é movida para outro elemento/tag (posição incorreta)', () => {
            const content = fs.readFileSync(tableFile, 'utf-8');
            // Move p-datatable da <div> para uma <table>, mantendo a contagem 1
            const mutatedContent = content
                .replace('class="max-table p-datatable"', 'class="max-table"')
                .replace('<table>', '<table class="p-datatable max-table">');

            const violations = auditTableStructuralAnatomy(mutatedContent);
            expect(violations.length).toBeGreaterThan(0);
            expect(violations.some((v) => v.includes('em posição/tag incorreta <table>'))).toBe(true);
        });

        it('falha ao mover um alias para uma div plausível, mesmo mantendo tag e classe canônica irmã', () => {
            const content = fs.readFileSync(tableFile, 'utf-8');
            // A div de container é semanticamente plausível e mantém .max-table, mas não é filha do wrapper correto.
            const mutatedContent = content
                .replace('class="max-table p-datatable"', 'class="max-table"')
                .replace('class="max-table-container max-table-table-container p-datatable-table-container"', 'class="max-table-container max-table-table-container p-datatable-table-container p-datatable max-table"');

            const violations = auditTableStructuralAnatomy(mutatedContent);
            expect(violations.some((v) => v.includes('p-datatable') && v.includes('fora da localização canônica'))).toBe(true);
        });

        it('falha obrigatória quando uma classe de célula p-datatable-cell é movida para um elemento não-td', () => {
            const content = fs.readFileSync(tableFile, 'utf-8');
            // Move uma ocorrência de p-datatable-cell para uma <th>
            const mutatedContent = content
                .replace('class="max-table-td max-table-cell p-datatable-cell state-cell"', 'class="max-table-td max-table-cell state-cell"')
                .replace('<th', '<th class="p-datatable-cell max-table-cell"');

            const violations = auditTableStructuralAnatomy(mutatedContent);
            expect(violations.length).toBeGreaterThan(0);
            expect(violations.some((v) => v.includes('posição/tag incorreta <th>'))).toBe(true);
        });

        it('falha obrigatória quando uma ocorrência allowlisted é movida para o bloco <style>', () => {
            const content = fs.readFileSync(tableFile, 'utf-8');
            // Injeta um seletor legado no bloco <style>
            const mutatedContent = content.replace(
                '</style>',
                '    .p-datatable { border: 1px solid red; }\n</style>'
            );

            const violations = auditTableStructuralAnatomy(mutatedContent);
            expect(violations.length).toBeGreaterThan(0);
            expect(violations.some((v) => v.includes('seletor de estilo legado não autorizado \'.p-datatable\''))).toBe(true);
        });

        it('falha obrigatória quando uma classe legada arbitrária/não catalogada é injetada no template', () => {
            const content = fs.readFileSync(tableFile, 'utf-8');
            const mutatedContent = content.replace(
                'class="max-table',
                'class="p-datatable-arbitrary-unauthorized max-table'
            );

            const violations = auditTableStructuralAnatomy(mutatedContent);
            expect(violations.length).toBeGreaterThan(0);
            expect(violations.some((v) => v.includes('classe legada não autorizada \'p-datatable-arbitrary-unauthorized\''))).toBe(true);
        });

        it('falha obrigatória quando a anatomia canônica associada é removida de um elemento com alias legado', () => {
            const content = fs.readFileSync(tableFile, 'utf-8');
            // Remove a classe canônica 'max-table' deixando apenas o alias 'p-datatable'
            const mutatedContent = content.replace(
                'class="max-table p-datatable"',
                'class="p-datatable"'
            );

            const violations = auditTableStructuralAnatomy(mutatedContent);
            expect(violations.length).toBeGreaterThan(0);
            expect(violations.some((v) => v.includes('desprovida da anatomia canônica obrigatória \'max-table\''))).toBe(true);
        });
    });
});
