import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxInputMonthDays from '../../src/components/MaxInputMonthDays.vue';

function mountMonthDays(props: Record<string, any> = {}) {
    return mount(MaxInputMonthDays, {
        props: { modelValue: [], ...props }
    });
}

describe('MaxInputMonthDays', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('renderiza corretamente com lista de dias vazia', () => {
        const wrapper = mountMonthDays();
        expect(wrapper.exists()).toBe(true);
        const input = wrapper.find('input');
        expect((input.element as HTMLInputElement).value).toBe('');
    });

    it('formata array de dias separados por vírgula e espaço', () => {
        const wrapper = mountMonthDays({ modelValue: [1, 15, 30] });
        const input = wrapper.find('input');
        expect((input.element as HTMLInputElement).value).toBe('1, 15, 30');
    });

    it('remove duplicatas preservando a ordem ao digitar', async () => {
        const wrapper = mountMonthDays();
        const input = wrapper.find('input');

        await input.setValue('15, 2, 15, 10');
        const emitted = wrapper.emitted('update:modelValue')!;
        expect(emitted[emitted.length - 1]).toEqual([[15, 2, 10]]);
    });

    it('aceita espaços entre os números', async () => {
        const wrapper = mountMonthDays();
        const input = wrapper.find('input');

        await input.setValue('  5 ,   12 ,  28  ');
        const emitted = wrapper.emitted('update:modelValue')!;
        expect(emitted[emitted.length - 1]).toEqual([[5, 12, 28]]);
    });

    it('rejeita dia 0 ou maior que 31 preservando o modelo anterior', async () => {
        const wrapper = mountMonthDays({ modelValue: [5] });
        const input = wrapper.find('input');

        await input.setValue('0, 15');
        expect(wrapper.text()).toContain('Dias devem ser entre 1 e 31');
        expect(wrapper.emitted('update:modelValue')).toBeUndefined();

        await input.setValue('32');
        expect(wrapper.text()).toContain('Dias devem ser entre 1 e 31');
        expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    });

    it('rejeita valores não numéricos como 12abc preservando o modelo anterior', async () => {
        const wrapper = mountMonthDays({ modelValue: [10] });
        const input = wrapper.find('input');

        await input.setValue('12abc');
        expect(wrapper.text()).toContain('Valor \'12abc\' não é um dia válido');
        expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    });

    it('rejeita frações e decimais preservando o modelo anterior', async () => {
        const wrapper = mountMonthDays({ modelValue: [1] });
        const input = wrapper.find('input');

        await input.setValue('1.5');
        expect(wrapper.text()).toContain('Valores decimais não são permitidos');
        expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    });

    it('rejeita vírgula final ou tokens vazios preservando o modelo anterior', async () => {
        const wrapper = mountMonthDays({ modelValue: [1, 2] });
        const input = wrapper.find('input');

        await input.setValue('1, 2, ');
        expect(wrapper.text()).toContain('vírgula sem dia correspondente');
        expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    });

    it('emite array vazio ao limpar o input', async () => {
        const wrapper = mountMonthDays({ modelValue: [1, 2] });
        const input = wrapper.find('input');

        await input.setValue('');
        const emitted = wrapper.emitted('update:modelValue')!;
        expect(emitted[emitted.length - 1]).toEqual([[]]);
    });

    it('atualiza exibição diante de mudança externa do modelValue', async () => {
        const wrapper = mountMonthDays({ modelValue: [3] });
        const input = wrapper.find('input');
        expect((input.element as HTMLInputElement).value).toBe('3');

        await wrapper.setProps({ modelValue: [7, 14, 21] });
        expect((input.element as HTMLInputElement).value).toBe('7, 14, 21');
    });
});
