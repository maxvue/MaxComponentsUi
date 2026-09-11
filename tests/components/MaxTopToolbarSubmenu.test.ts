import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import MaxTopToolbarSubmenu from '../../src/components/MaxTopToolbarSubmenu.vue';
import type { MaxTopToolbarSubmenuItem } from '../../src/components/MaxTopToolbarSubmenu.vue';

describe('MaxTopToolbarSubmenu', () => {
    const defaultGlobal = {
        stubs: {
            MaxIcon: {
                template: '<span class="max-icon-stub" :data-icon="icon" />',
                props: ['icon']
            },
            MaxIconButton: {
                template: '<button class="max-icon-button-stub" :data-icon="icon" />',
                props: ['icon', 'size', 'transparent', 'route', 'action', 'data']
            }
        },
        directives: {
            tooltip: () => {}
        }
    };

    const sampleItems: MaxTopToolbarSubmenuItem[] = [
        {
            label: 'Exportar Relatório',
            subLabel: 'PDF e Excel',
            icon: 'lucide:download'
        },
        {
            divider: true
        },
        {
            label: 'Configurações Avançadas',
            icon: 'lucide:settings',
            items: [
                { label: 'Segurança', icon: 'lucide:shield' },
                { label: 'Permissões', icon: 'lucide:lock' }
            ]
        },
        {
            icon: 'lucide:trash',
            action: () => {}
        }
    ];

    it('renderiza os itens de menu, sublabels e divisores', () => {
        const wrapper = mount(MaxTopToolbarSubmenu, {
            props: {
                items: sampleItems
            },
            global: defaultGlobal
        });

        expect(wrapper.classes()).toContain('max-top-toolbar-submenu');
        expect(wrapper.findAll('.submenu-item')).toHaveLength(4);
        expect(wrapper.text()).toContain('Exportar Relatório');
        expect(wrapper.text()).toContain('PDF e Excel');
        expect(wrapper.find('.divider-space').exists()).toBe(true);
    });

    it('emite item-click ao clicar em um item de menu', async () => {
        const wrapper = mount(MaxTopToolbarSubmenu, {
            props: {
                items: sampleItems
            },
            global: defaultGlobal
        });

        const firstItem = wrapper.findAll('.menu-item-content')[0];
        await firstItem.trigger('click');

        expect(wrapper.emitted('item-click')).toBeTruthy();
        expect(wrapper.emitted('item-click')?.[0]?.[0]).toEqual(sampleItems[0]);
    });

    it('abre submenu recursivo aninhado ao passar o mouse sobre item com filhos', async () => {
        const wrapper = mount(MaxTopToolbarSubmenu, {
            props: {
                items: sampleItems
            },
            global: defaultGlobal
        });

        // Terceiro item (índice 2) possui filhos
        const itemWithChildren = wrapper.findAll('.submenu-item')[2];
        expect(itemWithChildren.find('.max-top-toolbar-submenu-nested').exists()).toBe(false);

        await itemWithChildren.trigger('mouseenter');
        expect(itemWithChildren.find('.max-top-toolbar-submenu-nested').exists()).toBe(true);
        expect(itemWithChildren.text()).toContain('Segurança');
        expect(itemWithChildren.text()).toContain('Permissões');
    });

    it('emite keep-open ao entrar com o mouse no menu e schedule-close ao sair', async () => {
        const wrapper = mount(MaxTopToolbarSubmenu, {
            props: {
                items: sampleItems
            },
            global: defaultGlobal
        });

        await wrapper.trigger('mouseenter');
        expect(wrapper.emitted('keep-open')).toBeTruthy();

        await wrapper.trigger('mouseleave');
        expect(wrapper.emitted('schedule-close')).toBeTruthy();
    });

    it('renderiza MaxIconButton como fallback quando label não é informado', () => {
        const wrapper = mount(MaxTopToolbarSubmenu, {
            props: {
                items: [
                    {
                        icon: 'lucide:trash',
                        action: () => {}
                    }
                ]
            },
            global: defaultGlobal
        });

        expect(wrapper.find('.max-icon-button-stub').exists()).toBe(true);
    });
});
