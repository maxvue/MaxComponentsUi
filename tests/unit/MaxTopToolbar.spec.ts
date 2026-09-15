import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxTopToolbar from '../../src/components/MaxTopToolbar.vue';
import { useTopToolbarStore } from '../../src/stores/useTopToolbar.Store';

describe('MaxTopToolbar - Acessibilidade e Teclado (Etapa 10)', () => {
    let pinia: ReturnType<typeof createPinia>;

    beforeEach(() => {
        pinia = createPinia();
        setActivePinia(pinia);
        vi.clearAllMocks();
        document.body.innerHTML = '';
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    function mountToolbar(items: any[]) {
        const toolbarStore = useTopToolbarStore();
        toolbarStore.show = true;
        toolbarStore.items = items;

        return mount(MaxTopToolbar, {
            attachTo: document.body,
            global: {
                plugins: [pinia],
                stubs: {
                    MaxIconButton: { template: '<button class="max-icon-btn" v-bind="$attrs" />' },
                    MaxTopToolbarSubmenu: {
                        template: '<div class="max-top-toolbar-submenu" />',
                        props: ['items'],
                        emits: ['keep-open', 'schedule-close', 'item-click']
                    }
                }
            }
        });
    }

    function mountRealToolbar(items: any[]) {
        const toolbarStore = useTopToolbarStore();
        toolbarStore.show = true;
        toolbarStore.items = items;

        return mount(MaxTopToolbar, {
            attachTo: document.body,
            global: {
                plugins: [pinia],
                stubs: {
                    MaxIcon: true,
                    MaxIconButton: true
                }
            }
        });
    }

    it('itens com filhos recebem role="menuitem", tabindex="0", aria-haspopup="menu" e aria-expanded', async () => {
        const wrapper = mountToolbar([
            {
                label: 'Menu com Filhos',
                items: [
                    { label: 'Subitem 1' },
                    { label: 'Subitem 2' }
                ]
            }
        ]);

        const menuItem = wrapper.find('.menu-item-content.root');
        expect(menuItem.attributes('role')).toBe('menuitem');
        expect(menuItem.attributes('tabindex')).toBe('0');
        expect(menuItem.attributes('aria-haspopup')).toBe('menu');
        expect(menuItem.attributes('aria-expanded')).toBe('false');
        expect(menuItem.attributes('aria-controls')).toBe('top-toolbar-submenu-0');
    });

    it('ArrowDown ou Enter abre o submenu e define aria-expanded="true"', async () => {
        const wrapper = mountToolbar([
            {
                label: 'Opções',
                items: [{ label: 'Item 1' }]
            }
        ]);

        const itemLi = wrapper.find('.p-menubar-item');
        const menuItem = wrapper.find('.menu-item-content.root');

        // Pressiona ArrowDown
        await itemLi.trigger('keydown', { key: 'ArrowDown' });
        await wrapper.vm.$nextTick();

        expect(menuItem.attributes('aria-expanded')).toBe('true');
        expect(wrapper.find('.max-top-toolbar-submenu').exists()).toBe(true);
    });

    it('Enter abre o submenu quando fechado', async () => {
        const wrapper = mountToolbar([
            {
                label: 'Configurações',
                items: [{ label: 'Preferências' }]
            }
        ]);

        const itemLi = wrapper.find('.p-menubar-item');
        const menuItem = wrapper.find('.menu-item-content.root');

        await itemLi.trigger('keydown', { key: 'Enter' });
        await wrapper.vm.$nextTick();

        expect(menuItem.attributes('aria-expanded')).toBe('true');
        expect(wrapper.find('.max-top-toolbar-submenu').exists()).toBe(true);
    });

    it('Escape fecha o submenu ativo e redefine aria-expanded="false"', async () => {
        const wrapper = mountToolbar([
            {
                label: 'Menu',
                items: [{ label: 'Item A' }]
            }
        ]);

        const itemLi = wrapper.find('.p-menubar-item');
        const menuItem = wrapper.find('.menu-item-content.root');

        // Abre
        await itemLi.trigger('keydown', { key: 'ArrowDown' });
        await wrapper.vm.$nextTick();
        expect(menuItem.attributes('aria-expanded')).toBe('true');

        // Fecha com Escape
        await itemLi.trigger('keydown', { key: 'Escape' });
        await wrapper.vm.$nextTick();
        expect(menuItem.attributes('aria-expanded')).toBe('false');
        expect(wrapper.find('.max-top-toolbar-submenu').exists()).toBe(false);
    });

    it('Enter em item sem filhos aciona a ação correspondente', async () => {
        const actionMock = vi.fn();
        const wrapper = mountToolbar([
            {
                label: 'Ação Direta',
                action: actionMock
            }
        ]);

        const itemLi = wrapper.find('.p-menubar-item');
        await itemLi.trigger('keydown', { key: 'Enter' });

        expect(actionMock).toHaveBeenCalledTimes(1);
    });

    it('atribui nome contextual ao item de ícone dinâmico sem metadados', () => {
        const wrapper = mountToolbar([{ icon: 'lucide:more-horizontal' }]);

        expect(wrapper.find('.max-icon-btn').attributes('aria-label')).toBe('Item 1 da barra de ferramentas');
    });

    it('navega horizontalmente na menubar raiz com ArrowRight e ArrowLeft aplicando roving tabindex', async () => {
        const wrapper = mountRealToolbar([
            { label: 'Item 1' },
            { label: 'Item 2' },
            { label: 'Item 3' }
        ]);

        const items = wrapper.findAll('.menu-item-content.root');
        expect(items[0].attributes('tabindex')).toBe('0');
        expect(items[1].attributes('tabindex')).toBe('-1');
        expect(items[2].attributes('tabindex')).toBe('-1');

        const itemLis = wrapper.findAll('.p-menubar-item');

        // ArrowRight: vai para o Item 2
        await itemLis[0].trigger('keydown', { key: 'ArrowRight' });
        await wrapper.vm.$nextTick();

        expect(items[0].attributes('tabindex')).toBe('-1');
        expect(items[1].attributes('tabindex')).toBe('0');
        expect(items[2].attributes('tabindex')).toBe('-1');

        // ArrowRight: vai para o Item 3
        await itemLis[1].trigger('keydown', { key: 'ArrowRight' });
        await wrapper.vm.$nextTick();

        expect(items[1].attributes('tabindex')).toBe('-1');
        expect(items[2].attributes('tabindex')).toBe('0');

        // ArrowRight no último item: circular para o Item 1
        await itemLis[2].trigger('keydown', { key: 'ArrowRight' });
        await wrapper.vm.$nextTick();

        expect(items[0].attributes('tabindex')).toBe('0');
        expect(items[2].attributes('tabindex')).toBe('-1');

        // ArrowLeft no primeiro item: circular para o Item 3
        await itemLis[0].trigger('keydown', { key: 'ArrowLeft' });
        await wrapper.vm.$nextTick();

        expect(items[0].attributes('tabindex')).toBe('-1');
        expect(items[2].attributes('tabindex')).toBe('0');
    });

    it('ignora divisores e itens desabilitados na navegação por setas', async () => {
        const wrapper = mountRealToolbar([
            { label: 'Item A' },
            { divider: true },
            { label: 'Item Desabilitado', disabled: true },
            { label: 'Item B' }
        ]);

        const menuItems = wrapper.findAll('.menu-item-content.root');
        expect(menuItems[0].attributes('tabindex')).toBe('0');
        expect(menuItems[1].attributes('tabindex')).toBe('-1'); // desabilitado

        const itemLis = wrapper.findAll('.p-menubar-item');

        // ArrowRight a partir de Item A pula divider e desabilitado, indo para Item B
        await itemLis[0].trigger('keydown', { key: 'ArrowRight' });
        await wrapper.vm.$nextTick();

        const updatedItems = wrapper.findAll('.menu-item-content.root');
        expect(updatedItems[0].attributes('tabindex')).toBe('-1');
        expect(updatedItems[2].attributes('tabindex')).toBe('0');
    });

    it('teclas Home e End movem foco para primeiro e último item habilitado da menubar', async () => {
        const wrapper = mountRealToolbar([
            { label: 'Primeiro' },
            { label: 'Segundo' },
            { label: 'Último' }
        ]);

        const itemLis = wrapper.findAll('.p-menubar-item');

        // End vai para o último
        await itemLis[0].trigger('keydown', { key: 'End' });
        await wrapper.vm.$nextTick();

        const items = wrapper.findAll('.menu-item-content.root');
        expect(items[0].attributes('tabindex')).toBe('-1');
        expect(items[2].attributes('tabindex')).toBe('0');

        // Home volta para o primeiro
        await itemLis[2].trigger('keydown', { key: 'Home' });
        await wrapper.vm.$nextTick();

        expect(items[0].attributes('tabindex')).toBe('0');
        expect(items[2].attributes('tabindex')).toBe('-1');
    });

    it('navega verticalmente em submenu com ArrowDown e ArrowUp com roving tabindex', async () => {
        const wrapper = mountRealToolbar([
            {
                label: 'Menu',
                items: [
                    { label: 'Sub 1' },
                    { label: 'Sub 2' },
                    { label: 'Sub 3' }
                ]
            }
        ]);

        const rootLi = wrapper.find('.p-menubar-item');
        await rootLi.trigger('keydown', { key: 'ArrowDown' });
        await wrapper.vm.$nextTick();

        const submenu = wrapper.findComponent({ name: 'MaxTopToolbarSubmenu' });
        expect(submenu.exists()).toBe(true);

        const subItems = submenu.findAll('.menu-item-content');
        expect(subItems[0].attributes('tabindex')).toBe('0');
        expect(subItems[1].attributes('tabindex')).toBe('-1');
        expect(subItems[2].attributes('tabindex')).toBe('-1');

        // ArrowDown no submenu item 0 -> vai para sub item 1
        await subItems[0].trigger('keydown', { key: 'ArrowDown' });
        await wrapper.vm.$nextTick();

        expect(subItems[0].attributes('tabindex')).toBe('-1');
        expect(subItems[1].attributes('tabindex')).toBe('0');

        // ArrowUp no submenu item 1 -> volta para sub item 0
        await subItems[1].trigger('keydown', { key: 'ArrowUp' });
        await wrapper.vm.$nextTick();

        expect(subItems[0].attributes('tabindex')).toBe('0');
        expect(subItems[1].attributes('tabindex')).toBe('-1');
    });

    it('ArrowRight abre submenu aninhado e ArrowLeft/Escape fecha e retorna ao pai', async () => {
        const wrapper = mountRealToolbar([
            {
                label: 'Menu Nível 1',
                items: [
                    {
                        label: 'Subnível com Filhos',
                        items: [
                            { label: 'Item Folha' }
                        ]
                    },
                    { label: 'Outro Subitem' }
                ]
            }
        ]);

        const rootLi = wrapper.find('.p-menubar-item');
        await rootLi.trigger('keydown', { key: 'ArrowDown' });
        await wrapper.vm.$nextTick();

        const level1Submenu = wrapper.findComponent({ name: 'MaxTopToolbarSubmenu' });
        expect(level1Submenu.exists()).toBe(true);

        const level1Item = level1Submenu.find('.menu-item-content');
        expect(level1Item.attributes('aria-haspopup')).toBe('menu');

        // ArrowRight no item com filhos abre submenu aninhado (nível 2)
        await level1Item.trigger('keydown', { key: 'ArrowRight' });
        await wrapper.vm.$nextTick();

        const nestedSubmenus = wrapper.findAllComponents({ name: 'MaxTopToolbarSubmenu' });
        expect(nestedSubmenus).toHaveLength(2);

        // ArrowLeft no submenu aninhado fecha-o e retorna foco ao nível 1
        const level2Item = nestedSubmenus[1].find('.menu-item-content');
        await level2Item.trigger('keydown', { key: 'ArrowLeft' });
        await wrapper.vm.$nextTick();

        const remainingSubmenus = wrapper.findAllComponents({ name: 'MaxTopToolbarSubmenu' });
        expect(remainingSubmenus).toHaveLength(1);

        // Escape no nível 1 fecha o submenu raiz e retorna foco à menubar
        await level1Item.trigger('keydown', { key: 'Escape' });
        await wrapper.vm.$nextTick();

        expect(wrapper.findComponent({ name: 'MaxTopToolbarSubmenu' }).exists()).toBe(false);
    });
});
