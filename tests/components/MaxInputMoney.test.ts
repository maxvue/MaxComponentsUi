import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxInputMoney from '../../src/components/MaxInputMoney.vue';
import InputBase from '../../src/components/InputBase.vue';

function mountInputMoney(props: Record<string, any> = {}, attrs: Record<string, any> = {}) {
    return mount(MaxInputMoney, {
        props: { modelValue: null, ...props },
        attrs
    });
}

describe('MaxInputMoney', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('renderiza corretamente', () => {
        const wrapper = mountInputMoney();
        expect(wrapper.exists()).toBe(true);
    });

    it('utiliza classe max-input-native e max-input-money sem classes legadas PrimeVue', () => {
        const wrapper = mountInputMoney();
        const input = wrapper.find('input');
        expect(input.classes()).toContain('max-input-native');
        expect(input.classes()).toContain('max-input-money');
        expect(input.classes()).not.toContain('p-inputtext');
        expect(input.classes()).not.toContain('p-component');
    });

    it('renderiza com label e props repassadas para o InputBase', () => {
        const wrapper = mountInputMoney({ label: 'Valor do Contrato' });
        expect(wrapper.text()).toContain('Valor do Contrato');
        const ib = wrapper.findComponent(InputBase);
        expect(ib.exists()).toBe(true);
    });

    it('formata valor inicial com símbolo padrão R$ e 2 casas decimais', () => {
        const wrapper = mountInputMoney({ modelValue: 14.3 });
        const input = wrapper.find('input');
        expect((input.element as HTMLInputElement).value).toBe('R$ 14,30');
    });

    it('formata valor com símbolo customizado U$', () => {
        const wrapper = mountInputMoney({ modelValue: 14.3, symbol: 'U$' });
        const input = wrapper.find('input');
        expect((input.element as HTMLInputElement).value).toBe('U$ 14,30');
    });

    it('formata com casas decimais customizadas (ex: decimals=3)', () => {
        const wrapper = mountInputMoney({ modelValue: 14.345, decimals: 3 });
        const input = wrapper.find('input');
        expect((input.element as HTMLInputElement).value).toBe('R$ 14,345');
    });

    it('formata com decimals=0 (sem casas decimais)', () => {
        const wrapper = mountInputMoney({ modelValue: 1500, decimals: 0 });
        const input = wrapper.find('input');
        expect((input.element as HTMLInputElement).value).toBe('R$ 1.500');
    });

    it('aceita decimals como string ex: decimals="2"', () => {
        const wrapper = mountInputMoney({ modelValue: 25.5, decimals: '2' });
        const input = wrapper.find('input');
        expect((input.element as HTMLInputElement).value).toBe('R$ 25,50');
    });

    it('comportamento de máscara reversa ao digitar números', async () => {
        const wrapper = mountInputMoney({ modelValue: null });
        const input = wrapper.find('input');

        // Digita 1 -> R$ 0,01
        await input.trigger('keydown', { key: '1' });
        expect((input.element as HTMLInputElement).value).toBe('R$ 0,01');
        expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([0.01]);

        // Digita 4 -> R$ 0,14
        await input.trigger('keydown', { key: '4' });
        expect((input.element as HTMLInputElement).value).toBe('R$ 0,14');
        expect(wrapper.emitted('update:modelValue')?.[1]).toEqual([0.14]);

        // Digita 3 -> R$ 1,43
        await input.trigger('keydown', { key: '3' });
        expect((input.element as HTMLInputElement).value).toBe('R$ 1,43');
        expect(wrapper.emitted('update:modelValue')?.[2]).toEqual([1.43]);

        // Digita 0 -> R$ 14,30
        await input.trigger('keydown', { key: '0' });
        expect((input.element as HTMLInputElement).value).toBe('R$ 14,30');
        expect(wrapper.emitted('update:modelValue')?.[3]).toEqual([14.3]);
    });

    it('remove dígitos com Backspace e emite null ao esvaziar', async () => {
        const wrapper = mountInputMoney({ modelValue: 14.3 });
        const input = wrapper.find('input');
        expect((input.element as HTMLInputElement).value).toBe('R$ 14,30');

        // Backspace: 1430 -> 143 (1,43)
        await input.trigger('keydown', { key: 'Backspace' });
        expect((input.element as HTMLInputElement).value).toBe('R$ 1,43');
        expect(wrapper.emitted('update:modelValue')?.slice(-1)[0]).toEqual([1.43]);

        // Backspace: 143 -> 14 (0,14)
        await input.trigger('keydown', { key: 'Backspace' });
        expect((input.element as HTMLInputElement).value).toBe('R$ 0,14');

        // Backspace: 14 -> 1 (0,01)
        await input.trigger('keydown', { key: 'Backspace' });
        expect((input.element as HTMLInputElement).value).toBe('R$ 0,01');

        // Backspace: apaga o último dígito -> limpa e emite null
        await input.trigger('keydown', { key: 'Backspace' });
        expect((input.element as HTMLInputElement).value).toBe('');
        expect(wrapper.emitted('update:modelValue')?.slice(-1)[0]).toEqual([null]);
    });

    it('bloqueia letras e caracteres não numéricos', async () => {
        const wrapper = mountInputMoney({ modelValue: null });
        const input = wrapper.find('input');

        await input.trigger('keydown', { key: 'a' });
        expect((input.element as HTMLInputElement).value).toBe('');
        expect(wrapper.emitted('update:modelValue')).toBeFalsy();

        await input.trigger('keydown', { key: '!' });
        expect((input.element as HTMLInputElement).value).toBe('');
        expect(wrapper.emitted('update:modelValue')).toBeFalsy();
    });

    it('permite valor negativo somente quando allowNegative=true', async () => {
        // Sem allowNegative: o sinal de menos é bloqueado
        const wrapperWithoutNeg = mountInputMoney({ modelValue: 10, allowNegative: false });
        const input1 = wrapperWithoutNeg.find('input');
        await input1.trigger('keydown', { key: '-' });
        expect((input1.element as HTMLInputElement).value).toBe('R$ 10,00');

        // Com allowNegative: o sinal de menos alterna para negativo
        const wrapperWithNeg = mountInputMoney({ modelValue: 10, allowNegative: true });
        const input2 = wrapperWithNeg.find('input');
        await input2.trigger('keydown', { key: '-' });
        expect((input2.element as HTMLInputElement).value).toBe('-R$ 10,00');
        expect(wrapperWithNeg.emitted('update:modelValue')?.slice(-1)[0]).toEqual([-10]);

        // Outro '-' alterna de volta para positivo
        await input2.trigger('keydown', { key: '-' });
        expect((input2.element as HTMLInputElement).value).toBe('R$ 10,00');
        expect(wrapperWithNeg.emitted('update:modelValue')?.slice(-1)[0]).toEqual([10]);
    });

    it('atualiza o valor exibido quando modelValue muda externamente', async () => {
        const wrapper = mountInputMoney({ modelValue: 50 });
        const input = wrapper.find('input');
        expect((input.element as HTMLInputElement).value).toBe('R$ 50,00');

        await wrapper.setProps({ modelValue: 99.9 });
        expect((input.element as HTMLInputElement).value).toBe('R$ 99,90');

        await wrapper.setProps({ modelValue: null });
        expect((input.element as HTMLInputElement).value).toBe('');
    });

    it('processa texto colado via paste', async () => {
        const wrapper = mountInputMoney({ modelValue: null });
        const input = wrapper.find('input');

        await input.trigger('paste', {
            clipboardData: {
                getData: () => '1.250,75'
            }
        });

        expect((input.element as HTMLInputElement).value).toBe('R$ 1.250,75');
        expect(wrapper.emitted('update:modelValue')?.slice(-1)[0]).toEqual([1250.75]);
    });

    it('valida done=true após blur quando required e preenchido', async () => {
        const wrapper = mountInputMoney({ required: true, modelValue: 14.3 });
        const input = wrapper.find('input');
        await input.trigger('blur');
        const ib = wrapper.findComponent(InputBase);
        expect(ib.props('done')).toBe(true);
    });

    it('valida erro de campo obrigatório quando blur e vazio', async () => {
        const wrapper = mountInputMoney({ required: true, modelValue: null });
        const input = wrapper.find('input');
        await input.trigger('blur');
        const ib = wrapper.findComponent(InputBase);
        expect(ib.props('error')).toBe('Campo obrigatório');
    });
});
