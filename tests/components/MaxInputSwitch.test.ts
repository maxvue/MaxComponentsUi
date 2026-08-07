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
            props: { modelValue: false }
        });
        expect(wrapper.exists()).toBe(true);
    });

    it('emite update:modelValue ao clicar no toggle central', async () => {
        const wrapper = mount(MaxInputSwitch, {
            props: { modelValue: false }
        });
        await wrapper.find('.max-switch-toggle').trigger('click');
        expect(wrapper.emitted('update:modelValue')).toBeTruthy();
        expect(wrapper.emitted('update:modelValue')?.[0][0]).toBe(true);
    });

    it('alterna de volta ao clicar no toggle central duas vezes', async () => {
        const wrapper = mount(MaxInputSwitch, {
            props: { modelValue: true }
        });
        const toggle = wrapper.find('.max-switch-toggle');
        await toggle.trigger('click');
        await toggle.trigger('click');
        expect(wrapper.emitted('update:modelValue')?.[0][0]).toBe(false);
        expect(wrapper.emitted('update:modelValue')?.[1][0]).toBe(true);
    });

    it('renderiza o question como rotulo da direita', () => {
        const wrapper = mount(MaxInputSwitch, {
            props: { modelValue: false, question: 'Ativar recurso?' }
        });
        expect(wrapper.find('.max-switch-label.right').text()).toBe('Ativar recurso?');
    });

    it('o rotulo da direita aplica trueValue e o da esquerda falseValue', async () => {
        const wrapper = mount(MaxInputSwitch, {
            props: { modelValue: false, labelFalse: 'Inativo', labelTrue: 'Ativo' }
        });

        await wrapper.find('.max-switch-label.right').trigger('click');
        expect(wrapper.emitted('update:modelValue')?.[0][0]).toBe(true);

        await wrapper.find('.max-switch-label.left').trigger('click');
        expect(wrapper.emitted('update:modelValue')?.[1][0]).toBe(false);
    });

    it('respeita trueValue/falseValue customizados nos rotulos, inclusive falsy', async () => {
        const wrapper = mount(MaxInputSwitch, {
            props: { modelValue: 0, trueValue: 0, falseValue: 'nao', labelFalse: 'Nao', labelTrue: 'Sim' }
        });

        await wrapper.find('.max-switch-label.left').trigger('click');
        expect(wrapper.emitted('update:modelValue')?.[0][0]).toBe('nao');

        // trueValue falsy (0) precisa ser atribuivel pelo rotulo da direita.
        await wrapper.find('.max-switch-label.right').trigger('click');
        expect(wrapper.emitted('update:modelValue')?.[1][0]).toBe(0);
    });

    it('nao emite quando o campo esta desabilitado', async () => {
        const wrapper = mount(MaxInputSwitch, {
            props: { modelValue: false, disabled: true, labelTrue: 'Ativo' }
        });
        await wrapper.find('.max-switch-toggle').trigger('click');
        await wrapper.find('.max-switch-label.right').trigger('click');
        expect(wrapper.emitted('update:modelValue')).toBeFalsy();
    });

    it('repassa caution para o InputBase', () => {
        const wrapper = mount(MaxInputSwitch, {
            props: { modelValue: false, caution: 'Cuidado' }
        });
        expect(wrapper.findComponent(InputBase).props('caution')).toBe('Cuidado');
    });

    it('sincroniza prop modelValue com temp_value', async () => {
        const wrapper = mount(MaxInputSwitch, {
            props: { modelValue: false }
        });
        await wrapper.setProps({ modelValue: true });
        expect((wrapper.vm as any).temp_value).toBe(true);
    });
});
