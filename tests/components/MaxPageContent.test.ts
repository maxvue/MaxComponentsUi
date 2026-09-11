import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxPageContent from '../../src/components/MaxPageContent.vue';
import { useSystemStore } from '../../src/stores/useSystem.Store';

let pinia: any;

describe('MaxPageContent', () => {
    beforeEach(() => {
        pinia = createPinia();
        setActivePinia(pinia);
    });

    it('renderiza com as classes semânticas max-page-content e pane1', () => {
        const wrapper = mount(MaxPageContent, {
            global: { plugins: [pinia] },
            slots: {
                default: '<div class="page-body">Conteúdo da Página</div>'
            }
        });

        expect(wrapper.classes()).toContain('max-page-content');
        expect(wrapper.classes()).toContain('board_page_content_main_div');
        expect(wrapper.find('.pane1').exists()).toBe(true);
        expect(wrapper.find('.page-body').text()).toBe('Conteúdo da Página');
    });

    it('repassa atributos de tela como screen="mobile" ao elemento raiz', () => {
        const wrapper = mount(MaxPageContent, {
            global: { plugins: [pinia] },
            attrs: {
                screen: 'mobile'
            }
        });

        expect(wrapper.attributes('screen')).toBe('mobile');
    });

    it('integra com a useSystemStore preservando o estado inicial', () => {
        const store = useSystemStore();
        expect(store).toBeDefined();

        mount(MaxPageContent, {
            global: { plugins: [pinia] },
            slots: {
                default: '<div>Teste</div>'
            }
        });

        expect(store.content_page_size).toBeDefined();
    });
});
