import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { reactive } from 'vue';

const route = reactive<Record<string, any>>({ name: 'dashboard', path: '/dashboard' });
const push = vi.fn();

vi.mock('vue-router', () => ({
    useRoute: () => route,
    useRouter: () => ({ push })
}));

const mockGoToRoute = vi.fn();
vi.mock('@maxvue/max-use', async () => {
    const actual = await vi.importActual<any>('@maxvue/max-use');
    return {
        ...actual,
        goToRoute: (...args: any[]) => mockGoToRoute(...args)
    };
});

import MaxSideMenuFlyout from '../../src/components/MaxSideMenuFlyout.vue';
import type { SideMenuItem } from '../../src/types/app';

describe('MaxSideMenuFlyout', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockGoToRoute.mockReset();
        push.mockReset();
        route.name = 'dashboard';
        route.path = '/dashboard';
    });

    const mockItem: SideMenuItem = {
        id: 'crm',
        details: {
            title: 'Clientes',
            icon: 'mdi:account-group',
            route: 'clients_index'
        },
        subitems: [
            { id: 'sub-1', label: 'Lista de Clientes', route: 'clients_list' },
            { id: 'sub-2', label: 'Novo Cliente', route: 'clients_create' }
        ]
    };

    it('não renderiza nada quando visible é false', () => {
        const wrapper = mount(MaxSideMenuFlyout, {
            props: { visible: false, item: mockItem },
            global: { stubs: { MaxIcon: true } }
        });

        expect(wrapper.find('.max-side-menu-flyout').exists()).toBe(false);
        expect(wrapper.find('.max-side-menu-flyout-backdrop').exists()).toBe(false);
    });

    it('renderiza o painel panel0, cabeçalho e opções sem backdrop por padrão quando visible é true', () => {
        const wrapper = mount(MaxSideMenuFlyout, {
            props: { visible: true, item: mockItem },
            global: { stubs: { MaxIcon: true } }
        });

        expect(wrapper.find('.max-side-menu-flyout-backdrop').exists()).toBe(false);
        expect(wrapper.find('.max-side-menu-flyout').exists()).toBe(true);
        expect(wrapper.find('.max-side-menu-flyout').classes()).toContain('panel0');
        expect(wrapper.find('.flyout-title').text()).toBe('Clientes');
        expect(wrapper.findAll('.flyout-item')).toHaveLength(3); // 1 visão geral + 2 subitens
    });

    it('renderiza backdrop e emite close ao clicar nele quando backdrop é true', async () => {
        const wrapper = mount(MaxSideMenuFlyout, {
            props: { visible: true, item: mockItem, backdrop: true },
            global: { stubs: { MaxIcon: true } }
        });

        expect(wrapper.find('.max-side-menu-flyout-backdrop').exists()).toBe(true);
        await wrapper.find('.max-side-menu-flyout-backdrop').trigger('click');
        expect(wrapper.emitted('close')).toHaveLength(1);
    });

    it('emite close ao clicar no botão de fechar', async () => {
        const wrapper = mount(MaxSideMenuFlyout, {
            props: { visible: true, item: mockItem },
            global: { stubs: { MaxIcon: true } }
        });

        await wrapper.find('.flyout-close-btn').trigger('click');
        expect(wrapper.emitted('close')).toHaveLength(1);
    });

    it('emite close ao pressionar a tecla Escape', async () => {
        const wrapper = mount(MaxSideMenuFlyout, {
            props: { visible: true, item: mockItem },
            global: { stubs: { MaxIcon: true } }
        });

        await wrapper.find('.max-side-menu-flyout').trigger('keydown.esc');
        expect(wrapper.emitted('close')).toHaveLength(1);
    });

    it('emite close e executa navegação ao clicar em subitem', async () => {
        const wrapper = mount(MaxSideMenuFlyout, {
            props: { visible: true, item: mockItem },
            global: { stubs: { MaxIcon: true } }
        });

        const subitemEl = wrapper.findAll('.flyout-item')[1]; // 'Lista de Clientes'
        await subitemEl.trigger('click');

        expect(wrapper.emitted('select')).toHaveLength(1);
        expect(wrapper.emitted('close')).toHaveLength(1);
        expect(mockGoToRoute).toHaveBeenCalledWith('clients_list');
    });

    it('destaca o subitem ativo de acordo com a rota atual', () => {
        route.name = 'clients_list';

        const wrapper = mount(MaxSideMenuFlyout, {
            props: { visible: true, item: mockItem, currentRoute: 'clients_list' },
            global: { stubs: { MaxIcon: true } }
        });

        const items = wrapper.findAll('.flyout-item');
        expect(items[1].classes()).toContain('active');
        expect(items[0].classes()).not.toContain('active');
    });

    it('utiliza background-color var(--layout-content-frame-bg, #004860)', async () => {
        const fs = await import('node:fs');
        const path = await import('node:path');
        const sfc = fs.readFileSync(path.resolve(__dirname, '../../src/components/MaxSideMenuFlyout.vue'), 'utf-8');

        expect(sfc).toMatch(/background-color:\s*var\(--layout-content-frame-bg/);
    });
});
