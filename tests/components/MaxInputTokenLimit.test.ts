import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxInputTokenLimit from '../../src/components/MaxInputTokenLimit.vue';

function mountTokenLimit(props: Record<string, any> = {}) {
    return mount(MaxInputTokenLimit, {
        props: { modelValue: null, ...props }
    });
}

describe('MaxInputTokenLimit', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('renderiza com sufixo tokens', () => {
        const wrapper = mountTokenLimit({ modelValue: 4096 });
        expect(wrapper.exists()).toBe(true);
        expect(wrapper.text()).toContain('tokens');
        const input = wrapper.find('input');
        expect((input.element as HTMLInputElement).value).toBe('4.096');
    });

    it('valida min=1 padrão (rejeita 0 e negativos)', async () => {
        const wrapper = mountTokenLimit();
        const input = wrapper.find('input');

        await input.setValue('0');
        expect(wrapper.text()).toContain('Valor mínimo permitido é 1');
        expect(wrapper.emitted('update:modelValue')).toBeUndefined();

        await input.setValue('1');
        const emitted = wrapper.emitted('update:modelValue')!;
        expect(emitted[emitted.length - 1]).toEqual([1]);
    });

    it('rejeita frações e decimais', async () => {
        const wrapper = mountTokenLimit();
        const input = wrapper.find('input');

        await input.setValue('1000,5');
        expect(wrapper.text()).toContain('Valores decimais não são permitidos');
        expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    });

    it('suporta limite máximo arbitrário como 10.000.000', async () => {
        const wrapper = mountTokenLimit({ max: 10000000 });
        const input = wrapper.find('input');

        await input.setValue('15.000.000');
        expect(wrapper.text()).toContain('Valor máximo permitido é 10000000');

        await input.setValue('8.000.000');
        const emitted = wrapper.emitted('update:modelValue')!;
        expect(emitted[emitted.length - 1]).toEqual([8000000]);
    });
});
