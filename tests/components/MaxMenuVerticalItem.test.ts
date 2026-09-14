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

vi.mock('@maxvue/max-use', async () => {
    const actual = await vi.importActual<any>('@maxvue/max-use');
    return {
        ...actual,
        goToRoute: vi.fn()
    };
});

describe('MaxMenuVerticalItem', () => {
    let pinia: ReturnType<typeof createPinia>;

    beforeEach(() => {
        pinia = createPinia();
        setActivePinia(pinia);
        vi.clearAllMocks();
        currentRoute = { name: 'dashboard', path: '/dashboard' };
    });

    const mockItems: SideMenuItem[] = [
        {
            id: 'item-1',
            details: {
                page_component: 'dashboard',
                route: 'dashboard',
                icon: 'mdi:view-dashboard',
                tooltip: 'Painel'
            }
        },
        {
            id: 'item-2',
            details: {
                page_component: 'settings',
                route: 'settings',
                icon: 'mdi:cog',
                tooltip: 'Configurações'
            }
        }
    ];

    it('renderiza a lista de itens com classes semânticas BEM', () => {
        const wrapper = mount(MaxMenuVerticalItem, {
            props: { items: mockItems },
            global: {
                plugins: [pinia],
                directives: {
                    tooltip: () => {}
                },
                stubs: {
                    MaxIconButton: true
                }
            }
        });

        const items = wrapper.findAll('.max-menu-vertical-item');
        expect(items).toHaveLength(2);
        expect(items[0].attributes('role')).toBe('link');
        expect(items[0].attributes('tabindex')).toBe('0');
    });

    it('marca o item ativo baseado na rota atual', () => {
        currentRoute = { name: 'dashboard', path: '/dashboard' };

        const wrapper = mount(MaxMenuVerticalItem, {
            props: { items: mockItems },
            global: {
                plugins: [pinia],
                directives: {
                    tooltip: () => {}
                },
                stubs: {
                    MaxIconButton: true
                }
            }
        });

        const items = wrapper.findAll('.max-menu-vertical-item');
        expect(items[0].classes()).toContain('active');
        expect(items[1].classes()).not.toContain('active');
    });

    it('aciona goToRoute ao clicar no item', async () => {
        const { goToRoute } = await import('@maxvue/max-use');
        const wrapper = mount(MaxMenuVerticalItem, {
            props: { items: mockItems },
            global: {
                plugins: [pinia],
                directives: {
                    tooltip: () => {}
                },
                stubs: {
                    MaxIconButton: true
                }
            }
        });

        const items = wrapper.findAll('.max-menu-vertical-item');
        await items[1].trigger('click');

        expect(goToRoute).toHaveBeenCalledWith('settings');
    });
});
