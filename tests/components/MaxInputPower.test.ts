import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxInputPower from '../../src/components/MaxInputPower.vue';

function mountPower(props: Record<string, any> = {}) {
    return mount(MaxInputPower, {
        props: { modelValue: null, ...props }
    });
}

describe('MaxInputPower', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('renderiza corretamente com unidade kW padrão', () => {
        const wrapper = mountPower({ modelValue: 5.5 });
        expect(wrapper.exists()).toBe(true);
        expect(wrapper.text()).toContain('kW');
        const input = wrapper.find('input');
        expect((input.element as HTMLInputElement).value).toBe('5,5');
    });

    it('permite alternar unidade para W ou kWp sem conversão automática do modelo', async () => {
        const wrapper = mountPower({ modelValue: 10, unit: 'kWp' });
        expect(wrapper.text()).toContain('kWp');
        const input = wrapper.find('input');
        expect((input.element as HTMLInputElement).value).toBe('10');

        await wrapper.setProps({ unit: 'W' });
        expect(wrapper.text()).toContain('W');
        expect((input.element as HTMLInputElement).value).toBe('10');
    });

    it('valida min=0 padrão', async () => {
        const wrapper = mountPower();
        const input = wrapper.find('input');

        await input.setValue('-1');
        expect(wrapper.text()).toContain('Valor mínimo permitido é 0');

        await input.setValue('0');
        const emitted = wrapper.emitted('update:modelValue')!;
        expect(emitted[emitted.length - 1]).toEqual([0]);
    });
});
