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
});
