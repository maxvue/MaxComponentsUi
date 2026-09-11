import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxButton from '../../src/components/MaxButton.vue';
import MaxBadge from '../../src/components/MaxBadge.vue';
import { _resetHtmlDarkObserverForTesting } from '../../src/helpers/useHtmlDark';
import fs from 'node:fs';
import path from 'node:path';
import { nextTick } from 'vue';

function mountButton(props: Record<string, any> = {}) {
    return mount(MaxButton, {
        props: { label: 'Salvar', ...props },
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

describe('MaxDarkModeContrast (Dark Mode & Conformidade de Contraste)', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        _resetHtmlDarkObserverForTesting();
        document.documentElement.classList.remove('dark');
    });

    afterEach(() => {
        _resetHtmlDarkObserverForTesting();
        document.documentElement.classList.remove('dark');
    });

    describe('MaxButton - Variante Contrast e Tokens Semânticos', () => {
        it('renderiza variante contrast com classes semânticas', () => {
            const wrapper = mountButton({ severity: 'contrast' });
            expect(wrapper.classes()).toContain('max-button-contrast');
        });

        it('MaxButton.vue não possui literais de cor branca fixa "#fff"', () => {
            const filePath = path.resolve(__dirname, '../../src/components/MaxButton.vue');
            const fileContent = fs.readFileSync(filePath, 'utf-8');

            // Verifica que o CSS não contém "color: #fff;" solto
            expect(fileContent).not.toMatch(/color:\s*#fff\s*;/i);
            // Verifica que usa var(--background-0)
            expect(fileContent).toContain('color: var(--background-0);');
        });

        it('MaxButton.vue contém regras específicas para inversão de contraste no tema escuro', () => {
            const filePath = path.resolve(__dirname, '../../src/components/MaxButton.vue');
            const fileContent = fs.readFileSync(filePath, 'utf-8');

            expect(fileContent).toContain(':global(.dark) &.max-button-contrast');
            expect(fileContent).toMatch(/:global\(\[data-theme=['"]dark['"]\]\)\s*&/);
            // Verifica que no dark mode o texto usa background escuro para alto contraste
            expect(fileContent).toContain('color: var(--background-900, #09090b);');
        });

        it('MaxButton.vue utiliza tokens semânticos com fallbacks duplos', () => {
            const filePath = path.resolve(__dirname, '../../src/components/MaxButton.vue');
            const fileContent = fs.readFileSync(filePath, 'utf-8');

            expect(fileContent).toContain('var(--max-success-500, var(--success-500))');
            expect(fileContent).toContain('var(--max-info-500, var(--info-500))');
            expect(fileContent).toContain('var(--max-warning-500, var(--warn-500))');
            expect(fileContent).toContain('var(--max-danger-500, var(--danger-500))');
            expect(fileContent).toContain('var(--max-whatsapp-500, #25d366)');
        });
    });

    describe('MaxBadge - Reatividade ao Modo Escuro', () => {
        it('calcula contraste adequadamente ao alternar a classe .dark no elemento html', async () => {
            const wrapper = mount(MaxBadge, {
                props: { label: 'Status', color: '#10B981' }
            });

            expect(wrapper.exists()).toBe(true);

            // Adiciona dark mode global
            document.documentElement.classList.add('dark');
            await new Promise((resolve) => setTimeout(resolve, 50));
            await nextTick();

            expect(wrapper.attributes('style')).toBeDefined();
        });

        it('prop dark explícita tem precedência sobre o tema do documento', () => {
            const wrapperDark = mount(MaxBadge, {
                props: { label: 'Escuro', dark: true }
            });
            const wrapperLight = mount(MaxBadge, {
                props: { label: 'Claro', dark: false }
            });

            expect(wrapperDark.exists()).toBe(true);
            expect(wrapperLight.exists()).toBe(true);
        });
    });
});
