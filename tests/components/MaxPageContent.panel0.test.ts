import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import type { Pinia } from 'pinia';
import { setActivePinia, createPinia } from 'pinia';
import MaxPageContent from '../../src/components/MaxPageContent.vue';
import { useSystemStore } from '../../src/stores/useSystem.Store';
import type { SideMenuItem } from '../../src/types/app';

let pinia: Pinia;

describe('MaxPageContent com panel0 (Submenu lateral desktop)', () => {
    beforeEach(() => {
        pinia = createPinia();
        setActivePinia(pinia);
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

    it('não renderiza panel0 e não possui classe has-panel0 quando não há submenu ativo', () => {
        const wrapper = mount(MaxPageContent, {
            global: { plugins: [pinia] },
            slots: { default: '<div class="meu-conteudo">Conteúdo Principal</div>' }
        });

        expect(wrapper.classes()).not.toContain('has-panel0');
        expect(wrapper.find('.max-side-menu-flyout').exists()).toBe(false);
        expect(wrapper.find('.pane1').exists()).toBe(true);
        expect(wrapper.find('.meu-conteudo').text()).toBe('Conteúdo Principal');
    });

    it('renderiza panel0 antes de pane1 e adiciona classe has-panel0 quando active_side_submenu está ativo', async () => {
        const wrapper = mount(MaxPageContent, {
            global: {
                plugins: [pinia],
                stubs: { MaxIcon: true }
            },
            slots: { default: '<div class="meu-conteudo">Conteúdo Principal</div>' }
        });

        const system = useSystemStore();
        system.openSideSubmenu(mockItem);
        await wrapper.vm.$nextTick();

        expect(wrapper.classes()).toContain('has-panel0');
        const flyout = wrapper.find('.max-side-menu-flyout');
        expect(flyout.exists()).toBe(true);
        expect(flyout.classes()).toContain('panel0');
        expect(flyout.text()).toContain('Clientes');
        expect(flyout.text()).toContain('Lista de Clientes');

        // Garante que o slot em pane1 continua presente
        expect(wrapper.find('.pane1').exists()).toBe(true);
        expect(wrapper.find('.meu-conteudo').text()).toBe('Conteúdo Principal');
    });

    it('fecha o panel0 e remove a classe has-panel0 ao fechar o submenu', async () => {
        const wrapper = mount(MaxPageContent, {
            global: {
                plugins: [pinia],
                stubs: { MaxIcon: true }
            },
            slots: { default: '<div class="meu-conteudo">Conteúdo Principal</div>' }
        });

        const system = useSystemStore();
        system.openSideSubmenu(mockItem);
        await wrapper.vm.$nextTick();

        expect(wrapper.classes()).toContain('has-panel0');

        // Clica no botão fechar do panel0
        await wrapper.find('.flyout-close-btn').trigger('click');
        await wrapper.vm.$nextTick();

        expect(system.active_side_submenu).toBeNull();
        expect(wrapper.classes()).not.toContain('has-panel0');
        expect(wrapper.find('.max-side-menu-flyout').exists()).toBe(false);
    });

    it('não renderiza panel0 no modo mobile mesmo que active_side_submenu esteja definido', async () => {
        const wrapper = mount(MaxPageContent, {
            global: {
                plugins: [pinia],
                stubs: { MaxIcon: true }
            },
            attrs: { screen: 'mobile' },
            slots: { default: '<div class="meu-conteudo">Conteúdo Mobile</div>' }
        });

        const system = useSystemStore();
        system.openSideSubmenu(mockItem);
        await wrapper.vm.$nextTick();

        expect(wrapper.classes()).not.toContain('has-panel0');
        expect(wrapper.find('.max-side-menu-flyout').exists()).toBe(false);
    });

    it('possui as regras CSS de has-panel0 configurando grid-template-columns e gap', async () => {
        const fs = await import('node:fs');
        const path = await import('node:path');
        const sfc = fs.readFileSync(path.resolve(__dirname, '../../src/components/MaxPageContent.vue'), 'utf-8');

        expect(sfc).toMatch(/&\.has-panel0\s*\{[^}]*grid-template-columns:\s*240px 1fr;/);
        expect(sfc).toMatch(/&\.has-panel0\s*\{[^}]*gap:\s*8px;/);
    });
});
