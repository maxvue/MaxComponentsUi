import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxInputCreditCardDate from '../../src/components/MaxInputCreditCardDate.vue';
import InputBase from '../../src/components/InputBase.vue';

function mountDate(props: Record<string, any> = {}) {
    return mount(MaxInputCreditCardDate, {
        props: { modelValue: '', ...props },
        global: {
            stubs: {
                InputBase: { template: '<div><slot /></div>', props: ['error', 'caution', 'done', 'required', 'label'] },
                MaxIcon: true
            }
        }
    });
}

describe('MaxInputCreditCardDate', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('renderiza corretamente', () => {
        const wrapper = mountDate();
        expect(wrapper.exists()).toBe(true);
    });

    it('máscara aplicada como MM/AA', () => {
        const wrapper = mountDate();
        const maskValue = (wrapper.vm as any).maskValue;
        expect(maskValue.mask).toBe('##/##');
    });

    it('ciclo v-model: alterar unmaskedValue emite update:modelValue desmascarado', async () => {
        const wrapper = mountDate();
        (wrapper.vm as any).unmaskedValue = '1230';
        await wrapper.vm.$nextTick();

        expect(wrapper.emitted('update:modelValue')).toBeTruthy();
        expect(wrapper.emitted('update:modelValue')?.pop()).toEqual(['1230']);
    });

    it('data com mês válido (01-12) marca done=true ao perder o foco', async () => {
        const wrapper = mountDate();
        (wrapper.vm as any).unmaskedValue = '1230'; // mes 12
        await wrapper.vm.$nextTick();
        (wrapper.vm as any).checkDone();
        await wrapper.vm.$nextTick();

        expect((wrapper.vm as any).done).toBe(true);
    });

    it('data com mês inválido (>12) marca done=false e exibe erro', async () => {
        const wrapper = mountDate();
        (wrapper.vm as any).unmaskedValue = '1330'; // mes 13, invalido
        await wrapper.vm.$nextTick();
        (wrapper.vm as any).checkDone();
        await wrapper.vm.$nextTick();

        expect((wrapper.vm as any).done).toBe(false);
        const inputBase = wrapper.findComponent(InputBase);
        expect(inputBase.props('error')).toBe('Validade inválida');
    });

    it('data com mês "00" é inválida', async () => {
        const wrapper = mountDate();
        (wrapper.vm as any).unmaskedValue = '0030';
        await wrapper.vm.$nextTick();
        (wrapper.vm as any).checkDone();
        await wrapper.vm.$nextTick();

        expect((wrapper.vm as any).done).toBe(false);
    });

    it('data incompleta (menos de 4 dígitos) é inválida', async () => {
        const wrapper = mountDate();
        (wrapper.vm as any).unmaskedValue = '12';
        await wrapper.vm.$nextTick();
        (wrapper.vm as any).checkDone();
        await wrapper.vm.$nextTick();

        expect((wrapper.vm as any).done).toBe(false);
    });

    it('campo obrigatório vazio exibe "Campo obrigatório" ao perder o foco', async () => {
        const wrapper = mountDate({ required: true });
        (wrapper.vm as any).checkDone();
        await wrapper.vm.$nextTick();

        const inputBase = wrapper.findComponent(InputBase);
        expect(inputBase.props('error')).toBe('Campo obrigatório');
    });

    it('não regride Etapa 7c: modelValue externo com mesmos dígitos não reescreve temp_value', async () => {
        const wrapper = mountDate({ modelValue: '1230' });
        (wrapper.vm as any).temp_value = '12/30';

        await wrapper.setProps({ modelValue: '1230' });
        await wrapper.vm.$nextTick();

        expect((wrapper.vm as any).temp_value).toBe('12/30');
    });

    it('modelValue externo com dígitos diferentes atualiza temp_value', async () => {
        const wrapper = mountDate({ modelValue: '1230' });
        await wrapper.setProps({ modelValue: '0131' });
        await wrapper.vm.$nextTick();

        // A diretiva v-maska real reaplica a formatação de forma assíncrona;
        // o que importa é que os dígitos batem com o novo modelValue.
        expect((wrapper.vm as any).temp_value.replace(/\D/g, '')).toBe('0131');
    });
});
