import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import MaxInputCheckbox from '../../src/components/MaxInputCheckbox.vue';

describe('MaxInputCheckbox', () => {
    it('renderiza com label corretamente', () => {
        const wrapper = mount(MaxInputCheckbox, {
            props: { modelValue: false, label: 'Aceito' }
        });
        expect(wrapper.exists()).toBe(true);
        expect(wrapper.classes()).not.toContain('no-label');
        const label = wrapper.find('.label-checkbox');
        expect(label.exists()).toBe(true);
        expect(label.text()).toBe('Aceito');
    });

    it('renderiza sem label com classe no-label', () => {
        const wrapper = mount(MaxInputCheckbox, {
            props: { modelValue: false }
        });
        expect(wrapper.classes()).toContain('no-label');
        expect(wrapper.find('.label-checkbox').exists()).toBe(false);
    });

    it('reflete modelValue inicial', () => {
        const wrapper = mount(MaxInputCheckbox, {
            props: { modelValue: true }
        });
        const input = wrapper.find<HTMLInputElement>('input[type="checkbox"]');
        expect(input.element.checked).toBe(true);
    });

    it('emite update:modelValue ao alterar o checkbox', async () => {
        const wrapper = mount(MaxInputCheckbox, {
            props: { modelValue: false }
        });
        const input = wrapper.find('input[type="checkbox"]');
        await input.setValue(true);
        expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([true]);

        await input.setValue(false);
        expect(wrapper.emitted('update:modelValue')?.[1]).toEqual([false]);
    });

    it('atualiza o input quando modelValue prop muda', async () => {
        const wrapper = mount(MaxInputCheckbox, {
            props: { modelValue: false }
        });
        const input = wrapper.find<HTMLInputElement>('input[type="checkbox"]');
        expect(input.element.checked).toBe(false);

        await wrapper.setProps({ modelValue: true });
        expect(input.element.checked).toBe(true);
    });

    it('associa label ao input via id', () => {
        const wrapper = mount(MaxInputCheckbox, {
            props: { modelValue: false, label: 'Aceitar Termos' }
        });
        const input = wrapper.find('input[type="checkbox"]');
        const label = wrapper.find('label.label-checkbox');
        const inputId = input.attributes('id');

        expect(inputId).toBeTruthy();
        expect(label.attributes('for')).toBe(inputId);
    });

    it('repassa atributo circle para o wrapper raiz', () => {
        const wrapper = mount(MaxInputCheckbox, {
            props: { modelValue: false },
            attrs: { circle: '' }
        });
        expect(wrapper.attributes('circle')).toBeDefined();
    });
});
