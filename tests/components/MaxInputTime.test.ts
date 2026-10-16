import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxInputTime from '../../src/components/MaxInputTime.vue';
import MaxInputSelect from '../../src/components/MaxInputSelect.vue';

describe('MaxInputTime', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('renderiza corretamente o seletor de horário com defaults', () => {
        const wrapper = mount(MaxInputTime);
        expect(wrapper.exists()).toBe(true);
        const select = wrapper.findComponent(MaxInputSelect);
        expect(select.exists()).toBe(true);
        expect(wrapper.find('label').text()).toBe('Horário');
        expect(select.props('placeholder')).toBe('Selecione o horário');

        const options = select.props('options') as any[];
        // 00:00 até 23:30 a cada 30 min = 48 opções
        expect(options).toHaveLength(48);
        expect(options[0].value).toBe('00:00');
        expect(options[options.length - 1].value).toBe('23:30');
    });

    it('gera faixa configurada 07:00–19:00 com step 60 (reproduzindo Snooze)', () => {
        const wrapper = mount(MaxInputTime, {
            props: {
                minTime: '07:00',
                maxTime: '19:00',
                stepMinutes: 60
            }
        });
        const select = wrapper.findComponent(MaxInputSelect);
        const options = select.props('options') as any[];
        // 07:00, 08:00, ..., 19:00 = 13 opções
        expect(options).toHaveLength(13);
        expect(options[0].value).toBe('07:00');
        expect(options[options.length - 1].value).toBe('19:00');
    });

    it('gera lista vazia para horários invertidos ou inválidos', () => {
        const wrapperInvertido = mount(MaxInputTime, {
            props: { minTime: '20:00', maxTime: '08:00' }
        });
        const selectInvertido = wrapperInvertido.findComponent(MaxInputSelect);
        expect(selectInvertido.props('options')).toHaveLength(0);

        const wrapperInvalido = mount(MaxInputTime, {
            props: { minTime: 'invalido', maxTime: '23:59' }
        });
        const selectInvalido = wrapperInvalido.findComponent(MaxInputSelect);
        expect(selectInvalido.props('options')).toHaveLength(0);

        const wrapperStepInvalido = mount(MaxInputTime, {
            props: { stepMinutes: 0 }
        });
        const selectStepInvalido = wrapperStepInvalido.findComponent(MaxInputSelect);
        expect(selectStepInvalido.props('options')).toHaveLength(0);
    });

    it('não altera o modelValue quando a faixa é modificada', async () => {
        const wrapper = mount(MaxInputTime, {
            props: {
                modelValue: '08:00',
                minTime: '07:00',
                maxTime: '19:00'
            }
        });

        // Estreitando a faixa excluindo 08:00
        await wrapper.setProps({ minTime: '10:00', maxTime: '18:00' });
        await wrapper.vm.$nextTick();

        // Não deve forçar update:modelValue
        expect(wrapper.emitted('update:modelValue')).toBeFalsy();
    });

    it('emite update:modelValue e change ao selecionar horário', async () => {
        const wrapper = mount(MaxInputTime, {
            props: { modelValue: null }
        });
        const select = wrapper.findComponent(MaxInputSelect);

        select.vm.$emit('update:modelValue', '14:30');
        select.vm.$emit('change', '14:30');
        await wrapper.vm.$nextTick();

        expect(wrapper.emitted('update:modelValue')![0]).toEqual(['14:30']);
        expect(wrapper.emitted('change')![0]).toEqual(['14:30']);
    });

    it('emite null no update:modelValue, change e evento clear ao acionar clear', async () => {
        const wrapper = mount(MaxInputTime, {
            props: { modelValue: '10:00', clearable: true }
        });
        const select = wrapper.findComponent(MaxInputSelect);

        select.vm.$emit('clear');
        await wrapper.vm.$nextTick();

        expect(wrapper.emitted('clear')).toBeTruthy();
        expect(wrapper.emitted('update:modelValue')![0]).toEqual([null]);
        expect(wrapper.emitted('change')![0]).toEqual([null]);
    });

    it('não ecoa update:modelValue quando modelValue for alterado externamente pelo pai', async () => {
        const wrapper = mount(MaxInputTime, {
            props: { modelValue: '09:00' }
        });
        const select = wrapper.findComponent(MaxInputSelect);

        await wrapper.setProps({ modelValue: '10:00' });
        select.vm.$emit('update:modelValue', '10:00');
        await wrapper.vm.$nextTick();

        expect(wrapper.emitted('update:modelValue')).toBeFalsy();
    });
});
