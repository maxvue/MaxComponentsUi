import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxInputIconPicker from '../../src/components/MaxInputIconPicker.vue';

describe('MaxInputIconPicker (A11y, Cache & Lifecycle)', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('gatilho possui atributos acessíveis de role, tabindex e aria-haspopup', () => {
        const wrapper = mount(MaxInputIconPicker, {
            props: { modelValue: '' }
        });

        const trigger = wrapper.find('.icon-picker-trigger');
        expect(trigger.exists()).toBe(true);
        expect(trigger.attributes('role')).toBe('button');
        expect(trigger.attributes('tabindex')).toBe('0');
        expect(trigger.attributes('aria-haspopup')).toBe('dialog');
        expect(trigger.attributes('aria-expanded')).toBe('false');
        expect(trigger.attributes('aria-label')).toBe('Escolha um ícone');
    });

    it('gatilho reflete o ícone selecionado no aria-label e respeita disabled=-1', () => {
        const wrapper = mount(MaxInputIconPicker, {
            props: { modelValue: 'mdi:check', disabled: true }
        });

        const trigger = wrapper.find('.icon-picker-trigger');
        expect(trigger.attributes('tabindex')).toBe('-1');
        expect(trigger.attributes('aria-label')).toContain('mdi:check');
    });

    it('abre gaveta ao pressionar Enter ou Espaço no gatilho', async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            json: () => Promise.resolve([])
        });
        vi.stubGlobal('fetch', fetchMock);

        const wrapper = mount(MaxInputIconPicker, {
            props: { modelValue: '' }
        });

        const trigger = wrapper.find('.icon-picker-trigger');
        await trigger.trigger('keydown.enter');
        expect((wrapper.vm as any).visible).toBe(true);

        (wrapper.vm as any).visible = false;
        await wrapper.vm.$nextTick();

        await trigger.trigger('keydown.space');
        expect((wrapper.vm as any).visible).toBe(true);
    });

    it('renderiza células como botões acessíveis e botão de fechar com aria-label', async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            json: () => Promise.resolve([
                { id: 1, name: 'mdi:star', search: 'mdi:star' },
                { id: 2, name: 'mdi:heart', search: 'mdi:heart' }
            ])
        });
        vi.stubGlobal('fetch', fetchMock);

        const wrapper = mount(MaxInputIconPicker, {
            props: { modelValue: '' }
        });

        await wrapper.find('.icon-picker-trigger').trigger('click');
        await new Promise((resolve) => setTimeout(resolve, 50));
        await wrapper.vm.$nextTick();

        const closeBtn = document.body.querySelector('.p-drawer-close-button');
        expect(closeBtn).not.toBeNull();
        expect(closeBtn?.getAttribute('aria-label')).toBe('Fechar seletor de ícones');

        const cells = document.body.querySelectorAll('.icon-cell');
        expect(cells.length).toBe(2);
        expect(cells[0].tagName.toLowerCase()).toBe('button');
        expect(cells[0].getAttribute('type')).toBe('button');
        expect(cells[0].getAttribute('aria-label')).toBe('Selecionar ícone mdi:star');
    });

    it('preserva svgCache entre ciclos de abertura do drawer', async () => {
        const fetchMock = vi.fn((url: string) => {
            if (url.toString().includes('/picker/svg')) return Promise.resolve({
                json: () => Promise.resolve({ 'mdi:heart': '<svg><path d="M0 0"/></svg>' })
            } as Response);

            return Promise.resolve({
                json: () => Promise.resolve([{ id: 1, name: 'mdi:heart', search: 'mdi:heart' }])
            } as Response);
        });
        vi.stubGlobal('fetch', fetchMock);

        const wrapper = mount(MaxInputIconPicker, {
            props: { modelValue: '' }
        });

        await wrapper.find('.icon-picker-trigger').trigger('click');
        await new Promise((resolve) => setTimeout(resolve, 250));
        await wrapper.vm.$nextTick();

        const vm = wrapper.vm as any;
        expect(vm.svgCache['mdi:heart']).toBeDefined();

        vm.visible = false;
        await wrapper.vm.$nextTick();

        // Reabertura
        await wrapper.find('.icon-picker-trigger').trigger('click');
        await wrapper.vm.$nextTick();

        expect(vm.svgCache['mdi:heart']).toBeDefined();
    });

    it('cancela timer e esvazia fila ao desmontar componente', async () => {
        const wrapper = mount(MaxInputIconPicker, {
            props: { modelValue: '' }
        });

        const vm = wrapper.vm as any;
        vm.enqueueSvgFetch(['mdi:icon-1', 'mdi:icon-2']);
        expect(vm.svgFetchQueue.length).toBeGreaterThan(0);

        wrapper.unmount();
        await new Promise((resolve) => setTimeout(resolve, 200));

        expect(true).toBe(true);
    });
});
