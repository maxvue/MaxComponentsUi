import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import type { Pinia } from 'pinia';
import { setActivePinia, createPinia } from 'pinia';
import { reactive } from 'vue';

const route = reactive<Record<string, any>>({ name: 'board', query: {}, params: {} });

vi.mock('vue-router', async (importOriginal) => ({
    ...(await importOriginal<Record<string, any>>()),
    useRoute: () => route,
    useRouter: () => ({ push: vi.fn(), hasRoute: () => false, currentRoute: { value: route } })
}));

import MaxSplitPanesContent from '../../src/components/MaxSplitPanesContent.vue';
import { useSystemStore } from '../../src/stores/useSystem.Store';

let pinia: Pinia;

const mountWithPinia = (options: Record<string, any> = {}) => mount(MaxSplitPanesContent, {
    ...options,
    global: { ...(options.global ?? {}), plugins: [pinia] }
});

describe('MaxSplitPanesContent', () => {
    beforeEach(() => {
        pinia = createPinia();
        setActivePinia(pinia);
        localStorage.clear();
    });

    it('renderiza o conteúdo principal no slot padrão', () => {
        const wrapper = mountWithPinia({ slots: { default: '<div class="conteudo">x</div>' } });

        expect(wrapper.find('.conteudo').exists()).toBe(true);
    });

    it('renderiza o painel principal', () => {
        expect(mountWithPinia().find('#panel1').exists()).toBe(true);
    });

    it('não renderiza o painel lateral por padrão', () => {
        const wrapper = mountWithPinia({ slots: { side: '<div class="lateral">x</div>' } });

        expect(wrapper.find('#panel2').exists()).toBe(false);
        expect(wrapper.find('.lateral').exists()).toBe(false);
    });

    it('renderiza o painel lateral quando sideVisible é verdadeiro', async () => {
        const system = useSystemStore();
        system.split_panel = 70;

        const wrapper = mountWithPinia({
            props: { sideVisible: true },
            slots: { side: '<div class="lateral">x</div>' }
        });
        await wrapper.vm.$nextTick();

        expect(wrapper.find('#panel2').exists()).toBe(true);
        expect(wrapper.find('.lateral').exists()).toBe(true);
    });

    it('oculta o painel lateral quando o principal ocupa tudo', async () => {
        const system = useSystemStore();
        system.split_panel = 100;

        const wrapper = mountWithPinia({
            props: { sideVisible: true },
            slots: { side: '<div class="lateral">x</div>' }
        });
        await wrapper.vm.$nextTick();

        // 100 - 100 = 0: o painel não deve reservar espaço.
        expect(wrapper.find('#panel2').exists()).toBe(false);
    });

    it('usa o split_panel da store como tamanho do painel principal', async () => {
        const system = useSystemStore();
        system.split_panel = 60;

        const wrapper = mountWithPinia({ props: { sideVisible: true } });
        await wrapper.vm.$nextTick();

        expect(wrapper.find('#panel1').attributes('style')).toContain('60');
    });

    it('atualiza a store ao redimensionar', async () => {
        const system = useSystemStore();
        const wrapper = mountWithPinia();

        (wrapper.vm as any).onResize({ prevPane: { size: 42 } });
        await wrapper.vm.$nextTick();

        expect(system.split_panel).toBe(42);
    });

    it('aplica a classe do contêiner principal', () => {
        expect(mountWithPinia().find('.board_page_content_main_div').exists()).toBe(true);
    });
});
