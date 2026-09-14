import { describe, it, expect, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import MaxLoader from '../../src/components/MaxLoader.vue';
import MaxLoaderAi from '../../src/components/MaxLoaderAi.vue';
import MaxLoaderIcon from '../../src/components/MaxLoaderIcon.vue';
import MaxDoneIcon from '../../src/components/MaxDoneIcon.vue';
import MaxWaitIcon from '../../src/components/MaxWaitIcon.vue';
import MaxErrorIcon from '../../src/components/MaxErrorIcon.vue';

// Mock do DotLottieVue para evitar dependência externa em testes
vi.mock('@lottiefiles/dotlottie-vue', () => ({
    DotLottieVue: {
        template: '<div class="mock-dot-lottie"></div>'
    }
}));

describe('IconsAndLoaders - Semântica de Acessibilidade e Renderização', () => {
    describe('MaxLoader', () => {
        it('expõe role="status", aria-live="polite" e aria-busy="true" por padrão', () => {
            const wrapper = mount(MaxLoader);
            const root = wrapper.find('.max-loader-main-div');

            expect(root.exists()).toBe(true);
            expect(root.attributes('role')).toBe('status');
            expect(root.attributes('aria-live')).toBe('polite');
            expect(root.attributes('aria-busy')).toBe('true');
        });

        it('não sobrescreve ARIA fornecido explicitamente pelo consumidor', () => {
            const wrapper = mount(MaxLoader, {
                attrs: {
                    role: 'progressbar',
                    'aria-live': 'assertive',
                    'aria-busy': 'false',
                    'aria-label': 'Progresso customizado'
                }
            });
            const root = wrapper.find('.max-loader-main-div');

            expect(root.attributes('role')).toBe('progressbar');
            expect(root.attributes('aria-live')).toBe('assertive');
            expect(root.attributes('aria-busy')).toBe('false');
            expect(root.attributes('aria-label')).toBe('Progresso customizado');
        });

        it('associa label ao aria-label padrão quando não houver aria-label no consumidor', () => {
            const wrapper = mount(MaxLoader, {
                props: {
                    label: 'Salvando alterações...'
                }
            });
            const root = wrapper.find('.max-loader-main-div');

            expect(root.attributes('aria-label')).toBe('Salvando alterações...');
            expect(wrapper.find('.item-label').text()).toBe('Salvando alterações...');
        });
    });

    describe('MaxLoaderAi', () => {
        it('expõe role="status", aria-live="polite" e aria-busy="true" por padrão', async () => {
            const wrapper = mount(MaxLoaderAi);
            await flushPromises();

            const root = wrapper.find('.max-loader-ai');
            expect(root.exists()).toBe(true);
            expect(root.attributes('role')).toBe('status');
            expect(root.attributes('aria-live')).toBe('polite');
            expect(root.attributes('aria-busy')).toBe('true');
        });

        it('preserva atributos de ARIA do consumidor sem sobrescrever', async () => {
            const wrapper = mount(MaxLoaderAi, {
                attrs: {
                    role: 'region',
                    'aria-label': 'IA pensando...',
                    'aria-live': 'off'
                }
            });
            await flushPromises();

            const root = wrapper.find('.max-loader-ai');
            expect(root.attributes('role')).toBe('region');
            expect(root.attributes('aria-label')).toBe('IA pensando...');
            expect(root.attributes('aria-live')).toBe('off');
        });
    });

    describe('MaxLoaderIcon', () => {
        it('renderiza SVG com animação de rotação e atributos repassados', () => {
            const wrapper = mount(MaxLoaderIcon, {
                attrs: {
                    'data-testid': 'custom-loader-icon'
                }
            });

            expect(wrapper.classes()).toContain('max-loader-icon-div');
            expect(wrapper.find('svg').exists()).toBe(true);
            expect(wrapper.attributes('data-testid')).toBe('custom-loader-icon');
        });
    });

    describe('Ícones de Feedback Terminal', () => {
        it('renderiza MaxDoneIcon, MaxWaitIcon e MaxErrorIcon corretamente', () => {
            const doneWrapper = mount(MaxDoneIcon);
            expect(doneWrapper.exists()).toBe(true);

            const waitWrapper = mount(MaxWaitIcon);
            expect(waitWrapper.exists()).toBe(true);

            const errorWrapper = mount(MaxErrorIcon);
            expect(errorWrapper.exists()).toBe(true);
        });
    });
});
