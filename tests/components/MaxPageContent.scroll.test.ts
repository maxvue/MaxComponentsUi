import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import type { Pinia } from 'pinia';
import { setActivePinia, createPinia } from 'pinia';
import MaxPageContent from '../../src/components/MaxPageContent.vue';
import { useSystemStore } from '../../src/stores/useSystem.Store';

let pinia: Pinia;

describe('MaxPageContent - Scroll e Layout do Conteúdo', () => {
    beforeEach(() => {
        pinia = createPinia();
        setActivePinia(pinia);
    });

    it('renderiza o painel principal e repassa o slot', () => {
        const wrapper = mount(MaxPageContent, {
            global: { plugins: [pinia] },
            slots: { default: '<div class="meu-conteudo-longo">Formulário Longo</div>' }
        });

        expect(wrapper.find('.board_page_content_main_div').exists()).toBe(true);
        expect(wrapper.find('.pane1').exists()).toBe(true);
        expect(wrapper.find('.meu-conteudo-longo').text()).toBe('Formulário Longo');
    });

    it('atualiza o content_page_size na store useSystemStore', () => {
        const system = useSystemStore();
        mount(MaxPageContent, {
            global: { plugins: [pinia] }
        });

        expect(system.content_page_size).toBeDefined();
    });
});
