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
import MaxPageContent from '../../src/components/MaxPageContent.vue';
import MaxBottomMenu from '../../src/components/MaxBottomMenu.vue';
import MaxPageMobileLayout from '../../src/components/MaxPageMobileLayout.vue';
import { useSystemStore } from '../../src/stores/useSystem.Store';

let pinia: Pinia;

const mountLayout = (options: Record<string, any> = {}) => mount(MaxPageLayout, {
    ...options,
    global: {
        ...(options.global ?? {}),
        plugins: [pinia],
        stubs: {
            teleport: true,
            MaxLogo: { template: '<div class="max-logo-stub" />' },
            MaxIcon: { template: '<i class="max-icon-stub" />', props: ['icon', 'size', 'color'] },
            ...(options.global?.stubs ?? {})
        }
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

    describe('desktop layout', () => {
        it('compõe container, topo, lateral e conteúdo em desktop', () => {
            const wrapper = mountLayout();

            expect(wrapper.findComponent(MaxContainerApp).exists()).toBe(true);
            expect(wrapper.findComponent(MaxTopMenu).exists()).toBe(true);
            expect(wrapper.findComponent(MaxSideMenu).exists()).toBe(true);
            expect(wrapper.findComponent(MaxPageContent).exists()).toBe(true);
            expect(wrapper.findComponent(MaxPageMobileLayout).exists()).toBe(false);
        });

        it('renderiza o conteúdo da página no slot padrão', () => {
            const wrapper = mountLayout({ slots: { default: '<div class="pagina">x</div>' } });

            expect(wrapper.find('.pagina').exists()).toBe(true);
        });

        it('não exibe o menu inferior em desktop', () => {
            expect(mountLayout().findComponent(MaxBottomMenu).exists()).toBe(false);
        });

        it('repassa addItems ao menu superior', () => {
            const addItems = [{ label: 'Novo Projeto', icon: 'mdi:plus', route: 'new_project' }];
            const wrapper = mountLayout({ props: { addItems } });

            expect(wrapper.findComponent(MaxTopMenu).props('addItems')).toEqual(addItems);
        });

        it('repassa a logo ao menu lateral', () => {
            const wrapper = mountLayout({ props: { logo: '/get_file?file=logo.svg' } });

            expect(wrapper.findComponent(MaxSideMenu).props('logo')).toBe('/get_file?file=logo.svg');
        });

        it.each(['status', 'chat', 'bugs', 'notifications', 'voip', 'live'])('repassa o slot %s ao menu superior', (slot) => {
            const wrapper = mountLayout({ slots: { [slot]: `<div class="slot-${slot}">x</div>` } });

            expect(wrapper.find(`.slot-${slot}`).exists()).toBe(true);
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

    describe('mobile layout', () => {
        it('renderiza MaxPageMobileLayout quando screen="mobile"', () => {
            const wrapper = mountLayout({ attrs: { screen: 'mobile' } });

            expect(wrapper.findComponent(MaxPageMobileLayout).exists()).toBe(true);
            expect(wrapper.findComponent(MaxContainerApp).exists()).toBe(false);
            expect(wrapper.findComponent(MaxBottomMenu).exists()).toBe(true);
        });

        it('renderiza MaxPageMobileLayout via prop screen', () => {
            const wrapper = mountLayout({ props: { screen: 'mobile' } });

            expect(wrapper.findComponent(MaxPageMobileLayout).exists()).toBe(true);
        });

        it('repassa bottomTabs e addItems ao layout mobile', () => {
            const bottomTabs = [{ name: 'a', label: 'Alfa', icon: 'mdi:a' }];
            const addItems = [{ label: 'Novo', icon: 'mdi:plus' }];

            const wrapper = mountLayout({
                props: { screen: 'mobile', bottomTabs, addItems }
            });

            const mobileLayout = wrapper.findComponent(MaxPageMobileLayout);
            expect(mobileLayout.props('bottomTabs')).toEqual(bottomTabs);
            expect(mobileLayout.props('addItems')).toEqual(addItems);
        });

        it.each(['profile', 'settings', 'support', 'toggleDarkMode', 'logout', 'endImpersonate'])(
            'propaga o evento %s do layout mobile',
            async (evento) => {
                const wrapper = mountLayout({ props: { screen: 'mobile' } });
                wrapper.findComponent(MaxPageMobileLayout).vm.$emit(evento);
                await wrapper.vm.$nextTick();

                expect(wrapper.emitted(evento)).toHaveLength(1);
            }
        );

        it('repassa a prop bottomShowLabels ao layout mobile', () => {
            const wrapper = mountLayout({
                props: { screen: 'mobile', bottomShowLabels: true }
            });

            expect(wrapper.findComponent(MaxPageMobileLayout).props('bottomShowLabels')).toBe(true);
        });

        it.each(['mobile-center', 'mobile-actions', 'switcher'])('repassa o slot mobile %s ao layout mobile', (slot) => {
            if (slot === 'switcher') useSystemStore().side_menu_open = true;

            const wrapper = mountLayout({
                props: { screen: 'mobile' },
                slots: { [slot]: `<div class="slot-${slot}">x</div>` }
            });

            expect(wrapper.find(`.slot-${slot}`).exists()).toBe(true);
        });
    });
});
