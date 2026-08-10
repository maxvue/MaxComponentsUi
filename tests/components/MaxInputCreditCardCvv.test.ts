import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxInputCreditCardCvv from '../../src/components/MaxInputCreditCardCvv.vue';
import InputBase from '../../src/components/InputBase.vue';

function mountCvv(props: Record<string, any> = {}) {
    return mount(MaxInputCreditCardCvv, {
        props: { modelValue: '', ...props },
        global: {
            stubs: {
                InputBase: { template: '<div><slot /></div>', props: ['error', 'caution', 'done', 'required', 'label'] },
                MaxIcon: true
            }
        }
    });
}

describe('MaxInputCreditCardCvv', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('renderiza corretamente', () => {
        const wrapper = mountCvv();
        expect(wrapper.exists()).toBe(true);
    });

    it('máscara padrão usa 3 dígitos (len=3)', () => {
        const wrapper = mountCvv();
        const maskValue = (wrapper.vm as any).maskValue;
        expect(maskValue.mask).toBe('###');
    });

    it('prop len customizada altera a máscara (ex.: Amex len=4)', () => {
        const wrapper = mountCvv({ len: 4 });
        const maskValue = (wrapper.vm as any).maskValue;
        expect(maskValue.mask).toBe('####');
    });

    it('ciclo v-model: alterar unmaskedValue emite update:modelValue desmascarado', async () => {
        const wrapper = mountCvv();
        (wrapper.vm as any).unmaskedValue = '123';
        await wrapper.vm.$nextTick();

        expect(wrapper.emitted('update:modelValue')).toBeTruthy();
        expect(wrapper.emitted('update:modelValue')?.pop()).toEqual(['123']);
    });

    it('CVV com tamanho correto marca done=true ao perder o foco', async () => {
        const wrapper = mountCvv();
        (wrapper.vm as any).unmaskedValue = '123';
        await wrapper.vm.$nextTick();
        (wrapper.vm as any).checkDone();
        await wrapper.vm.$nextTick();

        expect((wrapper.vm as any).done).toBe(true);
    });

    it('CVV com tamanho incorreto marca done=false e exibe erro', async () => {
        const wrapper = mountCvv();
        (wrapper.vm as any).unmaskedValue = '12';
        await wrapper.vm.$nextTick();
        (wrapper.vm as any).checkDone();
        await wrapper.vm.$nextTick();

        expect((wrapper.vm as any).done).toBe(false);
        const inputBase = wrapper.findComponent(InputBase);
        expect(inputBase.props('error')).toBe('CVV inválido');
    });

    it('campo obrigatório vazio exibe "Campo obrigatório" ao perder o foco', async () => {
        const wrapper = mountCvv({ required: true });
        (wrapper.vm as any).checkDone();
        await wrapper.vm.$nextTick();

        const inputBase = wrapper.findComponent(InputBase);
        expect(inputBase.props('error')).toBe('Campo obrigatório');
    });

    it('não regride Etapa 7c: modelValue externo com mesmos dígitos não reescreve temp_value', async () => {
        const wrapper = mountCvv({ modelValue: '123' });
        (wrapper.vm as any).temp_value = '123';

        await wrapper.setProps({ modelValue: '123' });
        await wrapper.vm.$nextTick();

        expect((wrapper.vm as any).temp_value).toBe('123');
    });

    it('modelValue externo com dígitos diferentes atualiza temp_value', async () => {
        const wrapper = mountCvv({ modelValue: '123' });
        await wrapper.setProps({ modelValue: '456' });
        await wrapper.vm.$nextTick();

        expect((wrapper.vm as any).temp_value).toBe('456');
    });
});
