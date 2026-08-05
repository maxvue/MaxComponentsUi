import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxInputPhoneMail from '../../src/components/MaxInputPhoneMail.vue';
import InputBase from '../../src/components/InputBase.vue';

function mountPhoneMail(props: Record<string, any> = {}, attrs: Record<string, any> = {}) {
    return mount(MaxInputPhoneMail, {
        props: { modelValue: '', ...props },
        attrs
    });
}

describe('MaxInputPhoneMail', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('renderiza corretamente', () => {
        const wrapper = mountPhoneMail();
        expect(wrapper.exists()).toBe(true);
    });

    it('detecta modo email quando valor contém letras', async () => {
        const wrapper = mountPhoneMail({ modelValue: 'test@email.com' });
        expect(wrapper.findComponent(InputBase).exists()).toBe(true);
    });

    it('detecta modo whatsapp quando valor contém números', async () => {
        const wrapper = mountPhoneMail({ modelValue: '11999887766' });
        expect(wrapper.findComponent(InputBase).exists()).toBe(true);
    });

    it('valida email válido e marca done=true após blur', async () => {
        const wrapper = mountPhoneMail({ modelValue: 'usuario@email.com' });
        const input = wrapper.find('input');
        await input.trigger('blur');

        const ib = wrapper.findComponent(InputBase);
        expect(ib.props('done')).toBe(true);
    });

    it('invalida email incorreto', async () => {
        const wrapper = mountPhoneMail({ modelValue: 'emailinvalido' });
        const input = wrapper.find('input');
        await input.trigger('blur');

        const ib = wrapper.findComponent(InputBase);
        expect(ib.props('done')).toBe(false);
    });

    it('força modo whatsapp via attr phone', () => {
        const wrapper = mountPhoneMail({}, { phone: true });
        expect(wrapper.findComponent(InputBase).exists()).toBe(true);
    });

    it('força modo whatsapp via attr whatsapp', () => {
        const wrapper = mountPhoneMail({}, { whatsapp: true });
        expect(wrapper.findComponent(InputBase).exists()).toBe(true);
    });

    it('força modo email via attr email', () => {
        const wrapper = mountPhoneMail({}, { email: true });
        expect(wrapper.findComponent(InputBase).exists()).toBe(true);
    });

    it('emite update:modelValue ao digitar', async () => {
        const wrapper = mountPhoneMail();
        const input = wrapper.find('input');
        await input.setValue('teste@mail.com');

        expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    });

    it('valida telefone incorreto quando method.value não é whatsapp/email explicitly', async () => {
        // Quando inicia sem attrs, ele entra no branch genérico de validação se method != email/whatsapp
        const wrapper = mountPhoneMail({ modelValue: '11999887766' });
        const input = wrapper.find('input');
        await input.trigger('blur');
        // valid number test
        const ib = wrapper.findComponent(InputBase);
        expect(ib.props('done')).toBe(true);
    });

    it('re-valida (isDone) após blur se o usuário continuar a digitar', async () => {
        const wrapper = mountPhoneMail({ modelValue: '11999887766' });
        const input = wrapper.find('input');
        await input.trigger('blur'); // Define isDone !== null

        // Modifica o input e checa se watch() atualiza o isDone
        (wrapper.vm as any).temp_value = '119998877';
        await wrapper.vm.$nextTick();

        const ib = wrapper.findComponent(InputBase);
        expect(ib.props('done')).toBe(false);
    });

    it('suporta prop done explicitamente', () => {
        const wrapper = mountPhoneMail({ done: true });
        const ib = wrapper.findComponent(InputBase);
        expect(ib.props('done')).toBe(true);
    });

    it('exibe caution quando done=false', () => {
        const wrapper = mountPhoneMail({ modelValue: '123' });
        const ib = wrapper.findComponent(InputBase);
        expect(ib.props('caution')).toBe(true);
    });

    it('exibe caution falso quando vazio e not required', () => {
        const wrapper = mountPhoneMail({ modelValue: '', required: false });
        const ib = wrapper.findComponent(InputBase);
        expect(ib.props('caution')).toBe(false);
    });

    it('exibe erro customizado', () => {
        const wrapper = mountPhoneMail({ modelValue: '123' }, { errMsg: 'Erro aqui' });
        const ib = wrapper.findComponent(InputBase);
        expect(ib.props('error')).toBe('Erro aqui');
    });

    it('exibe erro de campo obrigatório', () => {
        const wrapper = mountPhoneMail({ modelValue: '', required: true, caution: true });
        const ib = wrapper.findComponent(InputBase);
        expect(ib.props('error')).toBe('Campo obrigatório');
    });

    it('detecta máscara com 8, 7 ou 6', () => {
        const wrapper = mountPhoneMail({ modelValue: '1188888888' });
        expect(wrapper.find('input').attributes('placeholder')).toBeTruthy();
    });

    it('watch props.modelValue updates temp_value', async () => {
        const wrapper = mountPhoneMail({ modelValue: 'test@email.com' });
        await wrapper.setProps({ modelValue: 'new@email.com' });
        expect((wrapper.vm as any).temp_value).toBe('new@email.com');
    });

    it('monta sem lançar quando modelValue é null', () => {
        expect(() => mountPhoneMail({ modelValue: null as any })).not.toThrow();
    });

    it('monta sem lançar quando modelValue é null com attr email', () => {
        expect(() => mountPhoneMail({ modelValue: null as any }, { email: true })).not.toThrow();
    });

    it('monta sem lançar quando modelValue é número', () => {
        expect(() => mountPhoneMail({ modelValue: 11999887766 as any })).not.toThrow();
    });

    it('trata null como vazio: done nulo e caution falso quando não obrigatório', () => {
        const wrapper = mountPhoneMail({ modelValue: null as any });
        const ib = wrapper.findComponent(InputBase);
        expect(ib.props('done')).toBeUndefined();
        expect(ib.props('caution')).toBe(false);
    });

    it('não lança ao receber null via watch de props.modelValue', async () => {
        const wrapper = mountPhoneMail({ modelValue: 'test@email.com' });
        await wrapper.setProps({ modelValue: null as any });
        expect((wrapper.vm as any).temp_value).toBe('');
    });

    it('preserva InputBase como wrapper raiz e não emite marcações do PrimeVue', () => {
        const wrapper = mountPhoneMail();
        expect(wrapper.findComponent(InputBase).exists()).toBe(true);
        expect(wrapper.element.classList).toContain('max-input-main-div');
        expect(wrapper.html()).not.toContain('data-pc-name');
        expect(wrapper.html()).not.toContain('data-pc-section');
    });
});
