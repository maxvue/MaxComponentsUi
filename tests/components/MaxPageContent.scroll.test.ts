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
        mount(MaxPageContent, {
            global: { plugins: [pinia] }
        });
        const system = useSystemStore();

        expect(system.content_page_size).toBeDefined();
    });

    it('mantém a moldura estrutural vinculada a --layout-content-frame-bg (E10-06)', async () => {
        const fs = await import('node:fs');
        const path = await import('node:path');
        const sfc = fs.readFileSync(path.resolve(__dirname, '../../src/components/MaxPageContent.vue'), 'utf-8');

        expect(sfc).toMatch(/\.board_page_content_main_div\s*\{[^}]*background-color:\s*var\(--layout-content-frame-bg/);
    });
});
