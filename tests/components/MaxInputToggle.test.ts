import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import MaxInputToggle from '../../src/components/MaxInputToggle.vue';

describe('MaxInputToggle', () => {
    it('deve montar o componente corretamente e renderizar input role=switch', () => {
        const wrapper = mount(MaxInputToggle, {
            props: { modelValue: false }
        });
        expect(wrapper.exists()).toBe(true);
        expect(wrapper.find('input[role="switch"]').exists()).toBe(true);
    });

    it('renderiza o label se fornecido via attrs', () => {
        const wrapper = mount(MaxInputToggle, {
            props: { modelValue: false },
            attrs: { label: 'Toggle Label', labelCenter: true }
        });
        expect(wrapper.find('.input-toggle-field-label-div').text()).toBe('Toggle Label');
        expect(wrapper.find('.input-toggle-field-label-main-div').classes()).toContain('label-center');
    });

    it('renderiza trueLabel e falseLabel e aplica active class', () => {
        const wrapper = mount(MaxInputToggle, {
            props: { modelValue: false, trueLabel: 'Ativado', falseLabel: 'Desativado' }
        });
        const labels = wrapper.findAll('.input-toggle-field-label');
        expect(labels.length).toBe(2);
        expect(labels[0].text()).toBe('Desativado');
        expect(labels[0].classes()).toContain('active');
        expect(labels[1].text()).toBe('Ativado');
    });

    it('alterna modelValue ao acionar o input role=switch', async () => {
        const wrapper = mount(MaxInputToggle, {
            props: { modelValue: false }
        });
        const input = wrapper.find('input[role="switch"]');
        await input.trigger('change');

        expect(wrapper.emitted('update:modelValue')).toBeTruthy();
        expect(wrapper.emitted('update:modelValue')?.[0][0]).toBe(true);
    });

    it('suporta valores customizados trueValue e falseValue (ex: S/N)', async () => {
        const wrapper = mount(MaxInputToggle, {
            props: { modelValue: 'N', trueValue: 'S', falseValue: 'N' }
        });
        const input = wrapper.find('input[role="switch"]');
        await input.trigger('change');

        expect(wrapper.emitted('update:modelValue')?.[0][0]).toBe('S');
    });

    it('resolve trueLabel / falseLabel de attrs (fallback)', () => {
        const wrapper = mount(MaxInputToggle, {
            props: { modelValue: true },
            attrs: { 'true-label': 'Sim', 'false-label': 'Nao' }
        });
        const labels = wrapper.findAll('.input-toggle-field-label');
        expect(labels[0].text()).toBe('Nao');
        expect(labels[1].text()).toBe('Sim');
        expect(labels[1].classes()).toContain('active');
    });

    it('não altera valor quando disabled=true', async () => {
        const wrapper = mount(MaxInputToggle, {
            props: { modelValue: false, disabled: true }
        });
        const input = wrapper.find('input[role="switch"]');
        await input.trigger('change');

        expect(wrapper.emitted('update:modelValue')).toBeFalsy();
    });

    it('não emite marcações do PrimeVue', () => {
        const wrapper = mount(MaxInputToggle, { props: { modelValue: false } });
        expect(wrapper.html()).not.toContain('data-pc-name');
    });
});
