import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import type { Pinia } from 'pinia';
import { setActivePinia, createPinia } from 'pinia';
import { reactive, ref } from 'vue';

const route = reactive<Record<string, any>>({ name: 'dashboard', path: '/dashboard', query: {}, params: {} });
const push = vi.fn();

vi.mock('vue-router', async (importOriginal) => ({
    ...(await importOriginal<Record<string, any>>()),
    useRoute: () => route,
    useRouter: () => ({ push })
}));

const menusRef = ref<any>(null);
const getRoute = vi.fn<(name: string) => string | null>(() => null);
const mockGoToRoute = vi.fn();

vi.mock('@maxvue/max-use', async (importOriginal) => ({
    ...(await importOriginal<Record<string, any>>()),
    useRefCachedApi: () => menusRef,
    getRoute: (...args: [string]) => getRoute(...args),
    goToRoute: (...args: any[]) => mockGoToRoute(...args)
}));

import MaxSideMenu from '../../src/components/MaxSideMenu.vue';

let pinia: Pinia;

const mountWithPinia = (component: any, options: Record<string, any> = {}) => mount(component, {
    ...options,
    global: {
        ...(options.global ?? {}),
        plugins: [pinia],
        stubs: {
            MaxLogo: { name: 'MaxLogo', template: '<div class="max-logo-stub" />' },
            MaxIcon: { name: 'MaxIcon', props: ['icon', 'i', 'size'], template: '<span class="max-icon-stub" />' },
            ...(options.global?.stubs ?? {})
        }
    }
});

