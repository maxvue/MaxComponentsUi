import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxInputPassword from '../../src/components/MaxInputPassword.vue';
import InputBase from '../../src/components/InputBase.vue';
import MaxIconButton from '../../src/components/MaxIconButton.vue';

describe('MaxInputPassword', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('renderiza inicialmente como campo oculto (type=password)', () => {
        const wrapper = mount(MaxInputPassword, {
            props: { modelValue: 'segredo' }
        });
        const input = wrapper.find('input');
        expect(input.attributes('type')).toBe('password');
        expect(input.attributes('autocomplete')).toBe('off');
        expect(wrapper.findComponent(InputBase).props('label')).toBe('Senha');
    });

    it('renderiza autocomplete="current-password" quando suggestions é verdadeiro', () => {
        const wrapper = mount(MaxInputPassword, {
            props: { modelValue: 'segredo', suggestions: true }
        });
        expect(wrapper.find('input').attributes('autocomplete')).toBe('current-password');
    });

    it('permite alternar visibilidade pelo botão de toggle sem emitir update:modelValue', async () => {
        const wrapper = mount(MaxInputPassword, {
            props: { modelValue: 'minha-senha' }
        });

        const toggleBtn = wrapper.findComponent(MaxIconButton);
        expect(toggleBtn.exists()).toBe(true);
        expect(toggleBtn.attributes('aria-label')).toBe('Exibir senha');
        expect(toggleBtn.attributes('aria-pressed')).toBe('false');

        // Clica no toggle
        await toggleBtn.trigger('click');
        expect(wrapper.find('input').attributes('type')).toBe('text');
        expect(toggleBtn.attributes('aria-label')).toBe('Ocultar senha');
        expect(toggleBtn.attributes('aria-pressed')).toBe('true');

        // Clica novamente para ocultar
        await toggleBtn.trigger('click');
        expect(wrapper.find('input').attributes('type')).toBe('password');

        // Garante que o toggle não gerou emissão de modelValue
        expect(wrapper.emitted('update:modelValue')).toBeFalsy();
    });

    it('oculta o botão toggle quando toggleVisibility for false', () => {
        const wrapper = mount(MaxInputPassword, {
            props: { toggleVisibility: false }
        });
        expect(wrapper.findComponent(MaxIconButton).exists()).toBe(false);
    });

    it('valida minLength exigido', async () => {
        const wrapper = mount(MaxInputPassword, {
            props: {
                modelValue: '12345',
                minLength: 8
            }
        });
        await wrapper.find('input').trigger('blur');
        expect(wrapper.findComponent(InputBase).props('error')).toBe('A senha deve ter no mínimo 8 caracteres');

        // Com 8 caracteres deve ficar válido
        await wrapper.setProps({ modelValue: '12345678' });
        await wrapper.find('input').trigger('blur');
        expect(wrapper.findComponent(InputBase).props('error')).toBeFalsy();
    });

    it('valida confirmação exata contra targetValue sem expor o segredo na mensagem de erro', async () => {
        const targetSecret = 'SenhaComplexa#2026';
        const wrapper = mount(MaxInputPassword, {
            props: {
                modelValue: 'SenhaDiferente#2026',
                targetValue: targetSecret
            }
        });
        await wrapper.find('input').trigger('blur');

        const error = wrapper.findComponent(InputBase).props('error') as string;
        expect(error).toBe('As senhas não coincidem');
        // Confere estritamente que o valor alvo secreto NÃO aparece no erro ou no html do componente
        expect(error).not.toContain(targetSecret);
        expect(wrapper.html()).not.toContain(targetSecret);
    });

    it('confirmação é sensível a caixa, acentos e espaços', async () => {
        const wrapper = mount(MaxInputPassword, {
            props: {
                modelValue: 'senha',
                targetValue: 'Senha'
            }
        });
        await wrapper.find('input').trigger('blur');
        expect(wrapper.findComponent(InputBase).props('error')).toBe('As senhas não coincidem');
    });

    it('respeita estado disabled no input e no botão', () => {
        const wrapper = mount(MaxInputPassword, {
            props: { disabled: true }
        });
        expect(wrapper.find('input').attributes('disabled')).toBeDefined();
        expect(wrapper.findComponent(MaxIconButton).props('disabled')).toBe(true);
    });

    it('expõe métodos focus e setFocus', () => {
        const wrapper = mount(MaxInputPassword);
        expect(typeof wrapper.vm.focus).toBe('function');
        expect(typeof wrapper.vm.setFocus).toBe('function');
    });
});
