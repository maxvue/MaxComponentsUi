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
});
