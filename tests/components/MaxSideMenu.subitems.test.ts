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
import { useSystemStore } from '../../src/stores/useSystem.Store';

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

    it('aciona a abertura do submenu na store ao clicar em um item com subitems', async () => {
        menusRef.value = menuWithSubitems;
        const wrapper = mountWithPinia(MaxSideMenu, { props: { screen: 'desktop' } });
        const system = useSystemStore();

        expect(system.active_side_submenu).toBeNull();

        // Clica no primeiro item (que tem subitems)
        const verticalItems = wrapper.findAll('.max-menu-vertical-item');
        await verticalItems[0].trigger('click');

        // Agora o submenu na store está preenchido
        expect(system.active_side_submenu).not.toBeNull();
        expect(system.active_side_submenu?.details?.title).toBe('Projetos');
        expect(verticalItems[0].classes()).toContain('active');
    });

    it('alterna (toggle) fechando o submenu ao clicar novamente no mesmo item pai', async () => {
        menusRef.value = menuWithSubitems;
        const wrapper = mountWithPinia(MaxSideMenu, { props: { screen: 'desktop' } });
        const system = useSystemStore();

        const verticalItems = wrapper.findAll('.max-menu-vertical-item');

        // Abre
        await verticalItems[0].trigger('click');
        expect(system.active_side_submenu).not.toBeNull();
        expect(verticalItems[0].classes()).toContain('active');

        // Fecha ao clicar de novo
        await verticalItems[0].trigger('click');
        expect(system.active_side_submenu).toBeNull();
    });

    it('fecha o submenu na store ao clicar na logo', async () => {
        menusRef.value = menuWithSubitems;
        const wrapper = mountWithPinia(MaxSideMenu, { props: { screen: 'desktop' } });
        const system = useSystemStore();

        await wrapper.findAll('.max-menu-vertical-item')[0].trigger('click');
        expect(system.active_side_submenu).not.toBeNull();

        const logo = wrapper.find('.space-logo');
        await logo.trigger('click');

        expect(system.active_side_submenu).toBeNull();
    });

    it('fecha o submenu na store ao alterar a rota atual', async () => {
        menusRef.value = menuWithSubitems;
        const wrapper = mountWithPinia(MaxSideMenu, { props: { screen: 'desktop' } });
        const system = useSystemStore();

        await wrapper.findAll('.max-menu-vertical-item')[0].trigger('click');
        expect(system.active_side_submenu).not.toBeNull();

        route.path = '/nova-rota';
        await wrapper.vm.$nextTick();

        expect(system.active_side_submenu).toBeNull();
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
        const system = useSystemStore();

        const verticalItems = wrapper.findAll('.max-menu-vertical-item');
        expect(verticalItems).toHaveLength(1);

        await verticalItems[0].trigger('click');
        expect(system.active_side_submenu?.details?.title).toBe('Módulos');
    });
});
