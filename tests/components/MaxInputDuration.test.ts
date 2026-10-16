import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxInputDuration from '../../src/components/MaxInputDuration.vue';

function mountDuration(props: Record<string, any> = {}) {
    return mount(MaxInputDuration, {
        props: { modelValue: null, ...props }
    });
}

describe('MaxInputDuration', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('renderiza com sufixo s de segundos', () => {
        const wrapper = mountDuration({ modelValue: 60 });
        expect(wrapper.exists()).toBe(true);
        expect(wrapper.text()).toContain('s');
        const input = wrapper.find('input');
        expect((input.element as HTMLInputElement).value).toBe('60');
    });

    it('rejeita valores decimais/fracionados', async () => {
        const wrapper = mountDuration();
        const input = wrapper.find('input');

        await input.setValue('12,5');
        expect(wrapper.text()).toContain('Valores decimais não são permitidos');
        expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    });

    it('emite número inteiro de segundos válido', async () => {
        const wrapper = mountDuration();
        const input = wrapper.find('input');

        await input.setValue('120');
        const emitted = wrapper.emitted('update:modelValue')!;
        expect(emitted[emitted.length - 1]).toEqual([120]);
    });

    it('suporta min/max dinâmicos', async () => {
        const wrapper = mountDuration({ min: 10, max: 300 });
        const input = wrapper.find('input');

        await input.setValue('5');
        expect(wrapper.text()).toContain('Valor mínimo permitido é 10');

        await input.setValue('350');
        expect(wrapper.text()).toContain('Valor máximo permitido é 300');

        await input.setValue('180');
        const emitted = wrapper.emitted('update:modelValue')!;
        expect(emitted[emitted.length - 1]).toEqual([180]);
    });
});
