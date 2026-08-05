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

    it('renderiza corretamente com InputBase wrapper', () => {
        const wrapper = mountInputNumber();
        expect(wrapper.exists()).toBe(true);
        expect(wrapper.findComponent(InputBase).exists()).toBe(true);
        expect(wrapper.find('input[role="spinbutton"]').exists()).toBe(true);
    });

    it('formata decimal em pt-BR (1234.56 -> 1.234,56)', () => {
        const wrapper = mountInputNumber({ modelValue: 1234.56, minFractionDigits: 2 });
        const input = wrapper.find('input');
        expect((input.element as HTMLInputElement).value).toBe('1.234,56');
    });

    it('formata moeda BRL (1234.56 -> R$ 1.234,56)', () => {
        const wrapper = mountInputNumber({ modelValue: 1234.56, minFractionDigits: 2 }, { mode: 'currency', currency: 'BRL' });
        const input = wrapper.find('input');
        expect((input.element as HTMLInputElement).value).toContain('R$');
        expect((input.element as HTMLInputElement).value).toContain('1.234,56');
    });

    it('round-trip: digitar valor formatado 1.234,56 emite número 1234.56', async () => {
        const wrapper = mountInputNumber({ modelValue: null });
        const input = wrapper.find('input');
        await input.setValue('1.234,56');
        await input.trigger('blur');

        const emitted = wrapper.emitted('update:modelValue')?.pop()?.[0];
        expect(typeof emitted).toBe('number');
        expect(emitted).toBe(1234.56);
    });

    it('useGrouping=false remove separador de milhar', () => {
        const wrapper = mountInputNumber({ modelValue: 1234.56, minFractionDigits: 2 }, { useGrouping: false });
        const input = wrapper.find('input');
        expect((input.element as HTMLInputElement).value).toBe('1234,56');
    });

    it('prefix e suffix aparecem na exibição mas não contaminam o valor emitido', async () => {
        const wrapper = mountInputNumber({ modelValue: 100, prefix: 'R$ ', suffix: ' kWh' });
        const input = wrapper.find('input');
        expect((input.element as HTMLInputElement).value).toBe('R$ 100 kWh');

        await input.setValue('R$ 200 kWh');
        await input.trigger('blur');
        expect(wrapper.emitted('update:modelValue')?.pop()?.[0]).toBe(200);
    });

    it('min faz clamp para cima e max para baixo no blur', async () => {
        const wrapperMin = mountInputNumber({ modelValue: 5, min: 10 });
        const inputMin = wrapperMin.find('input');
        await inputMin.trigger('blur');
        expect(wrapperMin.emitted('update:modelValue')?.pop()?.[0]).toBe(10);

        const wrapperMax = mountInputNumber({ modelValue: 500, max: 100 });
        const inputMax = wrapperMax.find('input');
        await inputMax.trigger('blur');
        expect(wrapperMax.emitted('update:modelValue')?.pop()?.[0]).toBe(100);
    });

    it('ArrowUp e ArrowDown incrementam e decrementam por step', async () => {
        const wrapper = mountInputNumber({ modelValue: 10, step: 5 });
        const input = wrapper.find('input');

        await input.trigger('keydown.up');
        expect(wrapper.emitted('update:modelValue')?.pop()?.[0]).toBe(15);

        await input.trigger('keydown.down');
        expect(wrapper.emitted('update:modelValue')?.pop()?.[0]).toBe(10);
    });

    it('allowEmpty=true emite null quando vazio; allowEmpty=false cai para min ou 0', async () => {
        const wrapperEmpty = mountInputNumber({ modelValue: 10, allowEmpty: true });
        const inputEmpty = wrapperEmpty.find('input');
        await inputEmpty.setValue('');
        await inputEmpty.trigger('blur');
        expect(wrapperEmpty.emitted('update:modelValue')?.pop()?.[0]).toBe(null);

        const wrapperStrict = mountInputNumber({ modelValue: 10, allowEmpty: false, min: 5 });
        const inputStrict = wrapperStrict.find('input');
        await inputStrict.setValue('');
        await inputStrict.trigger('blur');
        expect(wrapperStrict.emitted('update:modelValue')?.pop()?.[0]).toBe(5);
    });

    it('entrada não numérica não emite NaN', async () => {
        const wrapper = mountInputNumber({ modelValue: null });
        const input = wrapper.find('input');
        await input.setValue('texto_invalido');
        await input.trigger('blur');

        const emitted = wrapper.emitted('update:modelValue')?.pop()?.[0];
        expect(emitted).not.toBeNaN();
        expect(emitted).toBe(null);
    });

    it('possui atributos ARIA corretos role=spinbutton e aria-valuenow', () => {
        const wrapper = mountInputNumber({ modelValue: 42, min: 0, max: 100 });
        const input = wrapper.find('input');
        expect(input.attributes('role')).toBe('spinbutton');
        expect(input.attributes('aria-valuenow')).toBe('42');
        expect(input.attributes('aria-valuemin')).toBe('0');
        expect(input.attributes('aria-valuemax')).toBe('100');
    });

    it('valida erro de campo obrigatório quando vazio', async () => {
        const wrapper = mountInputNumber({ required: true, modelValue: null });
        const input = wrapper.find('input');
        await input.trigger('blur');
        const ib = wrapper.findComponent(InputBase);
        expect(ib.props('error')).toBe('Campo obrigatório');
    });

    it('não emite marcações do PrimeVue', () => {
        const wrapper = mountInputNumber({ modelValue: 10 });
        expect(wrapper.html()).not.toContain('data-pc-name');
    });
});
