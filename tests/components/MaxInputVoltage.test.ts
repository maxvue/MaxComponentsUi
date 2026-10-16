import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxInputVoltage from '../../src/components/MaxInputVoltage.vue';
import MaxInputSelect from '../../src/components/MaxInputSelect.vue';
import MaxBaseQuantity from '../../src/components/base/MaxBaseQuantity.vue';

function mountVoltage(props: Record<string, any> = {}) {
    return mount(MaxInputVoltage, {
        props: { modelValue: null, ...props }
    });
}

describe('MaxInputVoltage', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('renderiza no modo numérico padrão quando options não é fornecido', () => {
        const wrapper = mountVoltage({ modelValue: 220 });
        expect(wrapper.findComponent(MaxBaseQuantity).exists()).toBe(true);
        expect(wrapper.findComponent(MaxInputSelect).exists()).toBe(false);
        expect(wrapper.text()).toContain('V');
        const input = wrapper.find('input');
        expect((input.element as HTMLInputElement).value).toBe('220');
    });

    it('renderiza no modo select quando options é fornecido', () => {
        const options = [
            { name: '127 V', value: 127 },
            { name: '220 V', value: 220 },
            { name: '380 V', value: 380 }
        ];
        const wrapper = mountVoltage({ modelValue: 220, options });
        expect(wrapper.findComponent(MaxInputSelect).exists()).toBe(true);
        expect(wrapper.findComponent(MaxBaseQuantity).exists()).toBe(false);
        expect(wrapper.text()).toContain('220 V');
    });

    it('valida limites no modo numérico', async () => {
        const wrapper = mountVoltage({ min: 100, max: 500 });
        const input = wrapper.find('input');

        await input.setValue('50');
        expect(wrapper.text()).toContain('Valor mínimo permitido é 100');

        await input.setValue('220');
        const emitted = wrapper.emitted('update:modelValue')!;
        expect(emitted[emitted.length - 1]).toEqual([220]);
    });

    it('aplica mesma validação de limites no modo select', () => {
        const options = [
            { name: '127 V', value: 127 },
            { name: '220 V', value: 220 },
            { name: '380 V', value: 380 }
        ];
        const wrapper = mountVoltage({ modelValue: 380, options, max: 250 });
        expect(wrapper.text()).toContain('Valor máximo permitido é 250');
    });
});
