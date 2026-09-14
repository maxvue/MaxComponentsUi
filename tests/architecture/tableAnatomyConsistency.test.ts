import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('Auditoria Arquitetural: Consistência de Anatomia de Tabelas (E10-08 / R20)', () => {
    const tableFile = path.resolve(__dirname, '../../src/components/MaxTable.vue');
    const tableFieldsFile = path.resolve(__dirname, '../../src/components/MaxTableFields.vue');
    const tableAnatomyFile = path.resolve(__dirname, '../../src/themes/_table-anatomy.scss');

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

        // Não deve repetir os estilos de table-header-row inline logo após o include
        expect(theadTrBlock).not.toMatch(/height:\s*var\(--max-table-header-height/);
        expect(theadTrBlock).not.toMatch(/min-width:\s*100%\s*!important/);

        // Não deve repetir os seletores &:first-of-type / &:last-of-type já definidos em table-body-row
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
