import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxInputSocialHandle from '../../src/components/MaxInputSocialHandle.vue';

describe('MaxInputSocialHandle', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('renderiza o input de handle social com placeholder padrão', () => {
        const wrapper = mount(MaxInputSocialHandle, {
            props: {
                modelValue: ''
            }
        });
        expect(wrapper.exists()).toBe(true);
        const input = wrapper.find('.max-social-handle-input');
        expect(input.attributes('placeholder')).toBe('usuario');
    });

    it('adiciona automaticamente o prefixo @ quando digitado sem prefixo', async () => {
        const wrapper = mount(MaxInputSocialHandle, {
            props: {
                modelValue: '',
                autoPrefix: true
            }
        });
        const input = wrapper.find('.max-social-handle-input');
        await input.setValue('engeapp');
        await input.trigger('input');

        const emitted = wrapper.emitted('update:modelValue');
        expect(emitted).toBeTruthy();
        expect(emitted![0][0]).toBe('@engeapp');
    });

    it('extrai apenas o handle caso uma URL completa seja inserida', async () => {
        const wrapper = mount(MaxInputSocialHandle, {
            props: {
                modelValue: '',
                cleanUrl: true,
                autoPrefix: true
            }
        });
        const input = wrapper.find('.max-social-handle-input');
        await input.setValue('https://instagram.com/engeapp_oficial');
        await input.trigger('input');

        const emitted = wrapper.emitted('update:modelValue');
        expect(emitted).toBeTruthy();
        expect(emitted![0][0]).toBe('@engeapp_oficial');
    });

    it('remove espaços em branco automaticamente', async () => {
        const wrapper = mount(MaxInputSocialHandle, {
            props: {
                modelValue: '',
                autoPrefix: true
            }
        });
        const input = wrapper.find('.max-social-handle-input');
        await input.setValue('enge app');
        await input.trigger('input');

        const emitted = wrapper.emitted('update:modelValue');
        expect(emitted).toBeTruthy();
        expect(emitted![0][0]).toBe('@engeapp');
    });
});
