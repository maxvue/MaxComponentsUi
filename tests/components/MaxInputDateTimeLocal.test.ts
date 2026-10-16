import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxInputDateTimeLocal from '../../src/components/MaxInputDateTimeLocal.vue';

describe('MaxInputDateTimeLocal', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('renderiza o input nativo datetime-local', () => {
        const wrapper = mount(MaxInputDateTimeLocal, {
            props: {
                modelValue: '2026-10-16T14:30'
            }
        });
        expect(wrapper.exists()).toBe(true);
        const input = wrapper.find('input[type="datetime-local"]');
        expect(input.exists()).toBe(true);
        expect((input.element as HTMLInputElement).value).toBe('2026-10-16T14:30');
    });

    it('formata objeto Date nativo para o formato YYYY-MM-DDTHH:mm', () => {
        const date = new Date(2026, 9, 16, 15, 45); // Outubro = mês 9
        const wrapper = mount(MaxInputDateTimeLocal, {
            props: {
                modelValue: date
            }
        });
        const input = wrapper.find('input[type="datetime-local"]');
        expect((input.element as HTMLInputElement).value).toBe('2026-10-16T15:45');
    });

    it('emite update:modelValue ao alterar o valor', async () => {
        const wrapper = mount(MaxInputDateTimeLocal, {
            props: {
                modelValue: null
            }
        });
        const input = wrapper.find('input[type="datetime-local"]');
        await input.setValue('2026-12-25T18:00');
        await input.trigger('input');

        const emitted = wrapper.emitted('update:modelValue');
        expect(emitted).toBeTruthy();
        expect(emitted![0][0]).toBe('2026-12-25T18:00');
    });

    it('repassa restrições min e max', () => {
        const wrapper = mount(MaxInputDateTimeLocal, {
            props: {
                modelValue: null,
                min: '2026-01-01T00:00',
                max: '2026-12-31T23:59'
            }
        });
        const input = wrapper.find('input[type="datetime-local"]');
        expect(input.attributes('min')).toBe('2026-01-01T00:00');
        expect(input.attributes('max')).toBe('2026-12-31T23:59');
    });
});
