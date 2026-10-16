import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxInputYear from '../../src/components/MaxInputYear.vue';
import MaxInputSelect from '../../src/components/MaxInputSelect.vue';

describe('MaxInputYear', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('renderiza corretamente o seletor de ano com defaults (ano ref ±1)', () => {
        const wrapper = mount(MaxInputYear);
        expect(wrapper.exists()).toBe(true);
        const select = wrapper.findComponent(MaxInputSelect);
        expect(select.exists()).toBe(true);
        expect(wrapper.find('label').text()).toBe('Ano');
        expect(select.props('placeholder')).toBe('Selecione o ano');

        const currentYear = new Date().getFullYear();
        const options = select.props('options') as any[];
        expect(options).toHaveLength(3);
        expect(options[0].value).toBe(currentYear - 1);
        expect(options[1].value).toBe(currentYear);
        expect(options[2].value).toBe(currentYear + 1);
    });

    it('aceita minYear e maxYear customizados', () => {
        const wrapper = mount(MaxInputYear, {
            props: {
                minYear: 2020,
                maxYear: 2024
            }
        });
        const select = wrapper.findComponent(MaxInputSelect);
        const options = select.props('options') as any[];
        expect(options).toHaveLength(5);
        expect(options.map((o) => o.value)).toEqual([2020, 2021, 2022, 2023, 2024]);
    });

    it('gera lista vazia para anos invertidos ou inválidos', () => {
        const wrapperInvertido = mount(MaxInputYear, {
            props: { minYear: 2030, maxYear: 2020 }
        });
        const selectInvertido = wrapperInvertido.findComponent(MaxInputSelect);
        expect(selectInvertido.props('options')).toHaveLength(0);

        const wrapperInvalido = mount(MaxInputYear, {
            props: { minYear: -5, maxYear: 2025 }
        });
        const selectInvalido = wrapperInvalido.findComponent(MaxInputSelect);
        expect(selectInvalido.props('options')).toHaveLength(0);
    });

    it('emite número (não string) no update:modelValue e change', async () => {
        const wrapper = mount(MaxInputYear, {
            props: { modelValue: null }
        });
        const select = wrapper.findComponent(MaxInputSelect);

        select.vm.$emit('update:modelValue', 2025);
        select.vm.$emit('change', 2025);
        await wrapper.vm.$nextTick();

        expect(wrapper.emitted('update:modelValue')![0]).toEqual([2025]);
        expect(wrapper.emitted('change')![0]).toEqual([2025]);
    });

    it('sanitiza string numérica para número', async () => {
        const wrapper = mount(MaxInputYear, {
            props: { modelValue: null }
        });
        const select = wrapper.findComponent(MaxInputSelect);

        select.vm.$emit('update:modelValue', '2026');
        await wrapper.vm.$nextTick();

        expect(wrapper.emitted('update:modelValue')![0]).toEqual([2026]);
    });

    it('emite null no update:modelValue, change e evento clear ao acionar clear', async () => {
        const wrapper = mount(MaxInputYear, {
            props: { modelValue: 2024, clearable: true }
        });
        const select = wrapper.findComponent(MaxInputSelect);

        select.vm.$emit('clear');
        await wrapper.vm.$nextTick();

        expect(wrapper.emitted('clear')).toBeTruthy();
        expect(wrapper.emitted('update:modelValue')![0]).toEqual([null]);
        expect(wrapper.emitted('change')![0]).toEqual([null]);
    });

    it('não ecoa update:modelValue quando modelValue for alterado externamente pelo pai', async () => {
        const wrapper = mount(MaxInputYear, {
            props: { modelValue: 2025 }
        });
        const select = wrapper.findComponent(MaxInputSelect);

        await wrapper.setProps({ modelValue: 2026 });
        select.vm.$emit('update:modelValue', 2026);
        await wrapper.vm.$nextTick();

        expect(wrapper.emitted('update:modelValue')).toBeFalsy();
    });
});
