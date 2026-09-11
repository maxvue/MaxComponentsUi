import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import * as sass from 'sass';

const ACCORDION = readFileSync(resolve(__dirname, '../../src/components/MaxAccordion.vue'), 'utf-8');
const ACCORDION_ITEM = readFileSync(resolve(__dirname, '../../src/components/MaxAccordionItem.vue'), 'utf-8');
const DRAWER = readFileSync(resolve(__dirname, '../../src/components/MaxDrawer.vue'), 'utf-8');
const MENU_VERTICAL_ITEM = readFileSync(resolve(__dirname, '../../src/components/MaxMenuVerticalItem.vue'), 'utf-8');
const TABLE_FIELDS = readFileSync(resolve(__dirname, '../../src/components/MaxTableFields.vue'), 'utf-8');
const FILE_UPLOAD_BUTTON = readFileSync(resolve(__dirname, '../../src/components/MaxInputFileUploadButton.vue'), 'utf-8');
const BASE_INPUT = readFileSync(resolve(__dirname, '../../src/components/base/MaxBaseInput.vue'), 'utf-8');
const INPUT_BASE = readFileSync(resolve(__dirname, '../../src/components/InputBase.vue'), 'utf-8');
const GRID = readFileSync(resolve(__dirname, '../../src/components/MaxGrid.vue'), 'utf-8');
const TOGGLE = readFileSync(resolve(__dirname, '../../src/components/MaxInputToggle.vue'), 'utf-8');
const CHIPS = readFileSync(resolve(__dirname, '../../src/components/MaxChips.vue'), 'utf-8');
const TITLE1 = readFileSync(resolve(__dirname, '../../src/components/MaxTitle1.vue'), 'utf-8');
const TITLE2 = readFileSync(resolve(__dirname, '../../src/components/MaxTitle2.vue'), 'utf-8');
const TAB_ITEM = readFileSync(resolve(__dirname, '../../src/components/MaxTabItem.vue'), 'utf-8');
const EMPTY_DIV = readFileSync(resolve(__dirname, '../../src/components/MaxEmptyDiv.vue'), 'utf-8');
const AUTOCOMPLETE = readFileSync(resolve(__dirname, '../../src/components/MaxInputAutoComplete.vue'), 'utf-8');
const AUTOCOMPLETE_API = readFileSync(resolve(__dirname, '../../src/components/MaxInputAutoCompleteApi.vue'), 'utf-8');
const DATE_PICKER = readFileSync(resolve(__dirname, '../../src/components/MaxInputDatePicker.vue'), 'utf-8');
const MARKDOWN = readFileSync(resolve(__dirname, '../../src/components/MaxInputMarkdown.vue'), 'utf-8');
const OTP = readFileSync(resolve(__dirname, '../../src/components/MaxInputOTP.vue'), 'utf-8');
const LISTBOX = readFileSync(resolve(__dirname, '../../src/components/MaxListBox.vue'), 'utf-8');
const SIDE_MENU_MOBILE = readFileSync(resolve(__dirname, '../../src/components/MaxSideMenuMobile.vue'), 'utf-8');
const COLORS_RAW = readFileSync(resolve(__dirname, '../../src/themes/colors.scss'), 'utf-8');

