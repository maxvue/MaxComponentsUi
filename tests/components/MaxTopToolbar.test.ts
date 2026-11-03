import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxTopToolbar from '../../src/components/MaxTopToolbar.vue';
import { useTopToolbarStore } from '../../src/stores/useTopToolbar.Store';

describe('MaxTopToolbar', () => {
    let pinia: ReturnType<typeof createPinia>;

    beforeEach(() => {
        pinia = createPinia();
        setActivePinia(pinia);
        vi.clearAllMocks();
    });

    it('não renderiza se toolbarStore.show for false', () => {
        const store = useTopToolbarStore();
        store.show = false;
        store.items = [{ label: 'Item 1' }];

        const wrapper = mount(MaxTopToolbar, {
            global: { plugins: [pinia] }
        });

        expect(wrapper.find('.max-top-toolbar').exists()).toBe(false);
    });

    it('não renderiza se toolbarStore.items estiver vazio', () => {
        const store = useTopToolbarStore();
        store.show = true;
        store.items = [];

        const wrapper = mount(MaxTopToolbar, {
            global: { plugins: [pinia] }
        });

        expect(wrapper.find('.max-top-toolbar').exists()).toBe(false);
    });

    it('renderiza toolbar quando show=true e há itens', () => {
        const store = useTopToolbarStore();
        store.show = true;
        store.items = [
            { label: 'Novo Projeto', icon: 'mdi:plus' },
            { divider: true },
            { icon: 'mdi:settings', action: vi.fn() }
        ];

        const wrapper = mount(MaxTopToolbar, {
            global: {
                plugins: [pinia],
                stubs: {
                    MaxIconButton: true
                }
            }
        });

        expect(wrapper.find('.max-top-toolbar').exists()).toBe(true);
        expect(wrapper.find('.menu_bar_project_top').exists()).toBe(true);
        expect(wrapper.findAll('.p-menubar-item')).toHaveLength(3);
        expect(wrapper.find('.divider-space').exists()).toBe(true);
    });

    it('executa a ação configurada ao clicar em item', async () => {
        const actionSpy = vi.fn();
        const store = useTopToolbarStore();
        store.show = true;
        store.items = [
            { label: 'Ação Teste', action: actionSpy }
        ];

        const wrapper = mount(MaxTopToolbar, {
            global: {
                plugins: [pinia],
                stubs: {
                    MaxIconButton: true
                }
            }
        });

        await wrapper.find('.menu-item-content.root').trigger('click');
        expect(actionSpy).toHaveBeenCalled();
    });

    it('renderiza o slot plus', () => {
        const store = useTopToolbarStore();
        store.show = false;
        store.items = [];

        const wrapper = mount(MaxTopToolbar, {
            slots: {
                plus: '<div class="custom-plus">Ação Extra</div>'
            },
            global: { plugins: [pinia] }
        });

        expect(wrapper.find('.custom-plus').text()).toBe('Ação Extra');
    });

    it('renderiza o submenu com a classe raiz p-menubar-submenu-root e chevron quando houver itens filhos', async () => {
        const store = useTopToolbarStore();
        store.show = true;
        store.items = [
            {
                label: 'Menu Principal',
                items: [
                    {
                        label: 'Atendimento',
                        items: [{ label: 'Canal 1' }]
                    }
                ]
            }
        ];

        const wrapper = mount(MaxTopToolbar, {
            global: {
                plugins: [pinia],
                stubs: {
                    MaxIconButton: true,
                    MaxIcon: true
                }
            }
        });

        const rootItem = wrapper.find('.p-menubar-root-list > .p-menubar-item');
        await rootItem.trigger('mouseenter');

        const submenuRoot = wrapper.find('.p-menubar-submenu-root');
        expect(submenuRoot.exists()).toBe(true);

        const chevron = wrapper.find('.menu-item-chevron');
        expect(chevron.exists()).toBe(true);
    });

    describe('Navegação Menubar WAI-ARIA (E08-06)', () => {
        it('apenas o primeiro item navegável possui tabindex="0" e os demais possuem tabindex="-1"', () => {
            const store = useTopToolbarStore();
            store.show = true;
            store.items = [
                { label: 'Item 1' },
                { divider: true },
                { label: 'Item 2', disabled: true },
                { label: 'Item 3' }
            ];

            const wrapper = mount(MaxTopToolbar, {
                global: {
                    plugins: [pinia],
                    stubs: { MaxIcon: true }
                }
            });

            const items = wrapper.findAll('[role="menuitem"]');
            expect(items).toHaveLength(3);
            expect(items[0].attributes('tabindex')).toBe('0');
            expect(items[1].attributes('tabindex')).toBe('-1');
            expect(items[2].attributes('tabindex')).toBe('-1');
        });

        it('ArrowRight e ArrowLeft navegam circularmente pulando divisores e itens desabilitados', async () => {
            const store = useTopToolbarStore();
            store.show = true;
            store.items = [
                { label: 'Item 1' },
                { divider: true },
                { label: 'Item 2', disabled: true },
                { label: 'Item 3' }
            ];

            const wrapper = mount(MaxTopToolbar, {
                attachTo: document.body,
                global: {
                    plugins: [pinia],
                    stubs: { MaxIcon: true }
                }
            });

            const items = wrapper.findAll('[role="menuitem"]');
            await items[0].trigger('keydown', { key: 'ArrowRight' });
            await wrapper.vm.$nextTick();

            expect((wrapper.vm as any).focusedIndex).toBe(3);
            expect(items[2].attributes('tabindex')).toBe('0');
            expect(items[0].attributes('tabindex')).toBe('-1');

            await items[2].trigger('keydown', { key: 'ArrowLeft' });
            await wrapper.vm.$nextTick();
            expect((wrapper.vm as any).focusedIndex).toBe(0);
            expect(items[0].attributes('tabindex')).toBe('0');

            wrapper.unmount();
        });

        it('Home e End movem para o primeiro e último item navegável', async () => {
            const store = useTopToolbarStore();
            store.show = true;
            store.items = [
                { label: 'Primeiro' },
                { label: 'Meio' },
                { label: 'Último' }
            ];

            const wrapper = mount(MaxTopToolbar, {
                global: {
                    plugins: [pinia],
                    stubs: { MaxIcon: true }
                }
            });

            const items = wrapper.findAll('[role="menuitem"]');
            await items[0].trigger('keydown', { key: 'End' });
            await wrapper.vm.$nextTick();
            expect((wrapper.vm as any).focusedIndex).toBe(2);

            await items[2].trigger('keydown', { key: 'Home' });
            await wrapper.vm.$nextTick();
            expect((wrapper.vm as any).focusedIndex).toBe(0);
        });

        it('ArrowDown ou Enter abre o submenu e foca o primeiro item', async () => {
            const store = useTopToolbarStore();
            store.show = true;
            store.items = [
                {
                    label: 'Menu',
                    items: [
                        { label: 'Subitem 1' },
                        { label: 'Subitem 2' }
                    ]
                }
            ];

            const wrapper = mount(MaxTopToolbar, {
                global: {
                    plugins: [pinia],
                    stubs: { MaxIcon: true }
                }
            });

            const rootItem = wrapper.find('[role="menuitem"]');
            expect(rootItem.attributes('aria-haspopup')).toBe('menu');
            expect(rootItem.attributes('aria-expanded')).toBe('false');

            await rootItem.trigger('keydown', { key: 'ArrowDown' });
            await wrapper.vm.$nextTick();

            expect((wrapper.vm as any).activeSubmenu).toBe(0);
            expect(rootItem.attributes('aria-expanded')).toBe('true');

            const submenu = wrapper.find('.p-menubar-submenu-root');
            expect(submenu.exists()).toBe(true);
        });

        it('Escape fecha o submenu ativo e devolve o foco ao item raiz', async () => {
            const store = useTopToolbarStore();
            store.show = true;
            store.items = [
                {
                    label: 'Menu',
                    items: [{ label: 'Subitem 1' }]
                }
            ];

            const wrapper = mount(MaxTopToolbar, {
                global: {
                    plugins: [pinia],
                    stubs: { MaxIcon: true }
                }
            });

            const rootItem = wrapper.find('[role="menuitem"]');
            await rootItem.trigger('keydown', { key: 'ArrowDown' });
            await wrapper.vm.$nextTick();
            expect((wrapper.vm as any).activeSubmenu).toBe(0);

            await rootItem.trigger('keydown', { key: 'Escape' });
            await wrapper.vm.$nextTick();
            expect((wrapper.vm as any).activeSubmenu).toBe(null);
        });
    });

    describe('Tamanhos dos ícones por item (com texto e somente ícone)', () => {
        it('aplica tamanhos customizados aos itens com texto, respeitando precedência sobre icon_size legado', () => {
            const store = useTopToolbarStore();
            store.show = true;
            store.items = [
                // 1. Novo campo size_top tem precedência sobre icon_size
                { label: 'Item 1', icon: 'mdi:star', size_top: '1.8rem', icon_size: '1.4' },
                // 2. Sem novo campo, preserva icon_size legado
                { label: 'Item 2', icon: 'mdi:home', icon_size: '1.5' },
                // 3. Sem nenhum campo, fallback padrão 1.2
                { label: 'Item 3', icon: 'mdi:cog' }
            ];

            const wrapper = mount(MaxTopToolbar, {
                global: {
                    plugins: [pinia],
                    stubs: {
                        MaxIconButton: true,
                        MaxIcon: {
                            name: 'MaxIcon',
                            props: ['icon', 'size'],
                            template: '<span class="max-icon-stub" :data-icon="icon" :data-size="size" />'
                        }
                    }
                }
            });

            const icons = wrapper.findAll('.max-icon-stub');
            expect(icons).toHaveLength(3);
            expect(icons[0].attributes('data-size')).toBe('1.8rem');
            expect(icons[1].attributes('data-size')).toBe('1.5');
            expect(icons[2].attributes('data-size')).toBe('1.2');
        });

        it('aplica classe has-custom-icon-size e variável CSS dinâmica no MaxIconButton para itens somente ícone', () => {
            const store = useTopToolbarStore();
            store.show = true;
            store.items = [
                // Item somente ícone com tamanho customizado
                { icon: 'mdi:star', size_top: '20px', action: vi.fn() },
                // Item somente ícone com número puro (deve virar rem)
                { icon: 'mdi:bell', top_size: 1.8, action: vi.fn() },
                // Item somente ícone sem tamanho customizado
                { icon: 'mdi:cog', action: vi.fn() }
            ];

            const wrapper = mount(MaxTopToolbar, {
                global: {
                    plugins: [pinia],
                    stubs: {
                        MaxIcon: true,
                        MaxIconButton: {
                            name: 'MaxIconButton',
                            props: ['icon', 'size'],
                            template: '<button class="max-icon-button-stub" :data-size="size"><slot /></button>'
                        }
                    }
                }
            });

            const buttons = wrapper.findAll('.max-icon-button-stub');
            expect(buttons).toHaveLength(3);

            // Todos os botões preservam size="1.5"
            expect(buttons[0].attributes('data-size')).toBe('1.5');
            expect(buttons[1].attributes('data-size')).toBe('1.5');
            expect(buttons[2].attributes('data-size')).toBe('1.5');

            // Primeiro botão tem classe e variável CSS com unidade 20px
            expect(buttons[0].classes()).toContain('has-custom-icon-size');
            expect(buttons[0].attributes('style')).toContain('--max-menu-item-icon-size: 20px');

            // Segundo botão tem classe e número puro convertido para rem (1.8rem)
            expect(buttons[1].classes()).toContain('has-custom-icon-size');
            expect(buttons[1].attributes('style')).toContain('--max-menu-item-icon-size: 1.8rem');

            // Terceiro botão não tem classe customizada nem variável CSS
            expect(buttons[2].classes()).not.toContain('has-custom-icon-size');
            expect(buttons[2].attributes('style') ?? '').not.toContain('--max-menu-item-icon-size');
        });
    });
});
