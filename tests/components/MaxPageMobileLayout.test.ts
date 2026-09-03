import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import type { Pinia } from 'pinia';
import { setActivePinia, createPinia } from 'pinia';
import { reactive, ref } from 'vue';

const route = reactive<Record<string, any>>({ name: 'board', query: {}, params: {} });
const push = vi.fn();

vi.mock('vue-router', async (importOriginal) => ({
    ...(await importOriginal<Record<string, any>>()),
    useRoute: () => route,
    useRouter: () => ({ push })
}));

const menusRef = ref<any>(null);

vi.mock('@maxvue/max-use', async (importOriginal) => ({
    ...(await importOriginal<Record<string, any>>()),
    useRefCachedApi: () => menusRef
}));

import MaxPageMobileLayout from '../../src/components/MaxPageMobileLayout.vue';
import MaxTopMenu from '../../src/components/MaxTopMenu.vue';
import MaxBottomMenu from '../../src/components/MaxBottomMenu.vue';
import MaxSideMenuMobile from '../../src/components/MaxSideMenuMobile.vue';
import { useUserStore } from '../../src/stores/useUser.Store';
import { useSystemStore } from '../../src/stores/useSystem.Store';

let pinia: Pinia;

const mountWithPinia = (component: any, options: Record<string, any> = {}) => mount(component, {
    ...options,
    global: {
        ...(options.global ?? {}),
        plugins: [pinia],
        stubs: {
            teleport: true,
            MaxLogo: { template: '<div class="max-logo-stub" />' },
            ...(options.global?.stubs ?? {})
        }
    }
});

describe('MaxPageMobileLayout', () => {
    beforeEach(() => {
        pinia = createPinia();
        setActivePinia(pinia);
        route.name = 'board';
        menusRef.value = null;
        useUserStore().data = { id: 1, name: 'Maria' };
    });

    it('renderiza os componentes estruturais do layout mobile', () => {
        const wrapper = mountWithPinia(MaxPageMobileLayout);

        expect(wrapper.find('.container-app-mobile').exists()).toBe(true);
        expect(wrapper.findComponent(MaxTopMenu).exists()).toBe(true);
        expect(wrapper.find('.mobile-page-content').exists()).toBe(true);
        expect(wrapper.findComponent(MaxBottomMenu).exists()).toBe(true);
        expect(wrapper.findComponent(MaxSideMenuMobile).exists()).toBe(true);
    });

    it('renderiza o conteúdo padrão no slot do miolo', () => {
        const wrapper = mountWithPinia(MaxPageMobileLayout, {
            slots: { default: '<div class="conteudo-pagina">Meu Conteúdo</div>' }
        });

        expect(wrapper.find('.mobile-page-content .conteudo-pagina').text()).toBe('Meu Conteúdo');
    });

    it.each(['status', 'search', 'add', 'chat', 'notifications', 'voip', 'live', 'mobile-center', 'mobile-actions'])('repassa o slot %s para o TopMenu', (slot) => {
        const wrapper = mountWithPinia(MaxPageMobileLayout, {
            slots: { [slot]: `<div class="slot-${slot}">x</div>` }
        });

        expect(wrapper.find(`.slot-${slot}`).exists()).toBe(true);
    });

    it('renderiza o slot bugs em um container flutuante e arrastável fora do TopMenu', () => {
        const wrapper = mountWithPinia(MaxPageMobileLayout, {
            slots: { bugs: '<div class="meu-bug-report">Reportar</div>' }
        });

        const draggableEl = wrapper.find('.mobile-bug-draggable');
        expect(draggableEl.exists()).toBe(true);
        expect(draggableEl.find('.meu-bug-report').exists()).toBe(true);
        expect(wrapper.findComponent(MaxTopMenu).find('.meu-bug-report').exists()).toBe(false);
    });

    it('repassa o slot switcher para o SideMenuMobile', () => {
        useSystemStore().side_menu_open = true;

        const wrapper = mountWithPinia(MaxPageMobileLayout, {
            slots: { switcher: '<div class="slot-switcher">Perfil Switcher</div>' }
        });

        expect(wrapper.find('.slot-switcher').exists()).toBe(true);
    });

    it('repassa props para o MaxBottomMenu', () => {
        const addItems = [{ label: 'Novo Item', icon: 'mdi:plus', route: 'novo' }];
        const bottomTabs = [{ name: 'inicio', label: 'Início', icon: 'mdi:home' }];

        const wrapper = mountWithPinia(MaxPageMobileLayout, {
            props: { addItems, bottomTabs, bottomShowLabels: true }
        });

        const bottomMenu = wrapper.findComponent(MaxBottomMenu);
        expect(bottomMenu.props('addItems')).toEqual(addItems);
        expect(bottomMenu.props('tabs')).toEqual(bottomTabs);
        expect(bottomMenu.props('showLabels')).toBe(true);
    });

    it.each(['logout', 'profile', 'settings', 'support', 'toggleDarkMode', 'endImpersonate'])(
        'propaga o evento %s disparado pelo TopMenu',
        async (evento) => {
            const wrapper = mountWithPinia(MaxPageMobileLayout);
            wrapper.findComponent(MaxTopMenu).vm.$emit(evento);
            await wrapper.vm.$nextTick();

            expect(wrapper.emitted(evento)).toHaveLength(1);
        }
    );
});
