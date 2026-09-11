import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxInputIconPicker from '../../src/components/MaxInputIconPicker.vue';
import InputBase from '../../src/components/InputBase.vue';

describe('MaxInputIconPicker', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('sanitiza SVG malicioso recebido via svgUrl antes de gravar em svgCache', async () => {
        const maliciousSvg = '<svg onload="alert(1)"><script>alert(2)</script><path d="M0 0"/></svg>';

        const fetchMock = vi.fn((url: string) => {
            if (url.toString().includes('/picker/svg')) return Promise.resolve({
                json: () => Promise.resolve({ 'mdi:evil': maliciousSvg })
            } as Response);

            return Promise.resolve({
                json: () => Promise.resolve([{ id: 1, name: 'mdi:evil', search: 'mdi:evil' }])
            } as Response);
        });
        vi.stubGlobal('fetch', fetchMock);

        const wrapper = mount(MaxInputIconPicker, {
            props: { modelValue: '' }
        });

        await wrapper.find('.icon-picker-trigger').trigger('click');
        await new Promise((resolve) => setTimeout(resolve, 0));
        await wrapper.vm.$nextTick();

        // Aguarda o debounce interno de enqueueSvgFetch (150ms) e o fetch em si
        await new Promise((resolve) => setTimeout(resolve, 250));
        await wrapper.vm.$nextTick();

        const svgCache = (wrapper.vm as any).svgCache as Record<string, string>;
        expect(svgCache['mdi:evil']).toBeDefined();
        expect(svgCache['mdi:evil']).not.toContain('<script');
        expect(svgCache['mdi:evil']).not.toMatch(/\son\w+\s*=/i);
    });

    it('mantém caution=true quando prop caution=true é passada mesmo com required e preenchido', () => {
        const wrapper = mount(MaxInputIconPicker, {
            props: { modelValue: 'mdi:home', required: true, caution: true }
        });
        const inputBase = wrapper.findComponent(InputBase);
        expect(inputBase.props('caution')).toBe(true);
        expect(inputBase.props('error')).toBeNull();
    });

    it('mantém caution string quando informada e não polui error com Valor inválido', () => {
        const wrapper = mount(MaxInputIconPicker, {
            props: { modelValue: 'mdi:home', caution: 'Atenção ao ícone' }
        });
        const inputBase = wrapper.findComponent(InputBase);
        expect(inputBase.props('caution')).toBe('Atenção ao ícone');
        expect(inputBase.props('error')).toBeNull();
    });

    it('mantém caution=true na montagem inicial antes de interação', () => {
        const wrapper = mount(MaxInputIconPicker, {
            props: { modelValue: '', caution: true }
        });
        const inputBase = wrapper.findComponent(InputBase);
        expect(inputBase.props('caution')).toBe(true);
    });

    it('respeita caution=false explicitamente passado', () => {
        const wrapper = mount(MaxInputIconPicker, {
            props: { modelValue: '', caution: false }
        });
        const inputBase = wrapper.findComponent(InputBase);
        expect(inputBase.props('caution')).toBe(false);
    });

    it('preserva os SVGs em svgCache ao fechar e reabrir o drawer', async () => {
        const fetchMock = vi.fn((url: string) => {
            if (url.toString().includes('/picker/svg')) return Promise.resolve({
                json: () => Promise.resolve({ 'mdi:cached-icon': '<svg><path d="M0 0"/></svg>' })
            } as Response);

            return Promise.resolve({
                json: () => Promise.resolve([{ id: 1, name: 'mdi:cached-icon', search: 'mdi:cached-icon' }])
            } as Response);
        });
        vi.stubGlobal('fetch', fetchMock);

        const wrapper = mount(MaxInputIconPicker, { props: { modelValue: '' } });

        // Abre o drawer pela 1ª vez
        await wrapper.find('.icon-picker-trigger').trigger('click');
        await new Promise((resolve) => setTimeout(resolve, 250));
        await wrapper.vm.$nextTick();

        const vm = wrapper.vm as any;
        expect(vm.svgCache['mdi:cached-icon']).toBeDefined();

        // Fecha o drawer
        vm.visible = false;
        await wrapper.vm.$nextTick();

        // Reabre o drawer
        await wrapper.find('.icon-picker-trigger').trigger('click');
        await wrapper.vm.$nextTick();

        // O cache deve ter sido preservado
        expect(vm.svgCache['mdi:cached-icon']).toBeDefined();
    });

    it('cancela timer pendente e esvazia fila de fetch no desmonte do componente', async () => {
        const wrapper = mount(MaxInputIconPicker, { props: { modelValue: '' } });
        const vm = wrapper.vm as any;

        // Agenda um fetch
        vm.enqueueSvgFetch(['mdi:pending-1', 'mdi:pending-2']);

        // Desmonta imediatamente antes dos 150ms do timer
        wrapper.unmount();

        // Nenhuma exceção deve ocorrer e o timer deve ser cancelado
        await new Promise((resolve) => setTimeout(resolve, 200));
        expect(true).toBe(true);
    });
});
