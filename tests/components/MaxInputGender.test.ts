import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxInputGender from '../../src/components/MaxInputGender.vue';
import MaxInputSelect from '../../src/components/MaxInputSelect.vue';

describe('MaxInputGender', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('renderiza corretamente o seletor de gênero', () => {
        const wrapper = mount(MaxInputGender);
        expect(wrapper.exists()).toBe(true);
        const select = wrapper.findComponent(MaxInputSelect);
        expect(select.exists()).toBe(true);
        expect(wrapper.find('label').text()).toBe('Gênero');
        expect(select.props('placeholder')).toBe('Selecione o gênero');
    });

    it('possui exatamente as opções M e F no catálogo fixo', () => {
        const wrapper = mount(MaxInputGender);
        const select = wrapper.findComponent(MaxInputSelect);
        const options = select.props('options') as any[];
        expect(options).toHaveLength(2);
        expect(options[0].value).toBe('M');
        expect(options[0].label).toBe('Masculino');
        expect(options[1].value).toBe('F');
        expect(options[1].label).toBe('Feminino');
    });

    it('não permite sobrescrever catálogo de opções via attrs', () => {
        const wrapper = mount(MaxInputGender, {
            attrs: {
                options: [{ value: 'OTHER', label: 'Outro' }]
            }
        });
        const select = wrapper.findComponent(MaxInputSelect);
        const options = select.props('options') as any[];
        expect(options).toHaveLength(2);
        expect(options[0].value).toBe('M');
    });

    it('permite sobrescrever label e placeholder', () => {
        const wrapper = mount(MaxInputGender, {
            props: {
                label: 'Sexo Biológico',
                placeholder: 'Selecione M ou F'
            }
        });
        const select = wrapper.findComponent(MaxInputSelect);
        expect(wrapper.find('label').text()).toBe('Sexo Biológico');
        expect(select.props('placeholder')).toBe('Selecione M ou F');
    });

    it('emite update:modelValue e change ao selecionar uma opção', async () => {
        const wrapper = mount(MaxInputGender, {
            props: { modelValue: null }
        });
        const select = wrapper.findComponent(MaxInputSelect);

        select.vm.$emit('update:modelValue', 'F');
        select.vm.$emit('change', 'F');
        await wrapper.vm.$nextTick();

        expect(wrapper.emitted('update:modelValue')).toBeTruthy();
        expect(wrapper.emitted('update:modelValue')![0]).toEqual(['F']);
        expect(wrapper.emitted('change')).toBeTruthy();
        expect(wrapper.emitted('change')![0]).toEqual(['F']);
    });

    it('emite null no update:modelValue, change e evento clear ao acionar clear', async () => {
        const wrapper = mount(MaxInputGender, {
            props: { modelValue: 'M', clearable: true }
        });
        const select = wrapper.findComponent(MaxInputSelect);

        select.vm.$emit('clear');
        await wrapper.vm.$nextTick();

        expect(wrapper.emitted('clear')).toBeTruthy();
        expect(wrapper.emitted('update:modelValue')![0]).toEqual([null]);
        expect(wrapper.emitted('change')![0]).toEqual([null]);
    });

    it('não ecoa update:modelValue quando modelValue for alterado externamente pelo pai', async () => {
        const wrapper = mount(MaxInputGender, {
            props: { modelValue: 'M' }
        });
        const select = wrapper.findComponent(MaxInputSelect);

        await wrapper.setProps({ modelValue: 'F' });
        select.vm.$emit('update:modelValue', 'F');
        await wrapper.vm.$nextTick();

        expect(wrapper.emitted('update:modelValue')).toBeFalsy();
    });
});
