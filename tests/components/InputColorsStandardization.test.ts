import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect } from 'vitest';

describe('Padronização de Cores de Placeholder, Valor Preenchido e Dropdown', () => {
    const readComponent = (filename: string) => {
        return readFileSync(resolve(__dirname, `../../src/components/${filename}`), 'utf-8');
    };

    describe('1. InputBase e MaxBaseInput (Núcleo de Herança)', () => {
        it('InputBase deve ter input e textarea em var(--background-750) e placeholder em var(--background-500)', () => {
            const sfc = readComponent('InputBase.vue');
            expect(sfc).toMatch(/input,\s*textarea\s*\{[^}]*color:\s*var\(--background-750\);/);
            expect(sfc).toMatch(/&::placeholder\s*\{[^}]*color:\s*var\(--background-500\);/);
        });

        it('MaxBaseInput deve ter input em var(--background-750) e placeholder em var(--background-500)', () => {
            const sfc = readFileSync(resolve(__dirname, '../../src/components/base/MaxBaseInput.vue'), 'utf-8');
            expect(sfc).toMatch(/\.max-input\s*\{[^}]*color:\s*var\(--background-750\);/);
            expect(sfc).toMatch(/&::placeholder\s*\{[^}]*color:\s*var\(--background-500\);/);
        });
    });

    describe('2. MaxInputSelect', () => {
        it('deve ter placeholder em var(--background-500)', () => {
            const sfc = readComponent('MaxInputSelect.vue');
            expect(sfc).toMatch(/\.placeholder-select\s*\{[^}]*color:\s*var\(--background-500\);/);
        });

        it('deve ter valor selecionado no trigger em var(--background-750)', () => {
            const sfc = readComponent('MaxInputSelect.vue');
            expect(sfc).toMatch(/\.value-text\s*\{[^}]*color:\s*var\(--background-750\);/);
        });

        it('deve ter filtro de pesquisa no dropdown com color var(--background-750) e placeholder var(--background-500)', () => {
            const sfc = readComponent('MaxInputSelect.vue');
            expect(sfc).toMatch(/\.max-select-filter\s*\{[^}]*color:\s*var\(--background-750\);/);
            expect(sfc).toMatch(/\.max-select-filter\s*\{[^}]*&::placeholder\s*\{[^}]*color:\s*var\(--background-500\);/);
        });

        it('deve ter itens e opções no dropdown em var(--background-750)', () => {
            const sfc = readComponent('MaxInputSelect.vue');
            expect(sfc).toMatch(/\.max-select-option\s*\{[^}]*color:\s*var\(--background-750\);/);
            expect(sfc).toMatch(/\.labelz,\s*\.subLabel\s*\{[^}]*color:\s*var\(--background-750\);/);
            expect(sfc).toMatch(/\.icon-div\s*\{[^}]*color:\s*var\(--background-750\)\s*!important;/);
            expect(sfc).toMatch(/\.max-select-empty-message\s*\{[^}]*color:\s*var\(--background-750\);/);
        });
    });

    describe('3. MaxInputUF', () => {
        it('deve ter valor no trigger em var(--background-750)', () => {
            const sfc = readComponent('MaxInputUF.vue');
            expect(sfc).toMatch(/\.max-uf-trigger-value\s*\{[^}]*color:\s*var\(--background-750\);/);
        });

        it('deve ter código e nome do estado no dropdown em var(--background-750)', () => {
            const sfc = readComponent('MaxInputUF.vue');
            expect(sfc).toMatch(/\.max-uf-code\s*\{[^}]*color:\s*var\(--background-750\);/);
            expect(sfc).toMatch(/\.max-uf-name\s*\{[^}]*color:\s*var\(--background-750\);/);
        });
    });

    describe('4. MaxTagSelect', () => {
        it('deve ter placeholder em var(--background-500)', () => {
            const sfc = readComponent('MaxTagSelect.vue');
            expect(sfc).toMatch(/\.tab-placeholder-select\s*\{[^}]*color:\s*var\(--background-500\);/);
        });

        it('deve ter filtro no dropdown com color var(--background-750) e placeholder var(--background-500)', () => {
            const sfc = readComponent('MaxTagSelect.vue');
            expect(sfc).toMatch(/\.max-select-filter\s*\{[^}]*color:\s*var\(--background-750\);/);
            expect(sfc).toMatch(/\.max-select-filter\s*\{[^}]*&::placeholder\s*\{[^}]*color:\s*var\(--background-500\);/);
        });

        it('deve ter opções no dropdown em var(--background-750)', () => {
            const sfc = readComponent('MaxTagSelect.vue');
            expect(sfc).toMatch(/\.max-select-option\s*\{[^}]*color:\s*var\(--background-750/);
        });
    });

    describe('5. MaxListBox', () => {
        it('deve ter filtro com color var(--background-750) e placeholder var(--background-500)', () => {
            const sfc = readComponent('MaxListBox.vue');
            expect(sfc).toMatch(/\.max-listbox-filter-input\s*\{[^}]*color:\s*var\(--background-750\);/);
            expect(sfc).toMatch(/&::placeholder\s*\{[^}]*color:\s*var\(--background-500\);/);
        });

        it('deve ter itens da lista em var(--background-750)', () => {
            const sfc = readComponent('MaxListBox.vue');
            expect(sfc).toMatch(/\.max-listbox-item\s*\{[\s\S]*?color:\s*var\(--background-750\);/);
            expect(sfc).toMatch(/\.max-listbox-empty,\s*\.max-listbox-loader,\s*\.max-listbox-error\s*\{[^}]*color:\s*var\(--background-750\);/);
        });
    });

    describe('6. MaxInputPhone', () => {
        it('deve ter label-flag no trigger em var(--background-750)', () => {
            const sfc = readComponent('MaxInputPhone.vue');
            expect(sfc).toMatch(/\.label-flag\s*\{[^}]*color:\s*var\(--background-750\);/);
        });

        it('deve ter input de busca no dropdown com color var(--background-750) e placeholder var(--background-500)', () => {
            const sfc = readComponent('MaxInputPhone.vue');
            expect(sfc).toMatch(/\.max-phone-select-filter\s*\{[\s\S]*?input\s*\{[^}]*color:\s*var\(--background-750\);/);
            expect(sfc).toMatch(/\.max-phone-select-filter\s*\{[\s\S]*?input\s*\{[^}]*&::placeholder\s*\{[^}]*color:\s*var\(--background-500\);/);
        });

        it('deve ter itens no dropdown em var(--background-750)', () => {
            const sfc = readComponent('MaxInputPhone.vue');
            expect(sfc).toMatch(/\.icon-div\s*\{[^}]*color:\s*var\(--background-750\)\s*!important;/);
            expect(sfc).toMatch(/\.subLabel\s*\{[^}]*color:\s*var\(--background-750\);/);
            expect(sfc).toMatch(/\.labelz\s*\{[^}]*color:\s*var\(--background-750\);/);
        });
    });

    describe('7. MaxInputBirthday e MaxInputDatePicker', () => {
        it('MaxInputBirthday deve ter segmentos em var(--background-750) e is-empty em var(--background-500)', () => {
            const sfc = readComponent('MaxInputBirthday.vue');
            expect(sfc).toMatch(/\.max-birthday-segment\s*\{[^}]*color:\s*var\(--background-750\);/);
            expect(sfc).toMatch(/&\.is-empty\s*\{[^}]*color:\s*var\(--background-500\);/);
            expect(sfc).toMatch(/\.max-birthday-popover\s*\{[^}]*color:\s*var\(--background-750\);/);
            expect(sfc).toMatch(/\.max-birthday-option-btn\s*\{[^}]*color:\s*var\(--background-750\);/);
        });

        it('MaxInputDatePicker deve ter input e dias/meses em var(--background-750)', () => {
            const sfc = readComponent('MaxInputDatePicker.vue');
            expect(sfc).toMatch(/\.max-datepicker-input\s*\{[^}]*color:\s*var\(--background-750\);/);
            expect(sfc).toMatch(/\.max-datepicker-day\s*\{[^}]*color:\s*var\(--background-750\);/);
            expect(sfc).toMatch(/\.max-datepicker-month-btn,\s*\.max-datepicker-year-btn\s*\{[^}]*color:\s*var\(--background-750\);/);
        });
    });

    describe('8. MaxInputIconPicker e MaxChips', () => {
        it('MaxInputIconPicker deve ter trigger em var(--background-750) e placeholder em var(--background-500)', () => {
            const sfc = readComponent('MaxInputIconPicker.vue');
            expect(sfc).toMatch(/\.trigger-label\s*\{[^}]*color:\s*var\(--background-750\);/);
            expect(sfc).toMatch(/&\.is-placeholder\s*\{[^}]*color:\s*var\(--background-500\);/);
            expect(sfc).toMatch(/\.picker-search-input\s*\{[^}]*color:\s*var\(--background-750\);/);
            expect(sfc).toMatch(/&::placeholder\s*\{[^}]*color:\s*var\(--background-500\);/);
        });

        it('MaxChips deve ter tokens em var(--background-750) e placeholder em var(--background-500)', () => {
            const sfc = readComponent('MaxChips.vue');
            expect(sfc).toMatch(/\.max-chip-token\s*\{[^}]*color:\s*var\(--background-750\);/);
            expect(sfc).toMatch(/&::placeholder\s*\{[^}]*color:\s*var\(--background-500\);/);
        });
    });

    describe('9. MaxTable', () => {
        it('deve ter filtros de coluna e menu em var(--background-750) e placeholder em var(--background-500)', () => {
            const sfc = readComponent('MaxTable.vue');
            expect(sfc).toMatch(/\.max-table-filter-input\s*\{[^}]*color:\s*var\(--background-750\);/);
            expect(sfc).toMatch(/\.max-table-filter-input\s*\{[^}]*&::placeholder\s*\{[^}]*color:\s*var\(--background-500\);/);
            expect(sfc).toMatch(/\.max-table-filter-menu-input\s*\{[^}]*color:\s*var\(--background-750\);/);
            expect(sfc).toMatch(/\.max-table-filter-menu-input\s*\{[^}]*&::placeholder\s*\{[^}]*color:\s*var\(--background-500\);/);
            expect(sfc).toMatch(/\.filter-popover-select\s*\{[^}]*color:\s*var\(--background-750\);/);
        });
    });
});
