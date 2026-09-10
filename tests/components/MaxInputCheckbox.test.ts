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

    it('repassa atributo disabled para o input nativo quando desabilitado via prop', () => {
        const wrapper = mount(MaxInputCheckbox, {
            props: { modelValue: false, disabled: true }
        });
        const input = wrapper.find<HTMLInputElement>('input[type="checkbox"]');
        expect(input.attributes('disabled')).toBeDefined();
        expect(input.element.disabled).toBe(true);
    });

    it('repassa atributo disabled para o input nativo quando desabilitado via attrs', () => {
        const wrapper = mount(MaxInputCheckbox, {
            props: { modelValue: false },
            attrs: { disabled: true }
        });
        const input = wrapper.find<HTMLInputElement>('input[type="checkbox"]');
        expect(input.attributes('disabled')).toBeDefined();
        expect(input.element.disabled).toBe(true);
    });

    it('impede emissao de update:modelValue quando interage com componente desabilitado', async () => {
        const wrapper = mount(MaxInputCheckbox, {
            props: { modelValue: false, disabled: true }
        });
        const input = wrapper.find<HTMLInputElement>('input[type="checkbox"]');
        await input.setValue(true);
        expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    });

    it('bloqueia interacao ao clicar na label associada quando desabilitado', async () => {
        const wrapper = mount(MaxInputCheckbox, {
            props: { modelValue: false, disabled: true, label: 'Termos' }
        });
        const label = wrapper.find('label.label-checkbox');
        await label.trigger('click');
        expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    });

    it('repassa atributos de formulario (name, required) para o input nativo', () => {
        const wrapper = mount(MaxInputCheckbox, {
            props: { modelValue: false },
            attrs: { name: 'termo_aceite', required: true }
        });
        const input = wrapper.find('input[type="checkbox"]');
        expect(input.attributes('name')).toBe('termo_aceite');
        expect(input.attributes('required')).toBeDefined();
        expect(wrapper.attributes('name')).toBeUndefined();
        expect(wrapper.attributes('required')).toBeUndefined();
    });

    it('aplica classe disabled no wrapper quando desabilitado', () => {
        const wrapper = mount(MaxInputCheckbox, {
            props: { modelValue: false, disabled: true }
        });
        expect(wrapper.classes()).toContain('disabled');
        expect(wrapper.attributes('disabled')).toBeDefined();
    });
});
