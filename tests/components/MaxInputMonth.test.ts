import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxInputMonth from '../../src/components/MaxInputMonth.vue';
import MaxInputSelect from '../../src/components/MaxInputSelect.vue';

describe('MaxInputMonth', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('renderiza corretamente o seletor de mês', () => {
        const wrapper = mount(MaxInputMonth);
        expect(wrapper.exists()).toBe(true);
        const select = wrapper.findComponent(MaxInputSelect);
        expect(select.exists()).toBe(true);
        expect(wrapper.find('label').text()).toBe('Mês');
        expect(select.props('placeholder')).toBe('Selecione o mês');
    });

    it('possui exatamente 12 meses com valores numéricos de 1 a 12', () => {
        const wrapper = mount(MaxInputMonth);
        const select = wrapper.findComponent(MaxInputSelect);
        const options = select.props('options') as any[];
        expect(options).toHaveLength(12);
        expect(options[0].value).toBe(1);
        expect(options[0].label).toBe('Janeiro');
        expect(options[11].value).toBe(12);
        expect(options[11].label).toBe('Dezembro');
    });

    it('não permite sobrescrever catálogo de opções via attrs', () => {
        const wrapper = mount(MaxInputMonth, {
            attrs: {
                options: [{ value: 99, label: 'Outro' }]
            }
        });
        const select = wrapper.findComponent(MaxInputSelect);
        const options = select.props('options') as any[];
        expect(options).toHaveLength(12);
        expect(options[0].value).toBe(1);
    });

    it('emite número (não string) no update:modelValue e change', async () => {
        const wrapper = mount(MaxInputMonth, {
            props: { modelValue: null }
        });
        const select = wrapper.findComponent(MaxInputSelect);

        // Simulando emissão (mesmo se vier string '5' do select nativo, deve sanitizar para 5)
        select.vm.$emit('update:modelValue', 5);
        select.vm.$emit('change', 5);
        await wrapper.vm.$nextTick();

        expect(wrapper.emitted('update:modelValue')![0]).toEqual([5]);
        expect(wrapper.emitted('change')![0]).toEqual([5]);
    });

    it('sanitiza string numérica para número', async () => {
        const wrapper = mount(MaxInputMonth, {
            props: { modelValue: null }
        });
        const select = wrapper.findComponent(MaxInputSelect);

        select.vm.$emit('update:modelValue', '10');
        await wrapper.vm.$nextTick();

        expect(wrapper.emitted('update:modelValue')![0]).toEqual([10]);
    });

    it('emite null no update:modelValue, change e evento clear ao acionar clear', async () => {
        const wrapper = mount(MaxInputMonth, {
            props: { modelValue: 6, clearable: true }
        });
        const select = wrapper.findComponent(MaxInputSelect);

        select.vm.$emit('clear');
        await wrapper.vm.$nextTick();

        expect(wrapper.emitted('clear')).toBeTruthy();
        expect(wrapper.emitted('update:modelValue')![0]).toEqual([null]);
        expect(wrapper.emitted('change')![0]).toEqual([null]);
    });

    it('não ecoa update:modelValue quando modelValue for alterado externamente pelo pai', async () => {
        const wrapper = mount(MaxInputMonth, {
            props: { modelValue: 3 }
        });
        const select = wrapper.findComponent(MaxInputSelect);

        await wrapper.setProps({ modelValue: 4 });
        select.vm.$emit('update:modelValue', 4);
        await wrapper.vm.$nextTick();

        expect(wrapper.emitted('update:modelValue')).toBeFalsy();
    });
});
