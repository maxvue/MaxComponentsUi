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
                    MaxIconButton: { template: '<button class="max-icon-btn" />' },
                    MaxTopToolbarSubmenu: {
                        template: '<div class="max-top-toolbar-submenu" />',
                        props: ['items'],
                        emits: ['keep-open', 'schedule-close', 'item-click']
                    }
                }
            }
        });
    }

    it('itens com filhos recebem role="menuitem", tabindex="0", aria-haspopup="true" e aria-expanded', async () => {
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
        expect(menuItem.attributes('aria-haspopup')).toBe('true');
        expect(menuItem.attributes('aria-expanded')).toBe('false');
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
});
