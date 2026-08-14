import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxColorPicker from '../../src/components/MaxColorPicker.vue';
import InputBase from '../../src/components/InputBase.vue';

function mountColorPicker(props: Record<string, any> = {}) {
    return mount(MaxColorPicker, {
        props: { modelValue: '', ...props }
    });
}

describe('MaxColorPicker', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('renderiza corretamente dentro do InputBase', () => {
        const wrapper = mountColorPicker({ label: 'Cor' });

        expect(wrapper.exists()).toBe(true);
        expect(wrapper.findComponent(InputBase).exists()).toBe(true);
    });

    it('emite update:modelValue ao alterar o valor do input de texto', async () => {
        const wrapper = mountColorPicker();
        const input = wrapper.find('input.p-inputtext');
        await input.setValue('#00ff00');

        expect(wrapper.emitted('update:modelValue')).toBeTruthy();
        const emitted = wrapper.emitted('update:modelValue')!;
        expect(emitted[emitted.length - 1]).toEqual(['#00ff00']);
    });

    it('reflete o valor do modelValue passado externamente no input de texto', async () => {
        const wrapper = mountColorPicker({ modelValue: '#123456' });
        const input = wrapper.find('input.p-inputtext');

        expect((input.element as HTMLInputElement).value).toBe('#123456');

        await wrapper.setProps({ modelValue: '#abcdef' });
        expect((input.element as HTMLInputElement).value).toBe('#abcdef');
    });

    it('marca done=true quando required e preenchido', async () => {
        const wrapper = mountColorPicker({ required: true, modelValue: '#ff0000' });
        await wrapper.vm.$nextTick();

        const inputBase = wrapper.findComponent(InputBase);
        expect(inputBase.props('done')).toBe(true);
    });

    it('marca caution/erro quando required e vazio', async () => {
        const wrapper = mountColorPicker({ required: true, modelValue: '' });
        await wrapper.vm.$nextTick();

        const inputBase = wrapper.findComponent(InputBase);
        expect(inputBase.props('error')).toBe('Campo obrigatório');
    });

    it('usa format e defaultColor padrão quando não informados', () => {
        const wrapper = mountColorPicker();
        expect(wrapper.props('format')).toBe('hex');
        expect(wrapper.props('defaultColor')).toBe('ff0000');

        const colorInput = wrapper.find('input[type="color"]');
        expect(colorInput.exists()).toBe(true);
    });
});
