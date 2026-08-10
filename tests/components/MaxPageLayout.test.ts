import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import type { Pinia } from 'pinia';
import { setActivePinia, createPinia } from 'pinia';
import { reactive, ref } from 'vue';

const route = reactive<Record<string, any>>({ name: 'board', query: {}, params: {} });

vi.mock('vue-router', async (importOriginal) => ({
    ...(await importOriginal<Record<string, any>>()),
    useRoute: () => route,
    useRouter: () => ({ push: vi.fn(), hasRoute: () => false, currentRoute: { value: route } })
}));

const menusRef = ref<any>(null);

vi.mock('@maxvue/max-use', async (importOriginal) => ({
    ...(await importOriginal<Record<string, any>>()),
    useRefCachedApi: () => menusRef
}));

import MaxPageLayout from '../../src/components/MaxPageLayout.vue';
import MaxContainerApp from '../../src/components/MaxContainerApp.vue';
import MaxTopMenu from '../../src/components/MaxTopMenu.vue';
import MaxSideMenu from '../../src/components/MaxSideMenu.vue';
import MaxSplitPanesContent from '../../src/components/MaxSplitPanesContent.vue';
import MaxBottomMenu from '../../src/components/MaxBottomMenu.vue';
import { useSystemStore } from '../../src/stores/useSystem.Store';

let pinia: Pinia;

const mountLayout = (options: Record<string, any> = {}) => mount(MaxPageLayout, {
    ...options,
    global: {
        ...(options.global ?? {}),
        plugins: [pinia],
        stubs: { MaxLogo: { template: '<div class="max-logo-stub" />' }, ...(options.global?.stubs ?? {}) }
    }
});

describe('MaxPageLayout', () => {
    beforeEach(() => {
        pinia = createPinia();
        setActivePinia(pinia);
        route.name = 'board';
        menusRef.value = null;
        localStorage.clear();
    });

    it('compõe container, topo, lateral e conteúdo', () => {
        const wrapper = mountLayout();

        expect(wrapper.findComponent(MaxContainerApp).exists()).toBe(true);
        expect(wrapper.findComponent(MaxTopMenu).exists()).toBe(true);
        expect(wrapper.findComponent(MaxSideMenu).exists()).toBe(true);
        expect(wrapper.findComponent(MaxSplitPanesContent).exists()).toBe(true);
    });

    it('renderiza o conteúdo da página no slot padrão', () => {
        const wrapper = mountLayout({ slots: { default: '<div class="pagina">x</div>' } });

        expect(wrapper.find('.pagina').exists()).toBe(true);
    });

    it('não exibe o menu inferior em desktop', () => {
        expect(mountLayout().findComponent(MaxBottomMenu).exists()).toBe(false);
    });

    it('exibe o menu inferior em mobile', () => {
        const wrapper = mountLayout({ attrs: { screen: 'mobile' } });

        expect(wrapper.findComponent(MaxBottomMenu).exists()).toBe(true);
    });

    it('repassa o screen aos filhos', () => {
        const wrapper = mountLayout({ attrs: { screen: 'mobile' } });

        expect(wrapper.findComponent(MaxContainerApp).attributes('screen')).toBe('mobile');
    });

    it('repassa addItems ao menu superior', () => {
        const addItems = [{ label: 'Novo Projeto', icon: 'mdi:plus', route: 'new_project' }];
        const wrapper = mountLayout({ props: { addItems } });

        expect(wrapper.findComponent(MaxTopMenu).props('addItems')).toEqual(addItems);
    });

    it('repassa bottomTabs ao menu inferior', () => {
        const bottomTabs = [{ name: 'a', label: 'Alfa', icon: 'mdi:a' }];
        const wrapper = mountLayout({ attrs: { screen: 'mobile' }, props: { bottomTabs } });

        expect(wrapper.findComponent(MaxBottomMenu).props('tabs')).toEqual(bottomTabs);
    });

    it('repassa a logo ao menu lateral', () => {
        const wrapper = mountLayout({ props: { logo: '/get_file?file=logo.svg' } });

        expect(wrapper.findComponent(MaxSideMenu).props('logo')).toBe('/get_file?file=logo.svg');
    });

    it('repassa sideVisible ao conteúdo', () => {
        const wrapper = mountLayout({ props: { sideVisible: true } });

        expect(wrapper.findComponent(MaxSplitPanesContent).props('sideVisible')).toBe(true);
    });

    it.each(['status', 'chat', 'bugs', 'notifications', 'voip', 'live'])('repassa o slot %s ao menu superior', (slot) => {
        const wrapper = mountLayout({ slots: { [slot]: `<div class="slot-${slot}">x</div>` } });

        expect(wrapper.find(`.slot-${slot}`).exists()).toBe(true);
    });

    it('repassa o slot side ao conteúdo', async () => {
        // O painel lateral exige sideVisible E espaço disponível; o split_panel
        // começa em 100, o que legitimamente o esconde.
        useSystemStore().split_panel = 70;

        const wrapper = mountLayout({
            props: { sideVisible: true },
            slots: { side: '<div class="slot-side">x</div>' }
        });
        await wrapper.vm.$nextTick();

        expect(wrapper.find('.slot-side').exists()).toBe(true);
    });

    it('permite substituir a seção de usuário', () => {
        const wrapper = mountLayout({ slots: { user: '<div class="usuario-custom">x</div>' } });

        expect(wrapper.find('.usuario-custom').exists()).toBe(true);
    });

    it('usa a busca padrão quando o slot não é informado', () => {
        const wrapper = mountLayout();

        expect(wrapper.findComponent({ name: 'MaxTopMenuSearchBar' }).exists()).toBe(true);
    });

    it('permite substituir a busca pelo slot', () => {
        const wrapper = mountLayout({ slots: { search: '<div class="busca-custom">x</div>' } });

        expect(wrapper.find('.busca-custom').exists()).toBe(true);
        expect(wrapper.findComponent({ name: 'MaxTopMenuSearchBar' }).exists()).toBe(false);
    });
});
