import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import MaxInputSwitch from '../../src/components/MaxInputSwitch.vue';
import InputBase from '../../src/components/InputBase.vue';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach } from 'vitest';

describe('MaxInputSwitch', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('deve montar o componente corretamente', () => {
        const wrapper = mount(MaxInputSwitch, {
            props: { modelValue: false },
            global: { stubs: { ToggleSwitch: true } }
        });
        expect(wrapper.exists()).toBe(true);
    });

    it('emite update:modelValue ao clicar (alterar temp_value)', async () => {
        const wrapper = mount(MaxInputSwitch, {
            props: { modelValue: false },
            global: { stubs: { ToggleSwitch: true } }
        });
        const toggle = wrapper.findComponent({ name: 'ToggleSwitch' });
        await toggle.vm.$emit('update:modelValue', true);
        expect(wrapper.emitted('update:modelValue')).toBeTruthy();
        expect(wrapper.emitted('update:modelValue')?.[1][0]).toBe(true);
    });

    it('renderiza o question se fornecido', () => {
        const wrapper = mount(MaxInputSwitch, {
            props: { modelValue: false, question: 'Ativar recurso?' },
            global: { stubs: { ToggleSwitch: true } }
        });
        expect(wrapper.find('.rotulo').text()).toBe('Ativar recurso?');
    });

    it('computa caution corretamente', () => {
        const wrapper = mount(MaxInputSwitch, {
            props: { modelValue: false, done: false },
            global: { stubs: { ToggleSwitch: true } }
        });
        expect(wrapper.findComponent(InputBase).props('caution')).toBe(true);

        const wrapper2 = mount(MaxInputSwitch, {
            props: { modelValue: false, caution: 'Cuidado' },
            global: { stubs: { ToggleSwitch: true } }
        });
        expect(wrapper2.findComponent(InputBase).props('caution')).toBe('Cuidado');
    });

    it('sincroniza prop modelValue com temp_value', async () => {
        const wrapper = mount(MaxInputSwitch, {
            props: { modelValue: false },
            global: { stubs: { ToggleSwitch: true } }
        });
        await wrapper.setProps({ modelValue: true });
        expect((wrapper.vm as any).temp_value).toBe(true);
    });
});
