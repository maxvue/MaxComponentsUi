import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxInputEmail from '../../src/components/MaxInputEmail.vue';
import InputBase from '../../src/components/InputBase.vue';

describe('MaxInputEmail', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('renderiza corretamente com input type=email e atributos adequados', () => {
        const wrapper = mount(MaxInputEmail, {
            props: { modelValue: '' }
        });
        expect(wrapper.exists()).toBe(true);
        expect(wrapper.findComponent(InputBase).exists()).toBe(true);

        const input = wrapper.find('input');
        expect(input.attributes('type')).toBe('email');
        expect(input.attributes('inputmode')).toBe('email');
        expect(input.attributes('autocomplete')).toBe('off');
        expect(input.attributes('spellcheck')).toBe('false');
        expect(input.attributes('autocapitalize')).toBe('none');
        expect(wrapper.findComponent(InputBase).props('label')).toBe('E-mail');
    });

    it('renderiza autocomplete="email" quando suggestions é verdadeiro', () => {
        const wrapper = mount(MaxInputEmail, {
            props: { modelValue: '', suggestions: true }
        });
        expect(wrapper.find('input').attributes('autocomplete')).toBe('email');
    });

    it('emite update:modelValue preservando caixa e caracteres na digitação', async () => {
        const wrapper = mount(MaxInputEmail, {
            props: { modelValue: '' }
        });
        const input = wrapper.find('input');

        await input.setValue('User+Tag@Exemplo.COM');
        expect(wrapper.emitted('update:modelValue')![0]).toEqual(['User+Tag@Exemplo.COM']);
    });

    it('valida e-mail válido após blur sem exibir erro', async () => {
        const wrapper = mount(MaxInputEmail, {
            props: { modelValue: 'contato@empresa.com.br' }
        });
        const input = wrapper.find('input');
        await input.trigger('blur');

        const base = wrapper.findComponent(InputBase);
        expect(base.props('error')).toBeFalsy();
    });

    it('exibe mensagem de erro para e-mail inválido após blur', async () => {
        const wrapper = mount(MaxInputEmail, {
            props: { modelValue: 'email-invalido' }
        });
        const input = wrapper.find('input');
        await input.trigger('blur');

        const base = wrapper.findComponent(InputBase);
        expect(base.props('error')).toBe('E-mail inválido');
    });

    it('exibe campo obrigatório quando obrigatório e vazio após blur', async () => {
        const wrapper = mount(MaxInputEmail, {
            props: { modelValue: '', required: true }
        });
        const input = wrapper.find('input');
        await input.trigger('blur');

        const base = wrapper.findComponent(InputBase);
        expect(base.props('error')).toBe('Campo obrigatório');
    });

    it('permite sobrescrever label e autocomplete', () => {
        const wrapper = mount(MaxInputEmail, {
            props: {
                label: 'Correio Eletrônico',
                autocomplete: 'username'
            }
        });
        expect(wrapper.findComponent(InputBase).props('label')).toBe('Correio Eletrônico');
        expect(wrapper.find('input').attributes('autocomplete')).toBe('username');
    });

    it('expõe métodos focus e setFocus', () => {
        const wrapper = mount(MaxInputEmail);
        expect(typeof wrapper.vm.focus).toBe('function');
        expect(typeof wrapper.vm.setFocus).toBe('function');
    });
});