describe('MaxSideMenu com subitems (Modo Desktop)', () => {
    beforeEach(() => {
        pinia = createPinia();
        setActivePinia(pinia);
        route.name = 'dashboard';
        route.path = '/dashboard';
        menusRef.value = null;
        push.mockReset();
        mockGoToRoute.mockReset();
    });

    const menuWithSubitems = {
        side: [
            {
                id: 'menu-solar',
                details: {
                    title: 'Projetos',
                    icon: 'mdi:solar-panel',
                    route: 'projects_home'
                },
                subitems: [
                    { id: 'sub-1', label: 'Propostas', route: 'proposals_list' },
                    { id: 'sub-2', label: 'Contratos', route: 'contracts_list' }
                ]
            },
            {
                id: 'menu-single',
                details: {
                    title: 'Painel',
                    icon: 'mdi:view-dashboard',
                    route: 'dashboard'
                }
            }
        ]
    };

    it('abre o flyout lateral sobreposto ao clicar em um item com subitems', async () => {
        menusRef.value = menuWithSubitems;
        const wrapper = mountWithPinia(MaxSideMenu, { props: { screen: 'desktop' } });

        // Inicialmente o flyout não é visível
        expect(wrapper.find('.max-side-menu-flyout').exists()).toBe(false);

        // Clica no primeiro item (que tem subitems)
        const verticalItems = wrapper.findAll('.max-menu-vertical-item');
        await verticalItems[0].trigger('click');

        // Agora o flyout está renderizado e visível
        const flyout = wrapper.find('.max-side-menu-flyout');
        expect(flyout.exists()).toBe(true);
        expect(flyout.text()).toContain('Projetos');
        expect(flyout.text()).toContain('Propostas');
        expect(flyout.text()).toContain('Contratos');
    });

    it('exibe a opção de Visão Geral quando o item pai possui rota cadastrada', async () => {
        menusRef.value = menuWithSubitems;
        const wrapper = mountWithPinia(MaxSideMenu, { props: { screen: 'desktop' } });

        const verticalItems = wrapper.findAll('.max-menu-vertical-item');
        await verticalItems[0].trigger('click');

        const flyout = wrapper.find('.max-side-menu-flyout');
        expect(flyout.find('.parent-overview').exists()).toBe(true);
        expect(flyout.find('.parent-overview').text()).toContain('Projetos (Visão Geral)');
    });

    it('alterna (toggle) fechando o flyout ao clicar novamente no mesmo item pai', async () => {
        menusRef.value = menuWithSubitems;
        const wrapper = mountWithPinia(MaxSideMenu, { props: { screen: 'desktop' } });

        const verticalItems = wrapper.findAll('.max-menu-vertical-item');

        // Abre
        await verticalItems[0].trigger('click');
        expect(wrapper.find('.max-side-menu-flyout').exists()).toBe(true);

        // Fecha ao clicar de novo
        await verticalItems[0].trigger('click');
        expect(wrapper.find('.max-side-menu-flyout').exists()).toBe(false);
    });

    it('fecha o flyout ao clicar no botão fechar (X)', async () => {
        menusRef.value = menuWithSubitems;
        const wrapper = mountWithPinia(MaxSideMenu, { props: { screen: 'desktop' } });

        await wrapper.findAll('.max-menu-vertical-item')[0].trigger('click');
        expect(wrapper.find('.max-side-menu-flyout').exists()).toBe(true);

        const closeBtn = wrapper.find('.flyout-close-btn');
        await closeBtn.trigger('click');

        expect(wrapper.find('.max-side-menu-flyout').exists()).toBe(false);
    });

    it('fecha o flyout ao clicar no backdrop', async () => {
        menusRef.value = menuWithSubitems;
        const wrapper = mountWithPinia(MaxSideMenu, { props: { screen: 'desktop' } });

        await wrapper.findAll('.max-menu-vertical-item')[0].trigger('click');
        expect(wrapper.find('.max-side-menu-flyout-backdrop').exists()).toBe(true);

        await wrapper.find('.max-side-menu-flyout-backdrop').trigger('click');
        expect(wrapper.find('.max-side-menu-flyout').exists()).toBe(false);
    });

    it('fecha o flyout ao pressionar a tecla Escape', async () => {
        menusRef.value = menuWithSubitems;
        const wrapper = mountWithPinia(MaxSideMenu, { props: { screen: 'desktop' } });

        await wrapper.findAll('.max-menu-vertical-item')[0].trigger('click');
        const flyout = wrapper.find('.max-side-menu-flyout');
        expect(flyout.exists()).toBe(true);

        await flyout.trigger('keydown.esc');
        expect(wrapper.find('.max-side-menu-flyout').exists()).toBe(false);
    });

    it('navega e fecha o flyout ao clicar em um subitem', async () => {
        menusRef.value = menuWithSubitems;
        const wrapper = mountWithPinia(MaxSideMenu, { props: { screen: 'desktop' } });

        await wrapper.findAll('.max-menu-vertical-item')[0].trigger('click');
        const flyoutItems = wrapper.findAll('.flyout-item');

        // Subitem 1: Propostas (índice 1 pois índice 0 é Visão Geral)
        await flyoutItems[1].trigger('click');

        expect(mockGoToRoute).toHaveBeenCalledWith('proposals_list');
        expect(wrapper.find('.max-side-menu-flyout').exists()).toBe(false);
    });

    it('mantém o item pai ativo visualmente quando a rota atual é um dos subitens', async () => {
        route.name = 'contracts_list';
        menusRef.value = menuWithSubitems;
        const wrapper = mountWithPinia(MaxSideMenu, { props: { screen: 'desktop' } });

        const verticalItems = wrapper.findAll('.max-menu-vertical-item');
        // O primeiro item (Projetos) possui subitem 'contracts_list', portanto deve estar active
        expect(verticalItems[0].classes()).toContain('active');
        expect(verticalItems[1].classes()).not.toContain('active');
    });

    it('suporta subitens declarados via props.items', async () => {
        const customItems = [
            {
                id: 'custom-parent',
                details: { title: 'Módulos', icon: 'mdi:view-grid' },
                subitems: [{ id: 'c-sub', label: 'Sub Módulo', route: 'sub_mod' }]
            }
        ];

        const wrapper = mountWithPinia(MaxSideMenu, {
            props: { screen: 'desktop', items: customItems }
        });

        const verticalItems = wrapper.findAll('.max-menu-vertical-item');
        expect(verticalItems).toHaveLength(1);

        await verticalItems[0].trigger('click');
        const flyout = wrapper.find('.max-side-menu-flyout');
        expect(flyout.exists()).toBe(true);
        expect(flyout.text()).toContain('Sub Módulo');
    });
});
