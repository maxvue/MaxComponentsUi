import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxInputDateReference from '../../src/components/MaxInputDateReference.vue';
import MaxInputSelect from '../../src/components/MaxInputSelect.vue';

const sampleOptions = [
    { label: 'Data de Emissão', value: 'created_at' },
    { label: 'Data de Vencimento', value: 'due_date' },
    { label: 'Data de Liquidação', value: 'settled_at' }
];

describe('MaxInputDateReference', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('renderiza por padrão no modo select encapsulando MaxInputSelect', () => {
        const wrapper = mount(MaxInputDateReference, {
            props: {
                options: sampleOptions,
                modelValue: 'created_at'
            }
        });
        expect(wrapper.exists()).toBe(true);
        expect(wrapper.findComponent(MaxInputSelect).exists()).toBe(true);
    });

    it('renderiza no modo segmented com botões acessíveis', () => {
        const wrapper = mount(MaxInputDateReference, {
            props: {
                type: 'segmented',
                options: sampleOptions,
                modelValue: 'due_date'
            }
        });
        const buttons = wrapper.findAll('.max-date-ref-btn');
        expect(buttons.length).toBe(3);
        expect(buttons[1].classes()).toContain('is-active');
        expect(buttons[1].attributes('aria-checked')).toBe('true');
    });

    it('emite update:modelValue e change ao clicar em um botão no modo segmented', async () => {
        const wrapper = mount(MaxInputDateReference, {
            props: {
                type: 'segmented',
                options: sampleOptions,
                modelValue: 'created_at'
            }
        });
        const buttons = wrapper.findAll('.max-date-ref-btn');
        await buttons[2].trigger('click');

        const emitted = wrapper.emitted('update:modelValue');
        expect(emitted).toBeTruthy();
        expect(emitted![0][0]).toBe('settled_at');

        const changeEmitted = wrapper.emitted('change');
        expect(changeEmitted).toBeTruthy();
        expect(changeEmitted![0][0]).toBe('settled_at');
        expect(changeEmitted![0][1]).toEqual(sampleOptions[2]);
    });

    it('não altera seleção quando a opção ou componente está desabilitado', async () => {
        const wrapper = mount(MaxInputDateReference, {
            props: {
                type: 'segmented',
                options: [
                    { label: 'Normal', value: '1' },
                    { label: 'Desabilitada', value: '2', disabled: true }
                ],
                modelValue: '1'
            }
        });
        const buttons = wrapper.findAll('.max-date-ref-btn');
        await buttons[1].trigger('click');
        expect(wrapper.emitted('update:modelValue')).toBeFalsy();
    });
});
