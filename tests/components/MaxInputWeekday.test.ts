import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxInputWeekday from '../../src/components/MaxInputWeekday.vue';
import MaxInputSelect from '../../src/components/MaxInputSelect.vue';

describe('MaxInputWeekday', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('renderiza corretamente o seletor de dia da semana', () => {
        const wrapper = mount(MaxInputWeekday);
        expect(wrapper.exists()).toBe(true);
        const select = wrapper.findComponent(MaxInputSelect);
        expect(select.exists()).toBe(true);
        expect(wrapper.find('label').text()).toBe('Dia da semana');
        expect(select.props('placeholder')).toBe('Selecione o dia da semana');
    });

    it('possui exatamente 7 dias ordenados de segunda a domingo no catálogo fixo', () => {
        const wrapper = mount(MaxInputWeekday);
        const select = wrapper.findComponent(MaxInputSelect);
        const options = select.props('options') as any[];
        expect(options).toHaveLength(7);
        expect(options.map((o) => o.value)).toEqual([
            'monday',
            'tuesday',
            'wednesday',
            'thursday',
            'friday',
            'saturday',
            'sunday'
        ]);
        expect(options[0].label).toBe('Segunda-feira');
        expect(options[6].label).toBe('Domingo');
    });

    it('não permite sobrescrever catálogo de opções via attrs', () => {
        const wrapper = mount(MaxInputWeekday, {
            attrs: {
                options: [{ value: 'other', label: 'Outro' }]
            }
        });
        const select = wrapper.findComponent(MaxInputSelect);
        const options = select.props('options') as any[];
        expect(options).toHaveLength(7);
        expect(options[0].value).toBe('monday');
    });

    it('emite update:modelValue e change com o dia selecionado', async () => {
        const wrapper = mount(MaxInputWeekday, {
            props: { modelValue: null }
        });
        const select = wrapper.findComponent(MaxInputSelect);

        select.vm.$emit('update:modelValue', 'friday');
        select.vm.$emit('change', 'friday');
        await wrapper.vm.$nextTick();

        expect(wrapper.emitted('update:modelValue')![0]).toEqual(['friday']);
        expect(wrapper.emitted('change')![0]).toEqual(['friday']);
    });

    it('emite null no update:modelValue, change e evento clear ao acionar clear', async () => {
        const wrapper = mount(MaxInputWeekday, {
            props: { modelValue: 'monday', clearable: true }
        });
        const select = wrapper.findComponent(MaxInputSelect);

        select.vm.$emit('clear');
        await wrapper.vm.$nextTick();

        expect(wrapper.emitted('clear')).toBeTruthy();
        expect(wrapper.emitted('update:modelValue')![0]).toEqual([null]);
        expect(wrapper.emitted('change')![0]).toEqual([null]);
    });

    it('não ecoa update:modelValue quando modelValue for alterado externamente pelo pai', async () => {
        const wrapper = mount(MaxInputWeekday, {
            props: { modelValue: 'monday' }
        });
        const select = wrapper.findComponent(MaxInputSelect);

        await wrapper.setProps({ modelValue: 'tuesday' });
        select.vm.$emit('update:modelValue', 'tuesday');
        await wrapper.vm.$nextTick();

        expect(wrapper.emitted('update:modelValue')).toBeFalsy();
    });
});
