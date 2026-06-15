import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import MaxInputToggle from '../../src/components/MaxInputToggle.vue';

describe('MaxInputToggle', () => {
    it('deve montar o componente corretamente', () => {
        const wrapper = mount(MaxInputToggle, {
            props: { modelValue: false },
            global: { stubs: { ToggleSwitch: true } }
        });
        expect(wrapper.exists()).toBe(true);
    });

    it('renderiza o label se fornecido via attrs', () => {
        const wrapper = mount(MaxInputToggle, {
            props: { modelValue: false },
            attrs: { label: 'Toggle Label', labelCenter: true },
            global: { stubs: { ToggleSwitch: true } }
        });
        expect(wrapper.find('.input-toggle-field-label-div').text()).toBe('Toggle Label');
        expect(wrapper.find('.input-toggle-field-label-main-div').classes()).toContain('label-center');
    });

    it('renderiza trueLabel e falseLabel e aplica active class', () => {
        const wrapper = mount(MaxInputToggle, {
            props: { modelValue: false, trueLabel: 'Ativado', falseLabel: 'Desativado' },
            global: { stubs: { ToggleSwitch: true } }
        });
        const labels = wrapper.findAll('.input-toggle-field-label');
        expect(labels.length).toBe(2);
        expect(labels[0].text()).toBe('Desativado');
        expect(labels[0].classes()).toContain('active'); // because modelValue is false (falseValue)
        expect(labels[1].text()).toBe('Ativado');
    });

    it('sincroniza prop modelValue com modelvalue (ref interno) e emite update', async () => {
        const wrapper = mount(MaxInputToggle, {
            props: { modelValue: false },
            global: { stubs: { ToggleSwitch: true } }
        });

        // Simula mudança de ToggleSwitch
        const toggle = wrapper.findComponent({ name: 'ToggleSwitch' });
        await toggle.vm.$emit('update:modelValue', true);

        expect(wrapper.emitted('update:modelValue')).toBeTruthy();
        expect(wrapper.emitted('update:modelValue')?.[0][0]).toBe(true);

        // Altera via prop (agora que o prop estava false, vamos definir para 'test')
        await wrapper.setProps({ modelValue: 'test' });
        expect((wrapper.vm as any).modelvalue).toBe('test');
    });

    it('resolve trueLabel / falseLabel de attrs (fallback)', () => {
        const wrapper = mount(MaxInputToggle, {
            props: { modelValue: true },
            attrs: { 'true-label': 'Sim', 'false-label': 'Nao' },
            global: { stubs: { ToggleSwitch: true } }
        });
        const labels = wrapper.findAll('.input-toggle-field-label');
        expect(labels[0].text()).toBe('Nao');
        expect(labels[1].text()).toBe('Sim');
        expect(labels[1].classes()).toContain('active');
    });

    it('emite update no change manual', async () => {
        const wrapper = mount(MaxInputToggle, {
            props: { modelValue: false },
            global: { stubs: { ToggleSwitch: true } }
        });
        (wrapper.vm as any).update_value();
        expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    });
});
