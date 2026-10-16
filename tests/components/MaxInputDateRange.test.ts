import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxInputDateRange from '../../src/components/MaxInputDateRange.vue';

function mountDateRange(props: Record<string, any> = {}) {
    return mount(MaxInputDateRange, {
        props: {
            modelValue: [null, null],
            ...props
        }
    });
}

describe('MaxInputDateRange', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('renderiza o componente com dois inputs e separador', () => {
        const wrapper = mountDateRange();
        expect(wrapper.exists()).toBe(true);
        const inputs = wrapper.findAll('.max-daterange-input');
        expect(inputs.length).toBe(2);
        expect(wrapper.find('.max-daterange-separator').text()).toBe('até');
    });

    it('formata datas ISO para exibição DD/MM/AAAA', () => {
        const wrapper = mountDateRange({
            modelValue: ['2026-05-10', '2026-05-20']
        });
        const inputs = wrapper.findAll('.max-daterange-input');
        expect((inputs[0].element as HTMLInputElement).value).toBe('10/05/2026');
        expect((inputs[1].element as HTMLInputElement).value).toBe('20/05/2026');
    });

    it('suporta modelo em formato objeto { start, end }', () => {
        const wrapper = mountDateRange({
            modelValue: { start: '2026-01-01', end: '2026-01-31' }
        });
        const inputs = wrapper.findAll('.max-daterange-input');
        expect((inputs[0].element as HTMLInputElement).value).toBe('01/01/2026');
        expect((inputs[1].element as HTMLInputElement).value).toBe('31/01/2026');
    });

    it('detecta quando a data inicial é maior que a data final e exibe erro', async () => {
        const wrapper = mountDateRange({
            modelValue: ['2026-05-20', '2026-05-10']
        });
        await wrapper.vm.$nextTick();
        const invalidInputs = wrapper.findAll('.is-invalid');
        expect(invalidInputs.length).toBe(2);
        expect(wrapper.text()).toContain('A data inicial não pode ser maior que a data final');
    });

    it('emite update:modelValue com array de datas ISO ao alterar campos', async () => {
        const wrapper = mountDateRange();
        const inputs = wrapper.findAll('.max-daterange-input');

        await inputs[0].setValue('15/03/2026');
        await inputs[0].trigger('input');

        const emitted = wrapper.emitted('update:modelValue');
        expect(emitted).toBeTruthy();
        expect(emitted![0][0]).toEqual(['2026-03-15', null]);
    });
});
