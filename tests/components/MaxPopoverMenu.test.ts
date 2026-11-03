import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    it('renderiza corretamente', async () => {
        const wrapper = mount(MaxPopoverMenu, {
            global: {
                stubs: {
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
        const vm = wrapper.vm as any;
        vm.toggle();
        await wrapper.vm.$nextTick();

        expect(document.body.querySelector('.max-popover-menu-label')?.textContent).toBe('Item 1');
    });

    it('expõe e chama método toggle', () => {
        const wrapper = mount(MaxPopoverMenu, {
            global: {
                stubs: {
                    MaxButton: true
                }
            }
        });

        const vm = wrapper.vm as any;
        expect(typeof vm.toggle).toBe('function');
        vm.toggle(new MouseEvent('click'));
    });

    it('onClick chama goToRoute se o item tiver route', async () => {
        const { goToRoute } = await import('@maxvue/max-use');
        const wrapper = mount(MaxPopoverMenu, {
            global: {
                stubs: {
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
                    MaxButton: true
                }
            }
        });

        const actionMock = vi.fn();
        const vm = wrapper.vm as any;
        vm.onClick(new MouseEvent('click'), { action: actionMock, data: { id: 2 } });

        expect(actionMock).toHaveBeenCalled();
    });

    it('onClick bloqueia chamadas duplicadas', async () => {
        const wrapper = mount(MaxPopoverMenu, {
            global: {
                stubs: {
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

        const vm = wrapper.vm as any;
        vm.toggle();
        await wrapper.vm.$nextTick();

        const item = document.body.querySelector('.max-popover-menu-item') as HTMLElement;
        expect(item).toBeTruthy();
        item.click();
        expect(actionMock).toHaveBeenCalledWith(expect.objectContaining({ data: { foo: 'bar' } }));
    });

    it('chama onClick no template caso item não possua action própria', async () => {
        const { goToRoute } = await import('@maxvue/max-use');
        const wrapper = mount(MaxPopoverMenu, {
            global: {
                stubs: {
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

        const vm = wrapper.vm as any;
        vm.toggle();
        await wrapper.vm.$nextTick();

        const item = document.body.querySelector('.max-popover-menu-item') as HTMLElement;
        expect(item).toBeTruthy();
        item.click();
        expect(goToRoute).toHaveBeenCalledWith('some.route', { biz: 'baz' });
    });

    describe('tamanho do gatilho', () => {
        function mountWithSize(props: Record<string, any>) {
            return mount(MaxPopoverMenu, {
                props,
                global: {
                    stubs: {
                        MaxButton: { template: '<button class="max-button"></button>', props: ['size'] },
                        MaxIcon: true
                    },
                    directives: { tooltip: {} }
                }
            });
        }

        // size_icon vai para width E height do gatilho: um valor inválido é
        // descartado pelo navegador e a área clicável colapsa.
        it.each(['small', 'sm', 'large', 'lg'])('size="%s" não produz NaN nas dimensões', (size) => {
            const wrapper = mountWithSize({ size });
            const style = wrapper.find('.max-popover-menu').attributes('style') ?? '';

            expect(style).not.toContain('NaN');
            expect(style).toContain('1.1rem');
        });

        it('size numérico continua dimensionando o gatilho', () => {
            const wrapper = mountWithSize({ size: 2 });
            expect(wrapper.find('.max-popover-menu').attributes('style')).toContain('2rem');
        });

        it('sem size usa o padrão', () => {
            const wrapper = mountWithSize({});
            expect(wrapper.find('.max-popover-menu').attributes('style')).toContain('1.1rem');
        });
    });

    describe('itemIconPosition e tamanhos dos ícones dos itens', () => {
        const testItems = [
            { label: 'Item 1', icon: 'mdi:star', size_top: '1.8rem', size_bottom: '1.4rem', size: '2.0rem' },
            { label: 'Item 2', icon: 'mdi:home' } // sem tamanho customizado
        ];

        it('resolve ícones dos itens conforme itemIconPosition="top"', async () => {
            const wrapper = mount(MaxPopoverMenu, {
                props: {
                    items: testItems,
                    itemIconPosition: 'top'
                },
                global: {
                    stubs: {
                        MaxButton: true,
                        MaxIcon: {
                            name: 'MaxIcon',
                            props: ['icon', 'size'],
                            template: '<span class="max-icon-stub" :data-icon="icon" :data-size="size" />'
                        }
                    }
                }
            });

            const vm = wrapper.vm as any;
            vm.toggle();
            await wrapper.vm.$nextTick();

            const icons = document.body.querySelectorAll('.max-popover-menu-item .max-icon-stub');
            expect(icons).toHaveLength(2);
            expect(icons[0].getAttribute('data-size')).toBe('1.8rem');
            expect(icons[1].getAttribute('data-size')).toBe('1.1'); // fallback
        });

        it('resolve ícones dos itens conforme itemIconPosition="bottom"', async () => {
            const wrapper = mount(MaxPopoverMenu, {
                props: {
                    items: testItems,
                    itemIconPosition: 'bottom'
                },
                global: {
                    stubs: {
                        MaxButton: true,
                        MaxIcon: {
                            name: 'MaxIcon',
                            props: ['icon', 'size'],
                            template: '<span class="max-icon-stub" :data-icon="icon" :data-size="size" />'
                        }
                    }
                }
            });

            const vm = wrapper.vm as any;
            vm.toggle();
            await wrapper.vm.$nextTick();

            const icons = document.body.querySelectorAll('.max-popover-menu-item .max-icon-stub');
            expect(icons).toHaveLength(2);
            expect(icons[0].getAttribute('data-size')).toBe('1.4rem');
            expect(icons[1].getAttribute('data-size')).toBe('1.1');
        });

        it('mantém fallback 1.1 quando itemIconPosition é omitido', async () => {
            const wrapper = mount(MaxPopoverMenu, {
                props: {
                    items: testItems
                },
                global: {
                    stubs: {
                        MaxButton: true,
                        MaxIcon: {
                            name: 'MaxIcon',
                            props: ['icon', 'size'],
                            template: '<span class="max-icon-stub" :data-icon="icon" :data-size="size" />'
                        }
                    }
                }
            });

            const vm = wrapper.vm as any;
            vm.toggle();
            await wrapper.vm.$nextTick();

            const icons = document.body.querySelectorAll('.max-popover-menu-item .max-icon-stub');
            expect(icons).toHaveLength(2);
            expect(icons[0].getAttribute('data-size')).toBe('1.1');
            expect(icons[1].getAttribute('data-size')).toBe('1.1');
        });
    });
});
