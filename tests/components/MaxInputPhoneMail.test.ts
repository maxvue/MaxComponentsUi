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

    it('detecta modo email quando valor contém letras', () => {
        const wrapper = mountPhoneMail({ modelValue: 'test@email.com' });

        expect((wrapper.vm as any).method).toBe('email');
        expect((wrapper.vm as any).name_method).toBe('Email');
        expect(wrapper.findComponent(InputBase).props('label')).toBe('Email');
        expect(wrapper.findComponent(InputBase).props('icon')).toBe('prime:at');
    });

    it('detecta modo whatsapp quando valor contém números', () => {
        const wrapper = mountPhoneMail({ modelValue: '11999887766' });

        expect((wrapper.vm as any).method).toBe('whatsapp');
        expect((wrapper.vm as any).name_method).toBe('Whatsapp');
        expect(wrapper.findComponent(InputBase).props('label')).toBe('Whatsapp');
        expect(wrapper.findComponent(InputBase).props('icon')).toBe('ic:baseline-whatsapp');
    });

    it('reflete o modo email imediatamente no mount, sem interação do usuário (regressão)', () => {
        const wrapper = mountPhoneMail({ modelValue: 'usuario@email.com' });

        expect((wrapper.vm as any).method).toBe('email');
        expect((wrapper.vm as any).name_method).toBe('Email');
        expect(wrapper.findComponent(InputBase).props('label')).toBe('Email');
    });

    it('reflete o modo whatsapp imediatamente no mount, sem interação do usuário (regressão)', () => {
        const wrapper = mountPhoneMail({ modelValue: '11999887766' });

        expect((wrapper.vm as any).method).toBe('whatsapp');
        expect((wrapper.vm as any).name_method).toBe('Whatsapp');
        expect(wrapper.findComponent(InputBase).props('label')).toBe('Whatsapp');
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

        expect((wrapper.vm as any).method).toBe('whatsapp');
        expect((wrapper.vm as any).name_method).toBe('Whatsapp');
        expect(wrapper.findComponent(InputBase).props('label')).toBe('Whatsapp');
        expect(wrapper.findComponent(InputBase).props('icon')).toBe('ic:baseline-whatsapp');
        expect(wrapper.find('input').attributes('placeholder')).toBe('(99) 9 9999 - 9999');
    });

    it('força modo whatsapp via attr whatsapp', () => {
        const wrapper = mountPhoneMail({}, { whatsapp: true });

        expect((wrapper.vm as any).method).toBe('whatsapp');
        expect((wrapper.vm as any).name_method).toBe('Whatsapp');
        expect(wrapper.findComponent(InputBase).props('label')).toBe('Whatsapp');
        expect(wrapper.findComponent(InputBase).props('icon')).toBe('ic:baseline-whatsapp');
        expect(wrapper.find('input').attributes('placeholder')).toBe('(99) 9 9999 - 9999');
    });

    it('força modo email via attr email', () => {
        const wrapper = mountPhoneMail({}, { email: true });

        expect((wrapper.vm as any).method).toBe('email');
        expect((wrapper.vm as any).name_method).toBe('Email');
        expect(wrapper.findComponent(InputBase).props('label')).toBe('Email');
        expect(wrapper.findComponent(InputBase).props('icon')).toBe('prime:at');
        expect(wrapper.find('input').attributes('placeholder')).toBe('usuario@email.com');
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

    it('emite valor desmascarado (sem +55, parênteses, traços ou espaços) para telefone', async () => {
        const wrapper = mountPhoneMail();
        const input = wrapper.find('input');
        await input.setValue('11999998888');

        const emitted = wrapper.emitted('update:modelValue');
        expect(emitted).toBeTruthy();
        const lastValue = emitted![emitted!.length - 1][0];
        expect(lastValue).not.toContain('+55');
        expect(lastValue).not.toMatch(/[()\-\s]/);
        expect(lastValue).toBe('11999998888');
    });

    it('emite o valor de e-mail sem parênteses/traço/espaço residual da normalização', async () => {
        const wrapper = mountPhoneMail();
        const input = wrapper.find('input');
        await input.setValue('usuario@email.com');

        const emitted = wrapper.emitted('update:modelValue');
        expect(emitted).toBeTruthy();
        const lastValue = emitted![emitted!.length - 1][0];
        expect(lastValue).not.toMatch(/[()\-\s]/);
        expect(lastValue).toBe('usuario@email.com');
    });

    it('não produz mais um "$" literal no telefone fixo (8, 7 ou 6 dígitos após o DDD)', async () => {
        const wrapper = mountPhoneMail();
        const input = wrapper.find('input');
        await input.setValue('1188888888');

        expect((wrapper.vm as any).temp_value).not.toContain('$');

        const emitted = wrapper.emitted('update:modelValue');
        if (emitted) {
            const lastValue = emitted[emitted.length - 1][0];
            expect(lastValue).not.toContain('$');
        }
    });

    it('não aceita espaços dentro de um e-mail digitado', async () => {
        const wrapper = mountPhoneMail();
        const input = wrapper.find('input');
        await input.setValue('user name@mail.com');

        expect((wrapper.vm as any).temp_value).not.toMatch(/\s/);
    });

    it('muda de modo telefone para email (e vice-versa) atualizando method/name_method/máscara via watch', async () => {
        const wrapper = mountPhoneMail();
        const input = wrapper.find('input');

        await input.setValue('11999998888');
        expect((wrapper.vm as any).method).toBe('whatsapp');
        expect(wrapper.findComponent(InputBase).props('label')).toBe('Whatsapp');

        await input.setValue('usuario@email.com');
        expect((wrapper.vm as any).method).toBe('email');
        expect(wrapper.findComponent(InputBase).props('label')).toBe('Email');

        await input.setValue('11999998888');
        expect((wrapper.vm as any).method).toBe('whatsapp');
        expect(wrapper.findComponent(InputBase).props('label')).toBe('Whatsapp');
    });

    /**
     * Regressão: a máscara de celular usava `9` literal (`+55 (##) 9 #### - ####`).
     * O Maska consumia o 9 digitado pelo usuário para casar com esse literal, sobrando
     * apenas 8 slots `#` para os 9 dígitos restantes — o último dígito era descartado
     * silenciosamente do `unmaskedValue`, que é justamente o valor emitido no v-model.
     * O texto exibido ficava correto, então o bug só aparecia como "valor inválido".
     */
    describe('máscara de celular não descarta dígitos (regressão)', () => {
        const casosCelular = [
            ['62998817171', 'Goiânia'],
            ['11987654321', 'São Paulo'],
            ['21970001122', 'Rio de Janeiro']
        ];

        it.each(casosCelular)('preserva os 11 dígitos de %s (%s) no valor emitido', async (digitos) => {
            const wrapper = mountPhoneMail();
            await wrapper.find('input').setValue(digitos);

            expect((wrapper.vm as any).unmaskedValue).toBe(digitos);
        });

        it('preserva os 10 dígitos de um telefone fixo', async () => {
            const wrapper = mountPhoneMail();
            await wrapper.find('input').setValue('6232811717');

            expect((wrapper.vm as any).unmaskedValue).toBe('6232811717');
        });

        it('não descarta dígitos enquanto o celular ainda está incompleto', async () => {
            const wrapper = mountPhoneMail();
            await wrapper.find('input').setValue('629988');

            expect((wrapper.vm as any).unmaskedValue).toBe('629988');
        });

        it('mantém a formatação visual do celular', async () => {
            const wrapper = mountPhoneMail();
            const input = wrapper.find('input');
            await input.setValue('62998817171');

            expect((input.element as HTMLInputElement).value).toBe('+55 (62) 9 9881 - 7171');
        });

        it('emite um celular que o libphonenumber considera válido', async () => {
            const wrapper = mountPhoneMail();
            const input = wrapper.find('input');
            await input.setValue('62998817171');
            await input.trigger('blur');

            expect(wrapper.findComponent(InputBase).props('done')).toBe(true);
        });
    });
});
