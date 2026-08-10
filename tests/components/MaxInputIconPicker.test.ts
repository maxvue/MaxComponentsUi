import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxInputIconPicker from '../../src/components/MaxInputIconPicker.vue';

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
});
