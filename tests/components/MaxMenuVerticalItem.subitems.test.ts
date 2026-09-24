import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxMenuVerticalItem from '../../src/components/MaxMenuVerticalItem.vue';
import type { SideMenuItem } from '../../src/types/app';

let currentRoute: { name: string; path: string } = { name: 'dashboard', path: '/dashboard' };

vi.mock('vue-router', () => ({
    useRoute: () => currentRoute,
    useRouter: () => ({ push: vi.fn() })
}));

const mockGoToRoute = vi.fn();
vi.mock('@maxvue/max-use', async () => {
    const actual = await vi.importActual<any>('@maxvue/max-use');
    return {
        ...actual,
        goToRoute: (...args: any[]) => mockGoToRoute(...args)
    };
});

describe('MaxMenuVerticalItem com subitems', () => {
    let pinia: ReturnType<typeof createPinia>;

    beforeEach(() => {
        pinia = createPinia();
        setActivePinia(pinia);
        vi.clearAllMocks();
        mockGoToRoute.mockReset();
        currentRoute = { name: 'dashboard', path: '/dashboard' };
    });

    const mockItems: SideMenuItem[] = [
        {
            id: 'item-parent',
            details: {
                page_component: 'projects',
                route: 'projects',
                icon: 'mdi:solar-panel',
                tooltip: 'Projetos'
            },
            subitems: [
                { id: 'sub-1', label: 'Propostas', route: 'proposals' }
            ]
        },
        {
            id: 'item-single',
            details: {
                page_component: 'settings',
                route: 'settings',
                icon: 'mdi:cog',
                tooltip: 'Configurações'
            }
        }
    ];

    it('emite openSubmenu e não chama goToRoute ao clicar em item com subitems', async () => {
        const wrapper = mount(MaxMenuVerticalItem, {
            props: { items: mockItems },
            global: {
                plugins: [pinia],
                directives: { tooltip: () => {} },
                stubs: { MaxIcon: true }
            }
        });

        const items = wrapper.findAll('.max-menu-vertical-item');
        await items[0].trigger('click');

        expect(wrapper.emitted('openSubmenu')).toHaveLength(1);
        expect(wrapper.emitted('openSubmenu')![0][0]).toEqual(mockItems[0]);
        expect(mockGoToRoute).not.toHaveBeenCalled();
    });

    it('navega via goToRoute ao clicar em item simples sem subitems', async () => {
        const wrapper = mount(MaxMenuVerticalItem, {
            props: { items: mockItems },
            global: {
                plugins: [pinia],
                directives: { tooltip: () => {} },
                stubs: { MaxIcon: true }
            }
        });

        const items = wrapper.findAll('.max-menu-vertical-item');
        await items[1].trigger('click');

        expect(mockGoToRoute).toHaveBeenCalledWith('settings');
        expect(wrapper.emitted('openSubmenu')).toBeUndefined();
    });

    it('exibe o subitem-indicator apenas no item que possui subitems', () => {
        const wrapper = mount(MaxMenuVerticalItem, {
            props: { items: mockItems },
            global: {
                plugins: [pinia],
                directives: { tooltip: () => {} },
                stubs: { MaxIcon: true }
            }
        });

        const items = wrapper.findAll('.max-menu-vertical-item');
        expect(items[0].classes()).toContain('has-subitems');
        expect(items[0].find('.subitem-indicator').exists()).toBe(true);

        expect(items[1].classes()).not.toContain('has-subitems');
        expect(items[1].find('.subitem-indicator').exists()).toBe(false);
    });

    it('marca o item pai como active se a prop activeFlyoutId corresponder ao seu ID', () => {
        const wrapper = mount(MaxMenuVerticalItem, {
            props: { items: mockItems, activeFlyoutId: 'item-parent' },
            global: {
                plugins: [pinia],
                directives: { tooltip: () => {} },
                stubs: { MaxIcon: true }
            }
        });

        const items = wrapper.findAll('.max-menu-vertical-item');
        expect(items[0].classes()).toContain('active');
        expect(items[1].classes()).not.toContain('active');
    });

    it('marca o item pai como active se um dos subitens estiver na rota atual', () => {
        currentRoute = { name: 'proposals', path: '/proposals' };

        const wrapper = mount(MaxMenuVerticalItem, {
            props: { items: mockItems },
            global: {
                plugins: [pinia],
                directives: { tooltip: () => {} },
                stubs: { MaxIcon: true }
            }
        });

        const items = wrapper.findAll('.max-menu-vertical-item');
        expect(items[0].classes()).toContain('active');
    });

    it('marca o item como active quando o submenu está aberto na store useSystemStore', async () => {
        const { useSystemStore } = await import('../../src/stores/useSystem.Store');
        const system = useSystemStore();

        const wrapper = mount(MaxMenuVerticalItem, {
            props: { items: mockItems },
            global: {
                plugins: [pinia],
                directives: { tooltip: () => {} },
                stubs: { MaxIcon: true }
            }
        });

        const items = wrapper.findAll('.max-menu-vertical-item');
        expect(items[0].classes()).not.toContain('active');

        system.openSideSubmenu(mockItems[0]);
        await wrapper.vm.$nextTick();

        expect(items[0].classes()).toContain('active');
    });

    it('aplica cores claras e vincula a curva a --layout-content-frame-bg', async () => {
        const fs = await import('node:fs');
        const path = await import('node:path');
        const sfc = fs.readFileSync(path.resolve(__dirname, '../../src/components/MaxMenuVerticalItem.vue'), 'utf-8');

        // Curvas e fundo da aba usam --layout-content-frame-bg
        expect(sfc).toContain('var(--layout-content-frame-bg');
        expect(sfc).not.toContain('var(--blue-800)');

        // Ícone com flyout/submenu aberto usa layout-shell-text (claro)
        expect(sfc).toContain('var(--layout-shell-text');
        expect(sfc).toMatch(/&.flyout-active\s*\{[\s\S]*color:\s*var\(--layout-shell-text,\s*#fff\)\s*!important/);
    });
});
