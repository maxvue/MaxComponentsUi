import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxInputText from '../../src/components/MaxInputText.vue';
import InputBase from '../../src/components/InputBase.vue';

function mountInputText(props: Record<string, any> = {}, attrs: Record<string, any> = {}) {
    return mount(MaxInputText, {
        props: { modelValue: '', ...props },
        attrs
    });
}

describe('MaxInputText', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('renderiza corretamente', () => {
        const wrapper = mountInputText({ label: 'Nome' });
        expect(wrapper.exists()).toBe(true);
    });

    it('emite update:modelValue ao alterar o valor do input', async () => {
        const wrapper = mountInputText();
        const input = wrapper.find('input');
        await input.setValue('Teste');

        expect(wrapper.emitted('update:modelValue')).toBeTruthy();
        const emitted = wrapper.emitted('update:modelValue')!;
        expect(emitted[emitted.length - 1]).toEqual(['Teste']);
    });

    it('atualiza o valor interno quando modelValue muda externamente', async () => {
        const wrapper = mountInputText({ modelValue: 'inicial' });
        const input = wrapper.find('input');
        expect((input.element as HTMLInputElement).value).toBe('inicial');

        await wrapper.setProps({ modelValue: 'atualizado' });
        expect((input.element as HTMLInputElement).value).toBe('atualizado');
    });

    it('valida done=true ao blur quando required e preenchido', async () => {
        const wrapper = mountInputText({ required: true, modelValue: 'preenchido' });
        const input = wrapper.find('input');
        await input.trigger('blur');

        const inputBase = wrapper.findComponent(InputBase);
        expect(inputBase.props('done')).toBe(true);
    });

    it('valida erro de campo obrigatório ao blur quando vazio', async () => {
        const wrapper = mountInputText({ required: true, modelValue: '' });
        const input = wrapper.find('input');
        await input.trigger('blur');

        const inputBase = wrapper.findComponent(InputBase);
        expect(inputBase.props('error')).toBe('Campo obrigatório');
    });

    it('valida erro por targetValue diferente', async () => {
        const wrapper = mountInputText({ targetValue: 'Correto', modelValue: 'Incorreto' }, { error_msg: 'Erro customizado' });
        const input = wrapper.find('input');
        await input.trigger('blur');

        const inputBase = wrapper.findComponent(InputBase);
        expect(inputBase.props('error')).toBe('Erro customizado');
    });

    it('valida erro genérico (Valor inválido) quando done=false explícito', async () => {
        const wrapper = mountInputText({ done: false, modelValue: 'Texto' });
        const input = wrapper.find('input');
        await input.trigger('blur');

        const inputBase = wrapper.findComponent(InputBase);
        expect(inputBase.props('error')).toBe('Valor inválido');
    });

    it('possui spellcheck ativado por padrão', () => {
        const wrapper = mountInputText();
        const input = wrapper.find('input');
        expect(input.attributes('spellcheck')).toBe('true');
    });

    it('respeita spellcheck=false quando definido explicitamente', () => {
        const wrapper = mountInputText({ spellcheck: false });
        const input = wrapper.find('input');
        expect(input.attributes('spellcheck')).toBe('false');
    });

    it('desativa spellcheck quando type="password"', () => {
        const wrapper = mountInputText({ type: 'password' });
        const input = wrapper.find('input');
        expect(input.attributes('spellcheck')).toBe('false');
    });
});
