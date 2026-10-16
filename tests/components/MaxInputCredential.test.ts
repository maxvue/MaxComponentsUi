import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxInputCredential from '../../src/components/MaxInputCredential.vue';

describe('MaxInputCredential', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('renderiza por padrão como campo oculto (type="password")', () => {
        const wrapper = mount(MaxInputCredential, {
            props: {
                modelValue: 'segredo123'
            }
        });
        expect(wrapper.exists()).toBe(true);
        const input = wrapper.find('.max-credential-input');
        expect(input.attributes('type')).toBe('password');
    });

    it('alterna o tipo para text ao clicar no botão de visibilidade', async () => {
        const wrapper = mount(MaxInputCredential, {
            props: {
                modelValue: 'segredo123'
            }
        });
        const toggleBtn = wrapper.find('.max-credential-action-btn[aria-label="Exibir credencial"]');
        expect(toggleBtn.exists()).toBe(true);

        await toggleBtn.trigger('click');
        const input = wrapper.find('.max-credential-input');
        expect(input.attributes('type')).toBe('text');

        const emitted = wrapper.emitted('toggle-visibility');
        expect(emitted).toBeTruthy();
        expect(emitted![0][0]).toBe(true);
    });

    it('exibe botão de copiar quando allowCopy é verdadeiro e há valor', () => {
        const wrapper = mount(MaxInputCredential, {
            props: {
                modelValue: 'token-abc-xyz',
                allowCopy: true
            }
        });
        const copyBtn = wrapper.find('.max-credential-action-btn[aria-label="Copiar credencial"]');
        expect(copyBtn.exists()).toBe(true);
    });

    it('emite update:modelValue ao digitar', async () => {
        const wrapper = mount(MaxInputCredential, {
            props: {
                modelValue: ''
            }
        });
        const input = wrapper.find('.max-credential-input');
        await input.setValue('nova_chave_api');
        await input.trigger('input');

        const emitted = wrapper.emitted('update:modelValue');
        expect(emitted).toBeTruthy();
        expect(emitted![0][0]).toBe('nova_chave_api');
    });
});
