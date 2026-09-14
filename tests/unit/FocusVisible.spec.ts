import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxButton from '../../src/components/MaxButton.vue';
import MaxIconButton from '../../src/components/MaxIconButton.vue';
import fs from 'node:fs';
import path from 'node:path';

function mountButton(props: Record<string, any> = {}) {
    return mount(MaxButton, {
        props: { label: 'Ação', ...props },
        global: {
            stubs: {
                MaxIcon: {
                    template: '<span class="max-icon-stub"></span>',
                    props: ['icon', 'size']
                }
            }
        }
    });
}

describe('Indicadores de Foco Visível (:focus-visible)', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    describe('MaxButton - Suporte e classes para variantes de foco', () => {
        it('renderiza botão sólido com tag nativa <button> e classes semânticas', () => {
            const wrapper = mountButton({ severity: 'primary' });
            expect(wrapper.element.tagName.toLowerCase()).toBe('button');
            expect(wrapper.classes()).toContain('max-button');
            expect(wrapper.element.tabIndex).toBe(0);
        });

        it('renderiza variante outlined com classe max-button-outlined', () => {
            const wrapper = mountButton({ variant: 'outlined' });
            expect(wrapper.classes()).toContain('max-button-outlined');
        });

        it('renderiza variante text com classe max-button-text', () => {
            const wrapper = mountButton({ variant: 'text' });
            expect(wrapper.classes()).toContain('max-button-text');
        });

        it('renderiza variante link com classe max-button-link', () => {
            const wrapper = mountButton({ variant: 'link' });
            expect(wrapper.classes()).toContain('max-button-link');
        });

        it('renderiza variante dashed com classe max-button-dashed sem anular foco', () => {
            const wrapper = mountButton({ dashed: true });
            expect(wrapper.classes()).toContain('max-button-dashed');
        });

        it('todas as severidades de botões mantêm elemento nativo de foco', () => {
            const severities = ['secondary', 'success', 'info', 'warning', 'danger', 'contrast', 'whatsapp'] as const;
            for (const severity of severities) {
                const wrapper = mountButton({ severity });
                expect(wrapper.classes()).toContain(`max-button-${severity}`);
                expect(wrapper.element.tagName.toLowerCase()).toBe('button');
            }
        });
    });

    describe('Validação estática de CSS/SCSS para :focus-visible', () => {
        it('MaxButton.vue declara regras :focus-visible com token canônico de anel de foco', () => {
            const filePath = path.resolve(__dirname, '../../src/components/MaxButton.vue');
            const fileContent = fs.readFileSync(filePath, 'utf-8');

            expect(fileContent).toContain('&:focus-visible');
            expect(fileContent).toContain('--max-focus-ring-color');
            // Garante que .max-button-dashed não neutraliza o foco com &:focus
            expect(fileContent).not.toMatch(/&\.max-button-dashed[\s\S]*?&:focus\s*\{/);
        });

        it('MaxIconButton.vue declara regras :focus-visible com token canônico de foco', () => {
            const filePath = path.resolve(__dirname, '../../src/components/MaxIconButton.vue');
            const fileContent = fs.readFileSync(filePath, 'utf-8');

            expect(fileContent).toContain('&:focus-visible');
            expect(fileContent).toContain('--max-focus-ring-color');
        });

        it('MaxAccordionItem.vue declara :focus-visible no cabeçalho interativo', () => {
            const filePath = path.resolve(__dirname, '../../src/components/MaxAccordionItem.vue');
            const fileContent = fs.readFileSync(filePath, 'utf-8');

            expect(fileContent).toContain('&:focus-visible');
            expect(fileContent).toContain('--max-focus-outline');
        });

        it('MaxListBox.vue declara :focus-visible com tokens canônicos de foco', () => {
            const filePath = path.resolve(__dirname, '../../src/components/MaxListBox.vue');
            const fileContent = fs.readFileSync(filePath, 'utf-8');

            expect(fileContent).toContain('&:focus-visible');
            expect(fileContent).toContain('--max-focus-outline');
        });

        it('InputBase.vue declara foco com tokens canônicos no field wrapper e no label', () => {
            const filePath = path.resolve(__dirname, '../../src/components/InputBase.vue');
            const fileContent = fs.readFileSync(filePath, 'utf-8');

            expect(fileContent).toContain('&:focus-within');
            expect(fileContent).toContain('--max-focus-ring-color');
            expect(fileContent).toContain('&:has(.max-input-field-div:focus-within) .max-input-label');
        });

        it('src/themes/_focus.scss fornece mixin canônico @mixin max-focus-visible', () => {
            const filePath = path.resolve(__dirname, '../../src/themes/_focus.scss');
            const fileContent = fs.readFileSync(filePath, 'utf-8');

            expect(fileContent).toContain('@mixin max-focus-visible');
            expect(fileContent).toContain('--max-focus-ring-color');
            expect(fileContent).toContain('--max-focus-outline');
        });
    });

    describe('MaxIconButton - Acessibilidade de foco por teclado', () => {
        it('renderiza elemento button nativo com tabindex acessível', () => {
            const wrapper = mount(MaxIconButton, {
                props: { icon: 'mdi:pencil', ariaLabel: 'Editar' },
                global: {
                    stubs: {
                        MaxIcon: { template: '<span></span>' }
                    }
                }
            });
            expect(wrapper.element.tagName.toLowerCase()).toBe('button');
            expect(wrapper.element.tabIndex).toBe(0);
        });
    });

    describe('Inventário Global de Elementos Focáveis e Indicadores Visíveis (R16 / E10-04)', () => {
        const componentsDir = path.resolve(__dirname, '../../src/components');

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

        it('todos os componentes interativos do design system possuem regras de foco visível', () => {
            const vueFiles = getVueFiles(componentsDir);
            const interactiveComponents = [
                'MaxButton.vue',
                'MaxIconButton.vue',
                'MaxBadgeButton.vue',
                'MaxAccordionItem.vue',
                'MaxListBox.vue',
                'InputBase.vue',
                'MaxTable.vue',
                'MaxTopToolbar.vue',
                'MaxMenuVerticalItem.vue'
            ];

            for (const compName of interactiveComponents) {
                const filePath = vueFiles.find((f) => path.basename(f) === compName);
                expect(filePath, `Componente ${compName} deve existir`).toBeDefined();

                const content = fs.readFileSync(filePath!, 'utf-8');
                const hasFocusRule = /:(?:focus-visible|focus-within|focus)\b|--max-focus/i.test(content);
                expect(hasFocusRule, `Componente interativo ${compName} deve declarar regra de foco visível`).toBe(true);
            }
        });

        it('nenhum componente deve anular foco com outline: none sem fornecer indicador substituto', () => {
            const vueFiles = getVueFiles(componentsDir);
            const violations: string[] = [];

            // Exceções contratuais documentadas:
            // - Controles internos de input que delegam o anel de foco visível ao wrapper InputBase (que possui :focus-within)
            // - Containers de overlay/máscara com tabindex="-1" que recebem foco programático
            const documentedExceptions = new Set([
                'MaxDrawer.vue',
                'MaxImage.vue',
                'MaxTagsList.vue',
                'MaxInputAutoComplete.vue',
                'MaxInputSelect.vue',
                'MaxInputTextArea.vue',
                'MaxInputTextList.vue',
                'MaxBaseInput.vue'
            ]);

            for (const file of vueFiles) {
                const basename = path.basename(file);
                if (documentedExceptions.has(basename)) continue;

                const content = fs.readFileSync(file, 'utf-8');
                const styles = [...content.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[1]).join('\n');

                // Detecta outline: none ou outline: 0 desacompanhado de :focus-visible ou var(--max-focus
                const hasOutlineNone = /outline:\s*(?:none|0)(?:\s*!important)?/i.test(styles);
                if (hasOutlineNone) {
                    const hasFocusVisibleOrTokens = /focus-visible|--max-focus|focus-within/i.test(styles);
                    if (!hasFocusVisibleOrTokens) violations.push(basename);
                }
            }

            expect(violations, 'Nenhum componente pode ter outline: none sem indicador de foco alternativo').toEqual([]);
        });
    });
});
