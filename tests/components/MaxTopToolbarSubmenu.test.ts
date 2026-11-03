import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import MaxTopToolbarSubmenu from '../../src/components/MaxTopToolbarSubmenu.vue';
import type { MaxTopToolbarSubmenuItem } from '../../src/components/MaxTopToolbarSubmenu.vue';

describe('MaxTopToolbarSubmenu', () => {
    const defaultGlobal = {
        stubs: {
            MaxIcon: {
                template: '<span class="max-icon-stub" :data-icon="icon" :data-size="size" />',
                props: ['icon', 'size']
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

    it('aplica tamanhos customizados no submenu para itens com texto e somente ícone sem herança em subníveis', async () => {
        const itemsWithSizes: MaxTopToolbarSubmenuItem[] = [
            {
                label: 'Item Texto Customizado',
                icon: 'lucide:file',
                size_top: '1.6rem',
                icon_size: '1.4'
            },
            {
                label: 'Item Texto Legado',
                icon: 'lucide:folder',
                icon_size: '1.5'
            },
            {
                label: 'Item Pai',
                icon: 'lucide:menu',
                size_top: '2.0rem',
                items: [
                    { label: 'Filho Sem Tamanho', icon: 'lucide:link' },
                    { label: 'Filho Com Tamanho', icon: 'lucide:star', size_top: '1.3rem' }
                ]
            },
            {
                icon: 'lucide:trash',
                size_top: '22px',
                action: () => {}
            }
        ];

        const wrapper = mount(MaxTopToolbarSubmenu, {
            props: { items: itemsWithSizes },
            global: defaultGlobal
        });

        // 1. Item Texto Customizado: 1.6rem vence 1.4
        const icons = wrapper.findAll('.menu-item-content .max-icon-stub');
        expect(icons[0].attributes('data-size')).toBe('1.6rem');

        // 2. Item Texto Legado: preserva 1.5
        expect(icons[1].attributes('data-size')).toBe('1.5');

        // 3. Item Pai com 2.0rem
        expect(icons[2].attributes('data-size')).toBe('2.0rem');

        // 4. Item somente ícone com size_top="22px"
        const button = wrapper.find('.max-icon-button-stub');
        expect(button.classes()).toContain('has-custom-icon-size');
        expect(button.attributes('style')).toContain('--max-menu-item-icon-size: 22px');

        // 5. Expande o submenu recursivo do Item Pai (índice 2)
        const parentSubmenuItem = wrapper.findAll('.submenu-item')[2];
        await parentSubmenuItem.trigger('mouseenter');

        const nestedSubmenu = parentSubmenuItem.findComponent(MaxTopToolbarSubmenu);
        expect(nestedSubmenu.exists()).toBe(true);

        const nestedIcons = nestedSubmenu.findAll('.menu-item-content .max-icon-stub');
        // Filho sem tamanho -> fallback padrão 1.2 (não herdou 2.0rem do pai!)
        expect(nestedIcons[0].attributes('data-size')).toBe('1.2');
        // Filho com tamanho -> 1.3rem
        expect(nestedIcons[1].attributes('data-size')).toBe('1.3rem');
    });
});
