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

    it('renderiza curvas decorativas sem tabindex e com focusable="false" para não receber foco', () => {
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

        const curvas = wrapper.findAll('svg.curva');
        expect(curvas.length).toBeGreaterThan(0);
        for (const curva of curvas) {
            expect(curva.attributes('tabindex')).toBeUndefined();
            expect(curva.attributes('focusable')).toBe('false');
            expect(curva.attributes('aria-hidden')).toBe('true');
        }
    });

    it('aplica tamanhos customizados aos ícones por item e mantém fallback 1.5 nos itens sem configuração', async () => {
        const itemsWithSizes: SideMenuItem[] = [
            {
                id: 'item-custom-1',
                size_side: '1.8rem',
                details: {
                    route: 'page-1',
                    icon: 'mdi:star'
                }
            },
            {
                id: 'item-custom-2',
                details: {
                    route: 'page-2',
                    icon: 'mdi:cog',
                    size: '22px'
                }
            },
            {
                id: 'item-default',
                details: {
                    route: 'page-3',
                    icon: 'mdi:home'
                }
            }
        ];

        const wrapper = mount(MaxMenuVerticalItem, {
            props: { items: itemsWithSizes },
            global: {
                plugins: [pinia],
                directives: { tooltip: () => {} },
                stubs: {
                    MaxIconButton: true,
                    MaxIcon: {
                        name: 'MaxIcon',
                        props: ['size', 'icon'],
                        template: '<span class="max-icon-stub" :data-size="size" :data-icon="icon" />'
                    }
                }
            }
        });

        const icons = wrapper.findAll('.max-icon-stub');
        expect(icons).toHaveLength(3);
        expect(icons[0].attributes('data-size')).toBe('1.8rem');
        expect(icons[1].attributes('data-size')).toBe('22px');
        expect(icons[2].attributes('data-size')).toBe('1.5');

        // Atualização reativa: alterando props sem remontar
        await wrapper.setProps({
            items: [
                {
                    id: 'item-custom-1',
                    size_side: '2.5rem',
                    details: { route: 'page-1', icon: 'mdi:star' }
                }
            ]
        });

        const updatedIcons = wrapper.findAll('.max-icon-stub');
        expect(updatedIcons).toHaveLength(1);
        expect(updatedIcons[0].attributes('data-size')).toBe('2.5rem');
    });
});

