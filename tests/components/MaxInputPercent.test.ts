import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxInputPercent from '../../src/components/MaxInputPercent.vue';

function mountPercent(props: Record<string, any> = {}) {
    return mount(MaxInputPercent, {
        props: { modelValue: null, ...props }
    });
}

describe('MaxInputPercent', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('renderiza corretamente com sufixo % padrão', () => {
        const wrapper = mountPercent({ modelValue: 15 });
        expect(wrapper.exists()).toBe(true);
        expect(wrapper.text()).toContain('%');
        const input = wrapper.find('input');
        expect((input.element as HTMLInputElement).value).toBe('15');
    });

    it('preserva valor 15 como 15 no modelValue e nunca 0.15', async () => {
        const wrapper = mountPercent();
        const input = wrapper.find('input');
        await input.setValue('15');

        const emitted = wrapper.emitted('update:modelValue')!;
        expect(emitted[emitted.length - 1]).toEqual([15]);
        expect(emitted[emitted.length - 1]).not.toEqual([0.15]);
    });

    it('valida limites padrão 0 a 100', async () => {
        const wrapper = mountPercent({ modelValue: 50 });
        const input = wrapper.find('input');

        await input.setValue('105');
        expect(wrapper.text()).toContain('Valor máximo permitido é 100');

        await input.setValue('-5');
        expect(wrapper.text()).toContain('Valor mínimo permitido é 0');

        await input.setValue('100');
        const emitted = wrapper.emitted('update:modelValue')!;
        expect(emitted[emitted.length - 1]).toEqual([100]);
    });

    it('permite sobrescrever min e max por props', async () => {
        const wrapper = mountPercent({ min: -50, max: 200 });
        const input = wrapper.find('input');

        await input.setValue('150');
        const emitted = wrapper.emitted('update:modelValue')!;
        expect(emitted[emitted.length - 1]).toEqual([150]);
    });

    it('suporta casas decimais configuráveis', async () => {
        const wrapper = mountPercent({ maxFractionDigits: 1 });
        const input = wrapper.find('input');

        await input.setValue('12,34');
        expect(wrapper.text()).toContain('Máximo de 1 casas decimais');

        await input.setValue('12,3');
        const emitted = wrapper.emitted('update:modelValue')!;
        expect(emitted[emitted.length - 1]).toEqual([12.3]);
    });
});
