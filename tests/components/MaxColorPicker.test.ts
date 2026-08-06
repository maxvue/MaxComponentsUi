import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxColorPicker from '../../src/components/MaxColorPicker.vue';
import InputBase from '../../src/components/InputBase.vue';

let activeWrapper: any = null;

function mountColorPicker(props: Record<string, any> = {}, attrs: Record<string, any> = {}) {
    activeWrapper = mount(MaxColorPicker, {
        props: { modelValue: 'ff0000', ...props },
        attrs,
        attachTo: document.body
    });
    return activeWrapper;
}

describe('MaxColorPicker', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    afterEach(() => {
        if (activeWrapper) {
            activeWrapper.unmount();
            activeWrapper = null;
        }
    });

    it('renderiza corretamente com InputBase e sem marcações do PrimeVue', () => {
        const wrapper = mountColorPicker();
        expect(wrapper.exists()).toBe(true);
        expect(wrapper.findComponent(InputBase).exists()).toBe(true);
        expect(wrapper.html()).not.toContain('data-pc-name');
    });

    it('exibe o valor no input de texto', () => {
        const wrapper = mountColorPicker({ modelValue: 'ff0000' });
        const input = wrapper.find('input');
        expect((input.element as HTMLInputElement).value).toBe('ff0000');
    });

    it('sincroniza modelValue ao alterar o texto', async () => {
        const wrapper = mountColorPicker({ modelValue: 'ff0000' });
        const input = wrapper.find('input');
        await input.setValue('00ff00');
        expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['00ff00']);
    });

    it('clicar no preview abre o overlay de cor', async () => {
        const wrapper = mountColorPicker({ modelValue: 'ff0000' });
        const preview = wrapper.find('.p-colorpicker-preview-wrapper');
        await preview.trigger('click');
        await wrapper.vm.$nextTick();

        expect(document.body.querySelector('.p-colorpicker-panel')).not.toBeNull();
    });

    it('não abre se disabled for true', async () => {
        const wrapper = mountColorPicker({ modelValue: 'ff0000', disabled: true });
        const preview = wrapper.find('.p-colorpicker-preview-wrapper');
        await preview.trigger('click');
        await wrapper.vm.$nextTick();

        expect(document.body.querySelector('.p-colorpicker-panel')).toBeNull();
    });
});
