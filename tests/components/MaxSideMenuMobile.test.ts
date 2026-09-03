import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import type { Pinia } from 'pinia';
import { setActivePinia, createPinia } from 'pinia';
import { reactive, ref } from 'vue';

const route = reactive<Record<string, any>>({ name: 'dashboard', query: {}, params: {} });
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

import MaxSideMenuMobile from '../../src/components/MaxSideMenuMobile.vue';
import { useSystemStore } from '../../src/stores/useSystem.Store';
import { useUserStore } from '../../src/stores/useUser.Store';

let pinia: Pinia;

const mountWithPinia = (component: any, options: Record<string, any> = {}) => mount(component, {
    ...options,
    global: {
        ...(options.global ?? {}),
        plugins: [pinia],
        stubs: {
            teleport: true,
            ...(options.global?.stubs ?? {})
        }
    }
});

describe('MaxSideMenuMobile', () => {
    beforeEach(() => {
        pinia = createPinia();
        setActivePinia(pinia);
        route.name = 'dashboard';
        push.mockReset();
        menusRef.value = null;
        useSystemStore().side_menu_open = true;
    });

    it('exibe o nome e dados do usuário logado no cabeçalho', () => {
        const user = useUserStore();
        user.data = { id: 10, name: 'Carlos Silva', email: 'carlos@empresa.com' };

        const wrapper = mountWithPinia(MaxSideMenuMobile);

        expect(wrapper.text()).toContain('Carlos Silva');
        expect(wrapper.text()).toContain('carlos@empresa.com');
    });

    it('renderiza os itens de menu por grupos', () => {
        const wrapper = mountWithPinia(MaxSideMenuMobile, {
            props: {
                groups: [
                    {
                        title: 'Visão Geral',
                        items: [
                            { label: 'Início', icon: 'mdi:home', route: 'dashboard' },
                            { label: 'Extrato', icon: 'mdi:format-list-bulleted', route: 'extract' }
                        ]
                    }
                ]
            }
        });

        expect(wrapper.text()).toContain('Visão Geral');
        expect(wrapper.text()).toContain('Início');
        expect(wrapper.text()).toContain('Extrato');
        expect(wrapper.findAll('.mobile-menu-item')).toHaveLength(2);
    });

    it('marca o item ativo baseado na rota atual', () => {
        route.name = 'extract';

        const wrapper = mountWithPinia(MaxSideMenuMobile, {
            props: {
                groups: [
                    {
                        title: 'Visão Geral',
                        items: [
                            { label: 'Início', icon: 'mdi:home', route: 'dashboard' },
                            { label: 'Extrato', icon: 'mdi:format-list-bulleted', route: 'extract' }
                        ]
                    }
                ]
            }
        });

        const activeItems = wrapper.findAll('.mobile-menu-item.active');
        expect(activeItems).toHaveLength(1);
        expect(activeItems[0].text()).toContain('Extrato');
    });

    it('navega e fecha a gaveta ao clicar em um item de menu', async () => {
        const system = useSystemStore();
        system.side_menu_open = true;

        const wrapper = mountWithPinia(MaxSideMenuMobile, {
            props: {
                groups: [
                    {
                        title: 'Visão Geral',
                        items: [
                            { label: 'Início', icon: 'mdi:home', route: 'dashboard' },
                            { label: 'Projetos', icon: 'mdi:solar-panel', route: 'projects' }
                        ]
                    }
                ]
            }
        });

        const items = wrapper.findAll('.mobile-menu-item');
        await items[1].trigger('click');

        expect(push).toHaveBeenCalledWith({ name: 'projects' });
        expect(system.side_menu_open).toBe(false);
    });

    it('emite evento profile e fecha a gaveta ao clicar no cabeçalho do perfil', async () => {
        const system = useSystemStore();
        system.side_menu_open = true;

        const wrapper = mountWithPinia(MaxSideMenuMobile);
        await wrapper.find('.mobile-profile-header').trigger('click');

        expect(wrapper.emitted('profile')).toHaveLength(1);
        expect(system.side_menu_open).toBe(false);
    });

    it('emite evento logout e fecha a gaveta ao clicar no botão de sair', async () => {
        const system = useSystemStore();
        system.side_menu_open = true;

        const wrapper = mountWithPinia(MaxSideMenuMobile);
        await wrapper.find('.mobile-footer-btn.logout').trigger('click');

        expect(wrapper.emitted('logout')).toHaveLength(1);
        expect(system.side_menu_open).toBe(false);
    });

    it('emite toggleDarkMode ao clicar no botão de tema', async () => {
        const wrapper = mountWithPinia(MaxSideMenuMobile);
        await wrapper.find('.mobile-footer-btn:not(.logout)').trigger('click');

        expect(wrapper.emitted('toggleDarkMode')).toHaveLength(1);
    });

    it('renderiza o slot switcher quando fornecido', () => {
        const wrapper = mountWithPinia(MaxSideMenuMobile, {
            slots: { switcher: '<div class="profile-switcher-stub">Trocar Perfil</div>' }
        });

        expect(wrapper.find('.switcher .profile-switcher-stub').exists()).toBe(true);
        expect(wrapper.text()).toContain('Trocar Perfil');
    });

    it('configura o MaxDrawer com noPadding e baseZIndex 1000', () => {
        const wrapper = mountWithPinia(MaxSideMenuMobile);
        const drawer = wrapper.findComponent({ name: 'MaxDrawer' });

        expect(drawer.exists()).toBe(true);
        expect(drawer.props('noPadding')).toBe(true);
        expect(drawer.props('baseZIndex')).toBe(1000);
    });
});
