import { mount, flushPromises } from '@vue/test-utils';
import { describe, it, expect, vi } from 'vitest';
import MaxLoaderAi from '../../src/components/MaxLoaderAi.vue';

// Mock do DotLottieVue para evitar carregar o player web real
vi.mock('@lottiefiles/dotlottie-vue', () => ({
    DotLottieVue: {
        template: '<div class="mock-dot-lottie"></div>'
    }
}));

describe('MaxLoaderAi', () => {
    it('renderiza o loader por padrão (show=undefined)', async () => {
        const wrapper = mount(MaxLoaderAi);

        expect(wrapper.find('.loader-main-div-ai').exists()).toBe(true);
        expect(wrapper.find('.background-ai').exists()).toBe(true);

        // DotLottieVue e carregado via defineAsyncComponent: so aparece no DOM
        // depois que o import dinamico resolve.
        await flushPromises();
        expect(wrapper.find('.mock-dot-lottie').exists()).toBe(true);
    });

    it('exibe label quando fornecido via attrs', () => {
        const wrapper = mount(MaxLoaderAi, {
            attrs: {
                label: 'Processando IA...'
            }
        });

        expect(wrapper.find('.item-label').exists()).toBe(true);
        expect(wrapper.find('.item-label').text()).toBe('Processando IA...');
    });

    it('oculta quando show=false via attrs', () => {
        const wrapper = mount(MaxLoaderAi, {
            attrs: {
                show: false
            }
        });

        expect(wrapper.find('.loader-main-div-ai').exists()).toBe(false);
    });

    it('exibe quando show=true via attrs', () => {
        const wrapper = mount(MaxLoaderAi, {
            attrs: {
                show: true,
                label: 'Carregando'
            }
        });

        expect(wrapper.find('.loader-main-div-ai').exists()).toBe(true);
        expect(wrapper.find('.item-label').text()).toBe('Carregando');
    });
});
