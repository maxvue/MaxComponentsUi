import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import MaxPopoverMenu from '../../src/components/MaxPopoverMenu.vue';

describe('MaxPopoverMenu - WAI-ARIA e Teclado (Etapa 10)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        document.body.innerHTML = '';
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    const defaultItems = [
        { label: 'Item 1', icon: 'mdi:home' },
        { label: 'Item 2', icon: 'mdi:account' },
        { label: 'Item 3', icon: 'mdi:cog' }
    ];

    function mountMenu(props: Record<string, any> = {}) {
        return mount(MaxPopoverMenu, {
            attachTo: document.body,
            props: {
                items: defaultItems,
                ...props
            },
            global: {
                stubs: {
                    MaxButton: { template: '<button class="max-btn" />' },
                    MaxIcon: { template: '<span class="max-icon" />' }
                },
                directives: {
                    tooltip: {}
                }
            }
        });
    }

    it('gatilho possui role="button", tabindex="0", aria-haspopup="menu", aria-expanded e aria-controls', () => {
        const wrapper = mountMenu();
        const trigger = wrapper.find('.botao');

        expect(trigger.attributes('role')).toBe('button');
        expect(trigger.attributes('tabindex')).toBe('0');
        expect(trigger.attributes('aria-haspopup')).toBe('menu');
        expect(trigger.attributes('aria-expanded')).toBe('false');

        const vm = wrapper.vm as any;
        expect(trigger.attributes('aria-controls')).toBe(vm.menuId);
        expect(vm.menuId).toMatch(/^max-popover-menu-/);
    });

    it('overlay do menu possui ID dinâmico único e elimina o ID estático overlay_menu', async () => {
        const wrapper = mountMenu();
        const trigger = wrapper.find('.botao');

        await trigger.trigger('click');
        expect(document.querySelector('#overlay_menu')).toBeNull();

        const vm = wrapper.vm as any;
        const menuEl = document.querySelector(`[id="${vm.menuId}"]`);
        expect(menuEl).not.toBeNull();
        expect(menuEl?.getAttribute('role')).toBe('menu');
    });

    it('teclas Enter e Espaço no gatilho alternam a visibilidade do menu', async () => {
        const wrapper = mountMenu();
        const trigger = wrapper.find('.botao');

        await trigger.trigger('keydown', { key: 'Enter' });
        expect(document.body.querySelector('.max-popover-menu-overlay')).not.toBeNull();

        await trigger.trigger('keydown', { key: ' ' });
        expect(document.body.querySelector('.max-popover-menu-overlay')).toBeNull();
    });

    it('ArrowDown no gatilho abre o menu e foca o primeiro item', async () => {
        const wrapper = mountMenu();
        const trigger = wrapper.find('.botao');

        await trigger.trigger('keydown', { key: 'ArrowDown' });
        await wrapper.vm.$nextTick();

        const items = document.querySelectorAll('.max-popover-menu-item-wrapper');
        expect(items.length).toBe(3);
        expect(items[0].getAttribute('tabindex')).toBe('0');
        expect(items[1].getAttribute('tabindex')).toBe('-1');
        expect(items[2].getAttribute('tabindex')).toBe('-1');
    });

    it('ArrowUp no gatilho abre o menu e foca o último item', async () => {
        const wrapper = mountMenu();
        const trigger = wrapper.find('.botao');

        await trigger.trigger('keydown', { key: 'ArrowUp' });
        await wrapper.vm.$nextTick();

        const items = document.querySelectorAll('.max-popover-menu-item-wrapper');
        expect(items.length).toBe(3);
        expect(items[0].getAttribute('tabindex')).toBe('-1');
        expect(items[1].getAttribute('tabindex')).toBe('-1');
        expect(items[2].getAttribute('tabindex')).toBe('0');
    });

    it('navegação por setas (ArrowDown / ArrowUp) realiza roving tabindex circular', async () => {
        const wrapper = mountMenu();
        const trigger = wrapper.find('.botao');

        await trigger.trigger('click');
        await wrapper.vm.$nextTick();

        const menuEl = document.querySelector('.max-popover-menu-overlay') as HTMLElement;
        expect(menuEl).not.toBeNull();

        // ArrowDown: 0 -> 1
        menuEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
        await wrapper.vm.$nextTick();
        let items = document.querySelectorAll('.max-popover-menu-item-wrapper');
        expect(items[1].getAttribute('tabindex')).toBe('0');
        expect(items[0].getAttribute('tabindex')).toBe('-1');

        // ArrowDown: 1 -> 2
        menuEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
        await wrapper.vm.$nextTick();
        items = document.querySelectorAll('.max-popover-menu-item-wrapper');
        expect(items[2].getAttribute('tabindex')).toBe('0');

        // ArrowDown circular: 2 -> 0
        menuEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
        await wrapper.vm.$nextTick();
        items = document.querySelectorAll('.max-popover-menu-item-wrapper');
        expect(items[0].getAttribute('tabindex')).toBe('0');

        // ArrowUp circular: 0 -> 2
        menuEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
        await wrapper.vm.$nextTick();
        items = document.querySelectorAll('.max-popover-menu-item-wrapper');
        expect(items[2].getAttribute('tabindex')).toBe('0');
    });

    it('teclas Home e End movem o foco para o primeiro e último item respectivamente', async () => {
        const wrapper = mountMenu();
        const trigger = wrapper.find('.botao');

        await trigger.trigger('click');
        await wrapper.vm.$nextTick();

        const menuEl = document.querySelector('.max-popover-menu-overlay') as HTMLElement;

        // End -> item 2
        menuEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
        await wrapper.vm.$nextTick();
        let items = document.querySelectorAll('.max-popover-menu-item-wrapper');
        expect(items[2].getAttribute('tabindex')).toBe('0');

        // Home -> item 0
        menuEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
        await wrapper.vm.$nextTick();
        items = document.querySelectorAll('.max-popover-menu-item-wrapper');
        expect(items[0].getAttribute('tabindex')).toBe('0');
    });

    it('Enter ou Espaço no item seleciona a opção, fecha o menu e devolve o foco ao gatilho', async () => {
        const actionMock = vi.fn();
        const wrapper = mountMenu({
            items: [
                { label: 'Ação 1', action: actionMock }
            ]
        });
        const trigger = wrapper.find('.botao');
        const triggerEl = trigger.element as HTMLElement;
        const focusSpy = vi.spyOn(triggerEl, 'focus');

        await trigger.trigger('click');
        await wrapper.vm.$nextTick();

        const menuEl = document.querySelector('.max-popover-menu-overlay') as HTMLElement;
        menuEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
        await wrapper.vm.$nextTick();

        expect(actionMock).toHaveBeenCalled();
        expect(document.body.querySelector('.max-popover-menu-overlay')).toBeNull();
        expect(focusSpy).toHaveBeenCalled();
    });

    it('Escape fecha o menu e devolve o foco ao gatilho', async () => {
        const wrapper = mountMenu();
        const trigger = wrapper.find('.botao');
        const triggerEl = trigger.element as HTMLElement;
        const focusSpy = vi.spyOn(triggerEl, 'focus');

        await trigger.trigger('click');
        await wrapper.vm.$nextTick();
        expect(document.body.querySelector('.max-popover-menu-overlay')).not.toBeNull();

        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        await wrapper.vm.$nextTick();

        expect(document.body.querySelector('.max-popover-menu-overlay')).toBeNull();
        expect(focusSpy).toHaveBeenCalled();
    });

    it('registra ouvinte keydown no window SOMENTE quando aberto e remove ao fechar e ao desmontar', async () => {
        const addListenerSpy = vi.spyOn(window, 'addEventListener');
        const removeListenerSpy = vi.spyOn(window, 'removeEventListener');

        const wrapper = mountMenu();

        // Enquanto fechado, não registra listener global no setup
        expect(addListenerSpy).not.toHaveBeenCalledWith('keydown', expect.any(Function));

        // Ao abrir, registra listener
        await wrapper.find('.botao').trigger('click');
        expect(addListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

        // Ao fechar, remove listener
        await wrapper.find('.botao').trigger('click');
        expect(removeListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

        // Ao abrir e desmontar, remove listener
        await wrapper.find('.botao').trigger('click');
        wrapper.unmount();
        expect(removeListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    });
});
