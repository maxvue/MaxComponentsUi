import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxInputWeekInterval from '../../src/components/MaxInputWeekInterval.vue';
import MaxInputSelect from '../../src/components/MaxInputSelect.vue';

function mountWeekInterval(props: Record<string, any> = {}) {
    return mount(MaxInputWeekInterval, {
        props: { modelValue: null, ...props }
    });
}

describe('MaxInputWeekInterval', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('renderiza corretamente compondo MaxInputSelect com opções padrão', () => {
        const wrapper = mountWeekInterval({ modelValue: 2 });
        expect(wrapper.exists()).toBe(true);
        expect(wrapper.findComponent(MaxInputSelect).exists()).toBe(true);
        expect(wrapper.text()).toContain('A cada 2 semanas (quinzenal)');
    });

    it('permite customizar opções de semanas com inteiros positivos', () => {
        const customOptions = [
            { name: 'Quinzenal (2 semanas)', value: 2 },
            { name: 'Mensal (4 semanas)', value: 4 },
            { name: 'Bimestral (8 semanas)', value: 8 }
        ];
        const wrapper = mountWeekInterval({ modelValue: 8, options: customOptions });
        expect(wrapper.text()).toContain('Bimestral (8 semanas)');
    });

    it('emite null ao limpar a seleção', async () => {
        const wrapper = mountWeekInterval({ modelValue: 1 });
        const select = wrapper.findComponent(MaxInputSelect);
        await select.vm.$emit('update:modelValue', null);

        const emitted = wrapper.emitted('update:modelValue')!;
        expect(emitted[emitted.length - 1]).toEqual([null]);
    });

    it('rejeita valores não inteiros ou não positivos', () => {
        const wrapper = mountWeekInterval({ modelValue: -1 });
        expect(wrapper.text()).toContain('Intervalo de semanas deve ser um número inteiro positivo');
    });
});
