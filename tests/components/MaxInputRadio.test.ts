import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import MaxInputRadio from '../../src/components/MaxInputRadio.vue';

describe('MaxInputRadio', () => {
    it('renderiza corretamente com id gerado e name padrão', () => {
        const wrapper = mount(MaxInputRadio, {
            props: { modelValue: null, value: 'opcao1' }
        });
        expect(wrapper.exists()).toBe(true);
        const input = wrapper.find<HTMLInputElement>('input[type="radio"]');
        expect(input.exists()).toBe(true);
        expect(input.attributes('name')).toBe('radio-group');
        expect(input.attributes('id')).toBeTruthy();
    });

    it('utiliza name customizado quando fornecido', () => {
        const wrapper = mount(MaxInputRadio, {
            props: { modelValue: null, value: 'opcao1', name: 'custom-group' }
        });
        const input = wrapper.find('input[type="radio"]');
        expect(input.attributes('name')).toBe('custom-group');
    });

    it('marca radio quando modelValue === value', () => {
        const wrapper = mount(MaxInputRadio, {
            props: { modelValue: 'opcao1', value: 'opcao1' }
        });
        const input = wrapper.find<HTMLInputElement>('input[type="radio"]');
        expect(input.element.checked).toBe(true);
    });

    it('não marca radio quando modelValue !== value', () => {
        const wrapper = mount(MaxInputRadio, {
            props: { modelValue: 'opcao2', value: 'opcao1' }
        });
        const input = wrapper.find<HTMLInputElement>('input[type="radio"]');
        expect(input.element.checked).toBe(false);
    });

    it('emite update:modelValue ao disparar change', async () => {
        const wrapper = mount(MaxInputRadio, {
            props: { modelValue: null, value: 'opcao1' }
        });
        const input = wrapper.find('input[type="radio"]');
        await input.trigger('change');
        expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['opcao1']);
    });

    it('atualiza checked quando modelValue prop muda', async () => {
        const wrapper = mount(MaxInputRadio, {
            props: { modelValue: null, value: 'opcao1' }
        });
        const input = wrapper.find<HTMLInputElement>('input[type="radio"]');
        expect(input.element.checked).toBe(false);

        await wrapper.setProps({ modelValue: 'opcao1' });
        expect(input.element.checked).toBe(true);
    });

    it('dispara seleção ao clicar na div do componente', async () => {
        const wrapper = mount(MaxInputRadio, {
            props: { modelValue: null, value: 'opcao1' },
            attrs: { label: 'Opção 1' }
        });
        const div = wrapper.find('.radio-button-input-main-div');
        await div.trigger('click');
        expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['opcao1']);
    });

    it('renderiza label vindo de attrs', () => {
        const wrapper = mount(MaxInputRadio, {
            props: { modelValue: null, value: 'opcao1' },
            attrs: { label: 'Minha Opção' }
        });
        expect(wrapper.text()).toContain('Minha Opção');
    });
});
