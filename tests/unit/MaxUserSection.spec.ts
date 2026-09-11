import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxUserSection from '../../src/components/MaxUserSection.vue';

describe('MaxUserSection - WAI-ARIA e Teclado (Etapa 10)', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        vi.clearAllMocks();
        document.body.innerHTML = '';
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    function mountSection(props: Record<string, any> = {}) {
        return mount(MaxUserSection, {
            attachTo: document.body,
            props: {
                name: 'João Silva',
                companyName: 'Engeapp',
                ...props
            },
            global: {
                stubs: {
                    MaxUserAvatar: { template: '<div class="max-user-avatar" />' },
                    MaxIcon: { template: '<i class="max-icon" />' }
                }
            }
        });
    }

    it('gatilho possui role="button", tabindex="0", aria-haspopup="menu", aria-label="Perfil do usuário", aria-expanded e aria-controls', () => {
        const wrapper = mountSection();
        const trigger = wrapper.find('.user-section');

        expect(trigger.attributes('role')).toBe('button');
        expect(trigger.attributes('tabindex')).toBe('0');
        expect(trigger.attributes('aria-haspopup')).toBe('menu');
        expect(trigger.attributes('aria-label')).toBe('Perfil do usuário');
        expect(trigger.attributes('aria-expanded')).toBe('false');

        const vm = wrapper.vm as any;
        expect(trigger.attributes('aria-controls')).toBe(vm.userMenuId);
        expect(vm.userMenuId).toMatch(/^max-user-menu-/);
    });

    it('overlay do menu de usuário possui ID dinâmico e elimina o id estático overlay_tmenu', async () => {
        const wrapper = mountSection();
        await wrapper.find('.user-section').trigger('click');

        expect(document.querySelector('#overlay_tmenu')).toBeNull();

        const vm = wrapper.vm as any;
        const menuEl = document.querySelector(`[id="${vm.userMenuId}"]`);
        expect(menuEl).not.toBeNull();
        expect(menuEl?.getAttribute('role')).toBe('menu');
    });

    it('teclas Enter, Espaço e ArrowDown no gatilho abrem o menu', async () => {
        const wrapper = mountSection();
        const trigger = wrapper.find('.user-section');

        // Enter abre
        await trigger.trigger('keydown', { key: 'Enter' });
        expect(document.querySelector('.max-user-section-overlay')).not.toBeNull();

        // Espaço fecha quando já aberto
        await trigger.trigger('keydown', { key: ' ' });
        expect(document.querySelector('.max-user-section-overlay')).toBeNull();

        // ArrowDown abre e foca
        await trigger.trigger('keydown', { key: 'ArrowDown' });
        await wrapper.vm.$nextTick();
        expect(document.querySelector('.max-user-section-overlay')).not.toBeNull();
    });

    it('aplica roving tabindex nos itens do menu ignorando separadores', async () => {
        const wrapper = mountSection();
        await wrapper.find('.user-section').trigger('click');
        await wrapper.vm.$nextTick();

        const items = document.querySelectorAll('.main-item-menu-div');
        expect(items.length).toBeGreaterThan(0);
        expect(items[0].getAttribute('tabindex')).toBe('0');
        expect(items[1].getAttribute('tabindex')).toBe('-1');

        const separators = document.querySelectorAll('.max-user-section-separator');
        expect(separators.length).toBeGreaterThan(0);
        separators.forEach((sep) => {
            expect(sep.getAttribute('role')).toBe('separator');
            expect(sep.getAttribute('tabindex')).toBeNull();
        });
    });

    it('navegação por setas (ArrowDown / ArrowUp) pula separadores e cicla o foco', async () => {
        const wrapper = mountSection();
        await wrapper.find('.user-section').trigger('click');
        await wrapper.vm.$nextTick();

        const menuEl = document.querySelector('.max-user-section-overlay') as HTMLElement;
        expect(menuEl).not.toBeNull();

        // ArrowDown para o segundo item navegável
        menuEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
        await wrapper.vm.$nextTick();
        let items = document.querySelectorAll('.main-item-menu-div');
        expect(items[1].getAttribute('tabindex')).toBe('0');

        // ArrowUp volta para o primeiro
        menuEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
        await wrapper.vm.$nextTick();
        items = document.querySelectorAll('.main-item-menu-div');
        expect(items[0].getAttribute('tabindex')).toBe('0');
    });

    it('Home e End movem para o primeiro e último item navegável', async () => {
        const wrapper = mountSection();
        await wrapper.find('.user-section').trigger('click');
        await wrapper.vm.$nextTick();

        const menuEl = document.querySelector('.max-user-section-overlay') as HTMLElement;
        const items = document.querySelectorAll('.main-item-menu-div');
        const lastIdx = items.length - 1;

        // End -> último
        menuEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
        await wrapper.vm.$nextTick();
        expect(items[lastIdx].getAttribute('tabindex')).toBe('0');

        // Home -> primeiro
        menuEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
        await wrapper.vm.$nextTick();
        expect(items[0].getAttribute('tabindex')).toBe('0');
    });

    it('Enter em um item executa a ação, fecha o menu e devolve foco ao gatilho', async () => {
        const wrapper = mountSection();
        const trigger = wrapper.find('.user-section');
        const focusSpy = vi.spyOn(trigger.element as HTMLElement, 'focus');

        await trigger.trigger('click');
        await wrapper.vm.$nextTick();

        const menuEl = document.querySelector('.max-user-section-overlay') as HTMLElement;
        // Pressiona Enter no primeiro item ("Meu perfil")
        menuEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
        await wrapper.vm.$nextTick();

        expect(wrapper.emitted('profile')).toHaveLength(1);
        expect(document.querySelector('.max-user-section-overlay')).toBeNull();
        expect(focusSpy).toHaveBeenCalled();
    });

    it('Escape fecha o menu e restaura o foco no elemento raiz do perfil', async () => {
        const wrapper = mountSection();
        const trigger = wrapper.find('.user-section');
        const focusSpy = vi.spyOn(trigger.element as HTMLElement, 'focus');

        await trigger.trigger('click');
        await wrapper.vm.$nextTick();
        expect(document.querySelector('.max-user-section-overlay')).not.toBeNull();

        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        await wrapper.vm.$nextTick();

        expect(document.querySelector('.max-user-section-overlay')).toBeNull();
        expect(focusSpy).toHaveBeenCalled();
    });

    it('registra ouvinte global de keydown apenas enquanto o menu estiver aberto', async () => {
        const addSpy = vi.spyOn(window, 'addEventListener');
        const removeSpy = vi.spyOn(window, 'removeEventListener');

        const wrapper = mountSection();

        // Fechado -> sem listener
        expect(addSpy).not.toHaveBeenCalledWith('keydown', expect.any(Function));

        // Aberto -> com listener
        await wrapper.find('.user-section').trigger('click');
        expect(addSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

        // Fechado -> remove
        await wrapper.find('.user-section').trigger('click');
        expect(removeSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

        // Aberto e desmontado -> remove
        await wrapper.find('.user-section').trigger('click');
        wrapper.unmount();
        expect(removeSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    });

    it('fecha o menu ao clicar fora do componente no documento', async () => {
        const wrapper = mountSection();
        await wrapper.find('.user-section').trigger('click');
        await wrapper.vm.$nextTick();
        expect(document.querySelector('.max-user-section-overlay')).not.toBeNull();

        const outside = document.createElement('div');
        document.body.appendChild(outside);

        outside.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
        outside.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        await wrapper.vm.$nextTick();

        expect(document.querySelector('.max-user-section-overlay')).toBeNull();
        outside.remove();
    });
});
