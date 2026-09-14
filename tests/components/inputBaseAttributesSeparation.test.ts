import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import MaxInputText from '../../src/components/MaxInputText.vue';
import MaxInputToggle from '../../src/components/MaxInputToggle.vue';

describe('F05 - Separação de atributos nativos de controle e wrapper', () => {
    it('MaxInputText encaminha atributos de controle para o <input> e preserva atributos de raiz no wrapper', () => {
        const wrapper = mount(MaxInputText, {
            props: {
                modelValue: 'teste'
            },
            attrs: {
                name: 'user_email',
                autocomplete: 'email',
                maxlength: '60',
                inputmode: 'email',
                class: 'custom-user-class',
                'data-testid': 'custom-wrapper'
            }
        });

        const rootEl = wrapper.find('.max-input-main-div');
        expect(rootEl.exists()).toBe(true);
        expect(rootEl.classes()).toContain('custom-user-class');
        expect(rootEl.attributes('data-testid')).toBe('custom-wrapper');

        // Atributos de controle NUNCA devem permanecer no wrapper
        expect(rootEl.attributes('name')).toBeUndefined();
        expect(rootEl.attributes('autocomplete')).toBeUndefined();
        expect(rootEl.attributes('maxlength')).toBeUndefined();
        expect(rootEl.attributes('inputmode')).toBeUndefined();

        // Atributos de controle DEVEM ser aplicados ao elemento nativo de input
        const inputEl = wrapper.find('input.max-input-native');
        expect(inputEl.exists()).toBe(true);
        expect(inputEl.attributes('name')).toBe('user_email');
        expect(inputEl.attributes('autocomplete')).toBe('email');
        expect(inputEl.attributes('maxlength')).toBe('60');
        expect(inputEl.attributes('inputmode')).toBe('email');
    });

    it('MaxInputToggle encaminha name, disabled e required para o <input type="checkbox"> e não deixa no wrapper', () => {
        const wrapper = mount(MaxInputToggle, {
            props: {
                modelValue: false,
                name: 'accept_terms',
                disabled: true,
                required: true
            },
            attrs: {
                class: 'toggle-wrapper-class',
                'data-testid': 'toggle-test'
            }
        });

        const rootEl = wrapper.find('.max-input-toggle');
        expect(rootEl.exists()).toBe(true);
        expect(rootEl.classes()).toContain('toggle-wrapper-class');
        expect(rootEl.attributes('data-testid')).toBe('toggle-test');

        // Atributos de controle NUNCA devem estar no wrapper div
        expect(rootEl.attributes('name')).toBeUndefined();
        expect(rootEl.attributes('disabled')).toBeUndefined();
        expect(rootEl.attributes('required')).toBeUndefined();

        // Atributos de controle DEVEM estar no checkbox nativo
        const checkboxEl = wrapper.find('input.max-toggleswitch-input');
        expect(checkboxEl.exists()).toBe(true);
        expect(checkboxEl.attributes('name')).toBe('accept_terms');
        expect(checkboxEl.attributes('disabled')).toBeDefined();
        expect(checkboxEl.attributes('required')).toBeDefined();
    });
});
