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
    });

    describe('MaxIconButton - Acessibilidade de foco por teclado', () => {
        it('renderiza elemento button nativo com tabindex acessível', () => {
            const wrapper = mount(MaxIconButton, {
                props: { icon: 'mdi:pencil' },
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
});
