import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxTopMenuSearchBar from '../../src/components/MaxTopMenuSearchBar.vue';
import { useSearchBarStore } from '../../src/stores/useSearchBar.Store';

describe('MaxTopMenuSearchBar', () => {
    let pinia: ReturnType<typeof createPinia>;

    beforeEach(() => {
        pinia = createPinia();
        setActivePinia(pinia);
    });

    it('renderiza o campo desktop com placeholder customizado', () => {
        const wrapper = mount(MaxTopMenuSearchBar, {
            props: { placeholder: 'Buscar clientes...', screen: 'desktop' },
            global: { plugins: [pinia] }
        });

        expect(wrapper.find('.max-top-menu-search-bar').exists()).toBe(true);
        const input = wrapper.find('input');
        expect(input.attributes('placeholder')).toBe('Buscar clientes...');
    });

    it('sincroniza o valor digitado com a useSearchBarStore', async () => {
        const wrapper = mount(MaxTopMenuSearchBar, {
            props: { screen: 'desktop' },
            global: { plugins: [pinia] }
        });
        const store = useSearchBarStore();

        const input = wrapper.find('input');
        await input.setValue('Projeto Solar');

        expect(store.input_value).toBe('Projeto Solar');
    });

    it('renderiza botão mobile quando screen="mobile"', () => {
        const wrapper = mount(MaxTopMenuSearchBar, {
            props: { screen: 'mobile' },
            global: {
                plugins: [pinia],
                stubs: {
                    Teleport: true
                }
            }
        });

        expect(wrapper.find('.search-top-bar-mobile').exists()).toBe(true);
        expect(wrapper.find('.max-top-menu-search-bar').exists()).toBe(false);
    });

    it('abre e fecha o painel de busca no modo mobile', async () => {
        const wrapper = mount(MaxTopMenuSearchBar, {
            props: { screen: 'mobile' },
            global: {
                plugins: [pinia],
                stubs: {
                    Teleport: true
                }
            }
        });

        const btn = wrapper.find('.search-top-bar-mobile .max-icon-button');
        expect(btn.exists()).toBe(true);
        await btn.trigger('click');

        expect(wrapper.find('.mobile-search-panel').exists()).toBe(true);

        const closeBtn = wrapper.find('.btn-close-search');
        if (closeBtn.exists()) {
            await closeBtn.trigger('click');
            expect(wrapper.find('.mobile-search-panel').exists()).toBe(false);
        }
    });
});
