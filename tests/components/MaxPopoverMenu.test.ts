import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import MaxPopoverMenu from '../../src/components/MaxPopoverMenu.vue';

// Mock do goToRoute
vi.mock('@maxvue/max-use', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@maxvue/max-use')>();
    return {
        ...actual,
        goToRoute: vi.fn()
    };
});

describe('MaxPopoverMenu', () => {
    it('renderiza corretamente', () => {
        const wrapper = mount(MaxPopoverMenu, {
            global: {
                stubs: {
                    Menu: {
                        template: '<div><slot name="item" :item="model[0]"></slot></div>',
                        props: ['model', 'popup']
                    },
                    MaxButton: {
                        template: '<button class="max-button"></button>',
                        props: ['size']
                    },
                    MaxIcon: {
                        template: '<span></span>',
                        props: ['icon']
                    }
                }
            },
            props: {
                items: [
                    { label: 'Item 1', icon: 'mdi:home' }
                ]
            }
        });

        expect(wrapper.exists()).toBe(true);
        expect(wrapper.find('.max-popover-menu-label').text()).toBe('Item 1');
    });

    it('expõe e chama método toggle', () => {
        const mockToggle = vi.fn();
        const wrapper = mount(MaxPopoverMenu, {
            global: {
                stubs: {
                    Menu: {
                        template: '<div></div>',
                        methods: { toggle: mockToggle }
                    },
                    MaxButton: true
                }
            }
        });

        const vm = wrapper.vm as any;
        vm.toggle(new MouseEvent('click'));
        expect(mockToggle).toHaveBeenCalled();
    });

    it('onClick chama goToRoute se o item tiver route', async () => {
        const { goToRoute } = await import('@maxvue/max-use');
        const wrapper = mount(MaxPopoverMenu, {
            global: {
                stubs: {
                    Menu: true,
                    MaxButton: true
                }
            }
        });

        const vm = wrapper.vm as any;
        vm.onClick(new MouseEvent('click'), { route: 'home.index', data: { id: 1 } });

        expect(goToRoute).toHaveBeenCalledWith('home.index', { id: 1 });
    });

    it('onClick chama action se o item não tiver route', async () => {
        const wrapper = mount(MaxPopoverMenu, {
            global: {
                stubs: {
                    Menu: true,
                    MaxButton: true
                }
            }
        });

        const actionMock = vi.fn();
        const vm = wrapper.vm as any;
        vm.onClick(new MouseEvent('click'), { action: actionMock, data: { id: 2 } });

        // Pula o debounce/executing já que a chamada é nova
        expect(actionMock).toHaveBeenCalled();
    });

    it('onClick bloqueia chamadas duplicadas', async () => {
        const wrapper = mount(MaxPopoverMenu, {
            global: {
                stubs: {
                    Menu: true,
                    MaxButton: true
                }
            }
        });

        const actionMock = vi.fn();
        const vm = wrapper.vm as any;

        // Primeira chamada
        vm.onClick(new MouseEvent('click'), { action: actionMock });
        expect(actionMock).toHaveBeenCalledTimes(1);

        // Segunda chamada imediata deve ser ignorada devido a executing = true
        vm.onClick(new MouseEvent('click'), { action: actionMock });
        expect(actionMock).toHaveBeenCalledTimes(1);
    });

    it('chama item.action diretamente no template ao clicar', async () => {
        const actionMock = vi.fn();
        const wrapper = mount(MaxPopoverMenu, {
            global: {
                stubs: {
                    Menu: {
                        template: '<div><slot name="item" :item="model[0]"></slot></div>',
                        props: ['model', 'popup']
                    },
                    MaxButton: true,
                    MaxIcon: true
                }
            },
            props: {
                items: [
                    { label: 'Ação 1', action: actionMock, data: { foo: 'bar' } }
                ]
            }
        });

        const item = wrapper.find('.max-popover-menu-item');
        await item.trigger('click');
        expect(actionMock).toHaveBeenCalledWith(expect.objectContaining({ data: { foo: 'bar' } }));
    });

    it('chama onClick no template caso item não possua action própria', async () => {
        const { goToRoute } = await import('@maxvue/max-use');
        const wrapper = mount(MaxPopoverMenu, {
            global: {
                stubs: {
                    Menu: {
                        template: '<div><slot name="item" :item="model[0]"></slot></div>',
                        props: ['model', 'popup']
                    },
                    MaxButton: true,
                    MaxIcon: true
                }
            },
            props: {
                items: [
                    { label: 'Rota', route: 'some.route', data: { biz: 'baz' } }
                ]
            }
        });

        const item = wrapper.find('.max-popover-menu-item');
        await item.trigger('click');
        expect(goToRoute).toHaveBeenCalledWith('some.route', { biz: 'baz' });
    });
});