describe('Matriz Semântica de 4 Níveis de Cor de Texto (background-650/700/750/775)', () => {
    describe('1. Tokens Globais (src/themes/colors.scss)', () => {
        it('não deve conter a rampa redundante --text nem --text-0..900', () => {
            expect(COLORS_RAW).not.toMatch(/^\s*--text\s*:\s*#[0-9a-fA-F]+/m);
            expect(COLORS_RAW).not.toMatch(/--text-\d+:/);
        });

        it('aliases semânticos devem apontar para a escala de 4 níveis (650/700/750/775)', () => {
            // --text-color é Texto Normal: background-700
            expect(COLORS_RAW).toMatch(/--text-color:\s*var\(--background-700\);/);
            // --text-b é Texto Forte: background-775
            expect(COLORS_RAW).toMatch(/--text-b:\s*var\(--background-775\);/);
            // --text-c é Texto Forte: background-775
            expect(COLORS_RAW).toMatch(/--text-c:\s*var\(--background-775\);/);
            // --text-d é Texto Levemente Destacado: background-750
            expect(COLORS_RAW).toMatch(/--text-d:\s*var\(--background-750\);/);
        });

        it('compila sem erros com sass', () => {
            const compiled = sass.compile(resolve(__dirname, '../../src/themes/colors.scss')).css;
            expect(compiled).toBeTruthy();
        });
    });

    describe('2. Accordion e AccordionItem', () => {
        it('MaxAccordion deve definir color: var(--background-700) como Texto Normal padrão', () => {
            const style = ACCORDION.split('<style')[1] ?? '';
            expect(style).toMatch(/color:\s*var\(--background-700\)/);
        });

        it('MaxAccordionItem deve ter cabeçalho em Texto Forte (775) e corpo em Texto Normal (700)', () => {
            const style = ACCORDION_ITEM.split('<style')[1] ?? '';
            // Header: Texto Forte (775)
            expect(style).toMatch(/\.max-accordion-item-header\s*\{[^}]*color:\s*var\(--background-775\)/);
            // Content inner: Texto Normal (700)
            expect(style).toMatch(/\.max-accordion-item-content-inner\s*\{[^}]*color:\s*var\(--background-700\)/);
        });

        it('MaxAccordionItem desabilitado deve usar Texto Fraco (650)', () => {
            const style = ACCORDION_ITEM.split('<style')[1] ?? '';
            expect(style).toMatch(/&(?:\.max-accordion-item-header-disabled|-disabled)[^}]*color:\s*var\(--background-650\)/);
        });
    });

    describe('3. MaxDrawer', () => {
        it('MaxDrawer deve definir container e close em Texto Normal (700) e título em Texto Forte (775)', () => {
            const style = DRAWER.split('<style')[1] ?? '';
            expect(style).toMatch(/\.max-drawer\s*\{[^}]*color:\s*var\(--background-700\)/);
            expect(style).toMatch(/\.max-drawer-title\s*\{[^}]*color:\s*var\(--background-775\)/);
            expect(style).toMatch(/\.max-drawer-close\s*\{[^}]*color:\s*var\(--background-700\)/);
        });
    });

    describe('4. Navegação e Menus', () => {
        it('MaxMenuVerticalItem deve usar Texto Normal (700)', () => {
            const style = MENU_VERTICAL_ITEM.split('<style')[1] ?? '';
            expect(style).toMatch(/color:\s*var\(--background-700\)/);
        });
    });

    describe('5. Estrutura e Títulos', () => {
        it('MaxGrid deve ter rótulo em Texto Levemente Destacado (750)', () => {
            const style = GRID.split('<style')[1] ?? '';
            expect(style).toMatch(/\.label-grid\s*\{[^}]*color:\s*var\(--background-750\)/);
        });

        it('MaxTitle1 e MaxTitle2 devem seguir 775 (H1) e 750 (H2/Subtitle)', () => {
            const style1 = TITLE1.split('<style')[1] ?? '';
            const style2 = TITLE2.split('<style')[1] ?? '';
            expect(style1).toMatch(/\.t1-main-text\s*\{[^}]*color:\s*var\(--background-775\)/);
            expect(style1).toMatch(/\.t2-main-text\s*\{[^}]*color:\s*var\(--background-750\)/);
            expect(style2).toMatch(/\.text-h1\s*\{[^}]*color:\s*var\(--background-775\)/);
            expect(style2).toMatch(/\.text-h2\s*\{[^}]*color:\s*var\(--background-750\)/);
        });
    });

    describe('6. Formulários e Inputs', () => {
        it('InputBase deve unificar desabilitados em Texto Fraco (650) e placeholder em 650', () => {
            const style = INPUT_BASE.split('<style')[1] ?? '';
            expect(style).toMatch(/placeholder\s*\{[^}]*color:\s*var\(--background-650\)/);
            expect(style).toMatch(/\[disabled\][^}]*color:\s*var\(--background-650\)\s*!important/);
        });

        it('MaxInputToggle deve ter label superior em Texto Levemente Destacado (750) e label inline em Texto Normal (700)', () => {
            const style = TOGGLE.split('<style')[1] ?? '';
            expect(style).toMatch(/\.input-toggle-field-label-div\s*\{[^}]*color:\s*var\(--background-750\)/);
            expect(style).toMatch(/\.input-toggle-field-label\s*\{[^}]*color:\s*var\(--background-700\)/);
        });

        it('MaxChips deve usar Texto Normal (700) no token e Texto Fraco (650) no placeholder', () => {
            const style = CHIPS.split('<style')[1] ?? '';
            expect(style).toMatch(/\.max-chip-token\s*\{[^}]*color:\s*var\(--background-700\)/);
            expect(style).toMatch(/placeholder\s*\{[^}]*color:\s*var\(--background-650\)/);
        });

        it('MaxTableFields deve manter empty-cell em Texto Fraco (650)', () => {
            const style = TABLE_FIELDS.split('<style')[1] ?? '';
            expect(style).toMatch(/\.max-table-fields-empty-cell\s*\{[^}]*color:\s*var\(--background-650\)/);
        });

        it('MaxInputFileUploadButton deve usar Texto Normal (700) nos labels principais', () => {
            const style = FILE_UPLOAD_BUTTON.split('<style')[1] ?? '';
            expect(style).toMatch(/\.input-file-button-label\s*\{[^}]*color:\s*var\(--background-700\)/);
            expect(style).toMatch(/\.label-file-upload\s*\{[^}]*color:\s*var\(--background-700\)/);
        });

        it('MaxBaseInput deve usar Texto Fraco (650) no placeholder', () => {
            const style = BASE_INPUT.split('<style')[1] ?? '';
            expect(style).toMatch(/placeholder\s*\{[^}]*color:\s*var\(--background-650\)/);
        });

        it('MaxInputAutoComplete e MaxInputAutoCompleteApi devem usar Texto Normal (700) e Texto Fraco (650) para sublabels', () => {
            const acStyle = AUTOCOMPLETE.split('<style')[1] ?? '';
            const apiStyle = AUTOCOMPLETE_API.split('<style')[1] ?? '';

            expect(acStyle).toMatch(/\.max-autocomplete-input\s*\{[^}]*color:\s*var\(--background-700\)/);
            expect(acStyle).toMatch(/\.autocomplete-item-select-label\s*\{[^}]*color:\s*var\(--background-700\)/);
            expect(acStyle).toMatch(/\.autocomplete-item-select-sub-label\s*\{[^}]*color:\s*var\(--background-650\)/);

            expect(apiStyle).toMatch(/\.max-autocomplete-input\s*\{[^}]*color:\s*var\(--background-700\)/);
            expect(apiStyle).toMatch(/\.autocomplete-item-select-label\s*\{[^}]*color:\s*var\(--background-700\)/);
            expect(apiStyle).toMatch(/\.autocomplete-item-select-sub-label\s*\{[^}]*color:\s*var\(--background-650\)/);
        });

        it('MaxInputDatePicker deve usar 700 para input e dias, 775 para título e 650 para dias da semana', () => {
            const style = DATE_PICKER.split('<style')[1] ?? '';
            expect(style).toMatch(/\.max-datepicker-title\s*\{[^}]*color:\s*var\(--background-775\)/);
            expect(style).toMatch(/\.max-datepicker-weekdays\s*\{[^}]*color:\s*var\(--background-650\)/);
            expect(style).toMatch(/\.max-datepicker-day\s*\{[^}]*color:\s*var\(--background-700\)/);
        });

        it('MaxInputMarkdown deve usar 700 para texto normal, 650 para placeholder, 775 para headings e 750 para th', () => {
            const style = MARKDOWN.split('<style')[1] ?? '';
            expect(style).toMatch(/\.max-input-markdown__prosemirror\s*\{[^}]*color:\s*var\(--background-700\)/);
            expect(style).toMatch(/color:\s*var\(--background-650\)/);
            expect(style).toMatch(/h1,\s*h2,\s*h3,\s*h4,\s*h5,\s*h6\s*\{[^}]*color:\s*var\(--background-775\)/);
            expect(style).toMatch(/th\s*\{[^}]*color:\s*var\(--background-750\)/);
        });

        it('MaxInputOTP deve usar Texto Fraco (650) para separador, placeholder e disabled, e Texto Levemente Destacado (750) para dígitos', () => {
            const style = OTP.split('<style')[1] ?? '';
            expect(style).toMatch(/\.max-input-otp-separator\s*\{[^}]*color:\s*var\(--background-650\)/);
            expect(style).toMatch(/\.max-input-otp-cell\s*\{[^}]*color:\s*var\(--background-750\)/);
            expect(style).toMatch(/::placeholder\s*\{[^}]*color:\s*var\(--background-650\)/);
            expect(style).toMatch(/&:disabled\s*\{[^}]*color:\s*var\(--background-650\)/);
        });

        it('MaxListBox deve usar Texto Normal (700) no item regular e Texto Fraco (650) na sublabel', () => {
            const style = LISTBOX.split('<style')[1] ?? '';
            expect(style).toMatch(/\.max-listbox-item\s*\{[\s\S]*?color:\s*var\(--background-700\);/);
            expect(style).toMatch(/\.max-listbox-item-sublabel\s*\{[^}]*color:\s*var\(--background-650\)/);
            expect(style).toMatch(/\.max-listbox-filter-input\s*\{[^}]*color:\s*var\(--background-700\)/);
        });
    });

    describe('7. Abas e Componentes Auxiliares', () => {
        it('MaxTabItem deve usar Texto Normal (700) inativo, Texto Forte (775) ativo/hover e Texto Fraco (650) disabled', () => {
            const style = TAB_ITEM.split('<style')[1] ?? '';
            expect(style).toMatch(/\.max-tab-item-title\s*\{[^}]*color:\s*var\(--background-700\)/);
            expect(style).toMatch(/&:hover\s*\{[^}]*color:\s*var\(--background-775\)/);
            expect(style).toMatch(/&\[active='true'\]\s*\{[^}]*color:\s*var\(--background-775\)/);
            expect(style).toMatch(/&\[disabled\]\s*\{[^}]*color:\s*var\(--background-650\)/);
        });

        it('MaxEmptyDiv deve usar Texto Fraco (650) no container e no ícone', () => {
            const style = EMPTY_DIV.split('<style')[1] ?? '';
            expect(style).toMatch(/\.max-empty-div\s*\{[^}]*color:\s*var\(--background-650\)/);
            expect(style).toMatch(/\.icon-div\s*\{[^}]*color:\s*var\(--background-650\)/);
        });

        it('MaxSideMenuMobile deve usar Texto Normal (700) no item, 750 no título do grupo, 775 no nome e 650 na versão', () => {
            const style = SIDE_MENU_MOBILE.split('<style')[1] ?? '';
            expect(style).toMatch(/\.mobile-profile-name\s*\{[^}]*color:\s*var\(--background-775\)/);
            expect(style).toMatch(/\.mobile-group-title\s*\{[^}]*color:\s*var\(--background-750\)/);
            expect(style).toMatch(/\.mobile-menu-item\s*\{[^}]*color:\s*var\(--background-700\)/);
            expect(style).toMatch(/\.mobile-app-version\s*\{[^}]*color:\s*var\(--background-650\)/);
        });
    });
});
