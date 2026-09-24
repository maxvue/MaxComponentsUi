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

let pinia: Pinia;

const mountWithPinia = (component: any, options: Record<string, any> = {}) => mount(component, {
    ...options,
    global: {
        ...(options.global ?? {}),
        plugins: [pinia],
        stubs: {
            teleport: true,
            MaxIcon: { name: 'MaxIcon', props: ['icon', 'size'], template: '<span class="max-icon-stub" :data-icon="icon" />' },
            ...(options.global?.stubs ?? {})
        }
    }
});

describe('MaxSideMenuMobile com subitems (Modo Mobile / Accordion)', () => {
    beforeEach(() => {
        pinia = createPinia();
        setActivePinia(pinia);
        route.name = 'dashboard';
        push.mockReset();
        menusRef.value = null;
        useSystemStore().side_menu_open = true;
    });

    const sampleGroups = [
        {
            title: 'Módulos',
            items: [
                {
                    id: 'solar',
                    label: 'Projetos Solares',
                    icon: 'mdi:solar-panel',
                    route: 'solar_overview',
                    subitems: [
                        { id: 'sub-inst', label: 'Instalações', route: 'solar_installations' },
                        { id: 'sub-homolog', label: 'Homologações', route: 'solar_approvals' }
                    ]
                },
                {
                    id: 'crm',
                    label: 'Clientes',
                    icon: 'mdi:account-group',
                    route: 'clients_overview',
                    subitems: [
                        { id: 'sub-leads', label: 'Leads', route: 'clients_leads' }
                    ]
                },
                {
                    id: 'single',
                    label: 'Configurações',
                    icon: 'mdi:cog',
                    route: 'settings'
                }
            ]
        }
    ];

    it('exibe o chevron de accordion apenas nos itens que possuem subitems', () => {
        const wrapper = mountWithPinia(MaxSideMenuMobile, {
            props: { groups: sampleGroups }
        });

        const items = wrapper.findAll('.mobile-menu-item');
        expect(items).toHaveLength(3);

        // Primeiro e segundo itens têm subitens
        expect(items[0].classes()).toContain('has-subitems');
        expect(items[0].find('.mobile-accordion-chevron').exists()).toBe(true);

        expect(items[1].classes()).toContain('has-subitems');
        expect(items[1].find('.mobile-accordion-chevron').exists()).toBe(true);

        // Terceiro item é simples (sem subitems)
        expect(items[2].classes()).not.toContain('has-subitems');
        expect(items[2].find('.mobile-accordion-chevron').exists()).toBe(false);
    });

    it('expande o accordion com a lista de subitens ao clicar em item com subitems', async () => {
        const wrapper = mountWithPinia(MaxSideMenuMobile, {
            props: { groups: sampleGroups }
        });

        const items = wrapper.findAll('.mobile-menu-item');

        // Inicialmente nenhum painel de subitens está aberto
        expect(wrapper.find('.mobile-subitems-panel').exists()).toBe(false);

        // Clica no primeiro item
        await items[0].trigger('click');

        // O accordion expandiu
        const panel = wrapper.find('.mobile-subitems-panel');
        expect(panel.exists()).toBe(true);
        expect(panel.text()).toContain('Projetos Solares (Visão Geral)');
        expect(panel.text()).toContain('Instalações');
        expect(panel.text()).toContain('Homologações');

        // Gaveta continua aberta ao expandir
        expect(useSystemStore().side_menu_open).toBe(true);
        expect(push).not.toHaveBeenCalled();
    });

    it('aplica comportamento exclusivo ao accordion (abrir um fecha o outro)', async () => {
        const wrapper = mountWithPinia(MaxSideMenuMobile, {
            props: { groups: sampleGroups }
        });

        const items = wrapper.findAll('.mobile-menu-item');

        // Abre o primeiro item (Projetos Solares)
        await items[0].trigger('click');
        expect(wrapper.find('.mobile-subitems-panel').text()).toContain('Instalações');

        // Abre o segundo item (Clientes)
        await items[1].trigger('click');

        // O primeiro foi fechado, agora apenas Clientes está visível
        const panel = wrapper.find('.mobile-subitems-panel');
        expect(panel.exists()).toBe(true);
        expect(panel.text()).toContain('Leads');
        expect(panel.text()).not.toContain('Instalações');
    });

    it('recolhe o accordion ao clicar novamente no mesmo item pai', async () => {
        const wrapper = mountWithPinia(MaxSideMenuMobile, {
            props: { groups: sampleGroups }
        });

        const items = wrapper.findAll('.mobile-menu-item');

        // Abre
        await items[0].trigger('click');
        expect(wrapper.find('.mobile-subitems-panel').exists()).toBe(true);

        // Fecha
        await items[0].trigger('click');
        expect(wrapper.find('.mobile-subitems-panel').exists()).toBe(false);
    });

    it('navega e fecha a gaveta móvel ao clicar em um subitem', async () => {
        const system = useSystemStore();
        system.side_menu_open = true;

        const wrapper = mountWithPinia(MaxSideMenuMobile, {
            props: { groups: sampleGroups }
        });

        // Expande o accordion
        await wrapper.findAll('.mobile-menu-item')[0].trigger('click');

        const subitems = wrapper.findAll('.mobile-subitem');
        // Índice 1 é "Instalações" (índice 0 é Visão Geral)
        await subitems[1].trigger('click');

        expect(push).toHaveBeenCalledWith({ name: 'solar_installations' });
        expect(system.side_menu_open).toBe(false);
    });

    it('marca o item pai como ativo quando um subitem está na rota atual', () => {
        route.name = 'solar_approvals';

        const wrapper = mountWithPinia(MaxSideMenuMobile, {
            props: { groups: sampleGroups }
        });

        const items = wrapper.findAll('.mobile-menu-item');
        expect(items[0].classes()).toContain('active');
        expect(items[1].classes()).not.toContain('active');
    });

    it('navega normalmente e fecha a gaveta ao clicar em item simples sem subitens', async () => {
        const system = useSystemStore();
        system.side_menu_open = true;

        const wrapper = mountWithPinia(MaxSideMenuMobile, {
            props: { groups: sampleGroups }
        });

        const items = wrapper.findAll('.mobile-menu-item');
        await items[2].trigger('click');

        expect(push).toHaveBeenCalledWith({ name: 'settings' });
        expect(system.side_menu_open).toBe(false);
    });
});
