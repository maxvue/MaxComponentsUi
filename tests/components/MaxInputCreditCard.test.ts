import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxInputCreditCard from '../../src/components/MaxInputCreditCard.vue';
import InputBase from '../../src/components/InputBase.vue';

function mountCreditCard(props: Record<string, any> = {}) {
    return mount(MaxInputCreditCard, {
        props: { modelValue: '', ...props },
        global: {
            stubs: {
                InputBase: { template: '<div><slot /></div>', props: ['error', 'caution', 'done', 'required', 'label'] },
                MaxIcon: true
            }
        }
    });
}

// Número de cartão de teste válido (Visa, algoritmo de Luhn ok)
const VALID_CARD = '4111111111111111';

describe('MaxInputCreditCard', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('renderiza corretamente', () => {
        const wrapper = mountCreditCard();
        expect(wrapper.exists()).toBe(true);
    });

    it('máscara aplicada em grupos de 4 dígitos', () => {
        const wrapper = mountCreditCard();
        const maskValue = (wrapper.vm as any).maskValue;
        expect(maskValue.mask).toBe('#### #### #### ####');
    });

    it('ciclo v-model: alterar unmaskedValue emite update:modelValue desmascarado', async () => {
        const wrapper = mountCreditCard();
        (wrapper.vm as any).unmaskedValue = VALID_CARD;
        await wrapper.vm.$nextTick();

        expect(wrapper.emitted('update:modelValue')).toBeTruthy();
        expect(wrapper.emitted('update:modelValue')?.pop()).toEqual([VALID_CARD]);
    });

    it('cartão válido marca done=true ao perder o foco', async () => {
        const wrapper = mountCreditCard();
        (wrapper.vm as any).unmaskedValue = VALID_CARD;
        await wrapper.vm.$nextTick();
        (wrapper.vm as any).checkDone();
        await wrapper.vm.$nextTick();

        expect((wrapper.vm as any).done).toBe(true);
    });

    it('cartão inválido marca done=false e exibe mensagem de erro', async () => {
        const wrapper = mountCreditCard();
        (wrapper.vm as any).unmaskedValue = '0000000000000000';
        await wrapper.vm.$nextTick();
        (wrapper.vm as any).checkDone();
        await wrapper.vm.$nextTick();

        expect((wrapper.vm as any).done).toBe(false);
        const inputBase = wrapper.findComponent(InputBase);
        expect(inputBase.props('error')).toBe('Número de cartão inválido');
    });

    it('campo obrigatório vazio exibe "Campo obrigatório" ao perder o foco', async () => {
        const wrapper = mountCreditCard({ required: true });
        (wrapper.vm as any).checkDone();
        await wrapper.vm.$nextTick();

        const inputBase = wrapper.findComponent(InputBase);
        expect(inputBase.props('error')).toBe('Campo obrigatório');
    });

    it('não regride Etapa 7c: setar modelValue externo com dígitos equivalentes não reescreve temp_value formatado', async () => {
        const wrapper = mountCreditCard({ modelValue: VALID_CARD });
        // Simula temp_value já formatado pela máscara (mesmos dígitos, formatação diferente)
        (wrapper.vm as any).temp_value = '4111 1111 1111 1111';

        await wrapper.setProps({ modelValue: VALID_CARD });
        await wrapper.vm.$nextTick();

        // Não deve ter sido resetado para o valor cru sem espaços
        expect((wrapper.vm as any).temp_value).toBe('4111 1111 1111 1111');
    });

    it('modelValue externo com dígitos diferentes atualiza temp_value', async () => {
        const wrapper = mountCreditCard({ modelValue: VALID_CARD });
        await wrapper.setProps({ modelValue: '5500000000000004' });
        await wrapper.vm.$nextTick();

        // A diretiva v-maska real reaplica a formatação de forma assíncrona;
        // o que importa é que os dígitos batem com o novo modelValue.
        expect((wrapper.vm as any).temp_value.replace(/\s/g, '')).toBe('5500000000000004');
    });
});
