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
        mount(MaxPageContent, {
            global: { plugins: [pinia] },
            slots: {
                default: '<div>Teste</div>'
            }
        });

        const store = useSystemStore();
        expect(store).toBeDefined();
        expect(store.content_page_size).toBeDefined();
    });

    it('utiliza o token semântico --layout-content-frame-bg e não referencia --blue-800 (E10-06)', async () => {
        const fs = await import('node:fs');
        const path = await import('node:path');
        const sfc = fs.readFileSync(path.resolve(__dirname, '../../src/components/MaxPageContent.vue'), 'utf-8');

        expect(sfc).toContain('var(--layout-content-frame-bg');
        expect(sfc).not.toContain('var(--blue-800)');
    });

    it('define --layout-content-frame-bg de forma estável no tema claro e escuro em colors.scss (E10-06)', async () => {
        const fs = await import('node:fs');
        const path = await import('node:path');
        const colors = fs.readFileSync(path.resolve(__dirname, '../../src/themes/colors.scss'), 'utf-8');

        // Garante que o token existe em ambos os blocos
        const lightBlock = colors.split(':root.dark')[0];
        const darkBlock = colors.split(':root.dark')[1] ?? '';

        expect(lightBlock).toMatch(/--layout-content-frame-bg:\s*#004860;/);
        expect(darkBlock).toMatch(/--layout-content-frame-bg:\s*#004860;/);

        // Garante que a moldura nunca resolve para quase branco no dark (#EEF8FB)
        expect(darkBlock).not.toMatch(/--layout-content-frame-bg:\s*#EEF8FB;/i);
    });
});
