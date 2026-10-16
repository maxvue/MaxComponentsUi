import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxInputCurrent from '../../src/components/MaxInputCurrent.vue';

function mountCurrent(props: Record<string, any> = {}) {
    return mount(MaxInputCurrent, {
        props: { modelValue: null, ...props }
    });
}

describe('MaxInputCurrent', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('renderiza corretamente com sufixo A', () => {
        const wrapper = mountCurrent({ modelValue: 16.5 });
        expect(wrapper.exists()).toBe(true);
        expect(wrapper.text()).toContain('A');
        const input = wrapper.find('input');
        expect((input.element as HTMLInputElement).value).toBe('16,5');
    });

    it('permite valores negativos quando min negativo é configurado', async () => {
        const wrapper = mountCurrent({ min: -50 });
        const input = wrapper.find('input');

        await input.setValue('-20');
        const emitted = wrapper.emitted('update:modelValue')!;
        expect(emitted[emitted.length - 1]).toEqual([-20]);
    });

    it('rejeita valores negativos quando min=0 padrão', async () => {
        const wrapper = mountCurrent();
        const input = wrapper.find('input');

        await input.setValue('-5');
        expect(wrapper.text()).toContain('Valor mínimo permitido é 0');
    });
});
