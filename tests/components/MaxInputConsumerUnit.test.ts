import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxInputConsumerUnit from '../../src/components/MaxInputConsumerUnit.vue';
import MaxInputText from '../../src/components/MaxInputText.vue';

function mountConsumerUnit(props: Record<string, any> = {}, attrs: Record<string, any> = {}) {
    return mount(MaxInputConsumerUnit, {
        props: { modelValue: null, ...props },
        attrs
    });
}

describe('MaxInputConsumerUnit (I09)', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('renderiza MaxInputText com o rótulo padrão de Unidade consumidora', () => {
        const wrapper = mountConsumerUnit();
        const inputText = wrapper.findComponent(MaxInputText);

        expect(inputText.exists()).toBe(true);
        expect(inputText.props('label')).toBe('Unidade consumidora (UC)');
    });

    it('preserva zeros iniciais, hífens e formatação sem corte', async () => {
        const wrapper = mountConsumerUnit();
        const inputText = wrapper.findComponent(MaxInputText);

        inputText.vm.$emit('update:modelValue', '0000123-4');
        await wrapper.vm.$nextTick();

        expect(wrapper.emitted('update:modelValue')).toEqual([['0000123-4']]);
        expect(wrapper.emitted('change')).toEqual([['0000123-4']]);
    });

    it('emite null quando campo fica vazio', async () => {
        const wrapper = mountConsumerUnit({ modelValue: '123' });
        const inputText = wrapper.findComponent(MaxInputText);

        inputText.vm.$emit('update:modelValue', '');
        await wrapper.vm.$nextTick();

        expect(wrapper.emitted('update:modelValue')).toEqual([[null]]);
        expect(wrapper.emitted('change')).toEqual([[null]]);
    });

    it('apresenta erro de limite de 50 caracteres sem truncar texto colado longo', async () => {
        const longCode = 'A'.repeat(55);
        const wrapper = mountConsumerUnit({ modelValue: longCode });
        const inputText = wrapper.findComponent(MaxInputText);

        expect(inputText.props('error')).toBe('Limite de 50 caracteres excedido');
    });

    it('respeita erro manual com precedência sobre validação local', () => {
        const wrapper = mountConsumerUnit({ modelValue: '12345', error: 'UC inexistente na concessionária' });
        const inputText = wrapper.findComponent(MaxInputText);

        expect(inputText.props('error')).toBe('UC inexistente na concessionária');
    });
});
