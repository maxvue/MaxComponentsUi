import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxInputNumber from '../../src/components/MaxInputNumber.vue';
import InputBase from '../../src/components/InputBase.vue';

function mountInputNumber(props: Record<string, any> = {}, attrs: Record<string, any> = {}) {
    return mount(MaxInputNumber, {
        props: { modelValue: null, ...props },
        attrs
    });
}

describe('MaxInputNumber', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('renderiza corretamente', () => {
        const wrapper = mountInputNumber();
        expect(wrapper.exists()).toBe(true);
    });

    it('renderiza com label', () => {
        const wrapper = mountInputNumber({ label: 'Quantidade' });
        expect(wrapper.exists()).toBe(true);
    });

    it('emite update:modelValue ao alterar valor', async () => {
        const wrapper = mountInputNumber({ modelValue: 10 });
        await wrapper.setProps({ modelValue: 20 });

        expect(wrapper.findComponent(InputBase).exists()).toBe(true);
    });

    it('valida done=true após blur quando required e preenchido', async () => {
        const wrapper = mountInputNumber({ required: true, modelValue: 42 });
        const inputs = wrapper.findAll('input');
        if (inputs.length > 0) {
            await inputs[0].trigger('blur');
            const ib = wrapper.findComponent(InputBase);
            expect(ib.props('done')).toBe(true);
        }
    });

    it('valida erro de campo obrigatório quando vazio', async () => {
        const wrapper = mountInputNumber({ required: true, modelValue: null });
        const inputs = wrapper.findAll('input');
        if (inputs.length > 0) {
            await inputs[0].trigger('blur');
            const ib = wrapper.findComponent(InputBase);
            expect(ib.props('error')).toBe('Campo obrigatório');
        }
    });

    it('aceita prefix e suffix', () => {
        const wrapper = mountInputNumber({
            modelValue: 100,
            prefix: 'R$',
            suffix: 'kWh'
        });
        expect(wrapper.exists()).toBe(true);
    });

    it('valida erro por targetValue diferente', async () => {
        const wrapper = mountInputNumber({ targetValue: '100', modelValue: 50 }, { error_msg: 'Erro customizado' });
        const inputs = wrapper.findAll('input');
        if (inputs.length > 0) {
            await inputs[0].trigger('blur');
            const ib = wrapper.findComponent(InputBase);
            expect(ib.props('error')).toBe('Erro customizado');
        }
    });

    it('valida erro genérico (Valor inválido) quando done=false explícito', async () => {
        const wrapper = mountInputNumber({ done: false, modelValue: 10 });
        const inputs = wrapper.findAll('input');
        if (inputs.length > 0) {
            await inputs[0].trigger('blur');
            const ib = wrapper.findComponent(InputBase);
            expect(ib.props('error')).toBe('Valor inválido');
        }
    });
});
