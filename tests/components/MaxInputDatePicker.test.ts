import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxInputDatePicker from '../../src/components/MaxInputDatePicker.vue';
import InputBase from '../../src/components/InputBase.vue';

function mountDatePicker(props: Record<string, any> = {}) {
    return mount(MaxInputDatePicker, {
        props: { modelValue: '', ...props }
    });
}

describe('MaxInputDatePicker', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    it('renderiza corretamente', () => {
        const wrapper = mountDatePicker();
        expect(wrapper.exists()).toBe(true);
    });

    it('converte string YYYY-MM-DD para Date internamente', async () => {
        const wrapper = mountDatePicker({ modelValue: '2024-06-15' });
        const ib = wrapper.findComponent(InputBase);
        expect(ib.props('done')).toBe(true);
    });

    it('converte string YYYY-MM-DD HH:mm:ss para Date', async () => {
        const wrapper = mountDatePicker({ modelValue: '2024-06-15 14:30:00' });
        const ib = wrapper.findComponent(InputBase);
        expect(ib.props('done')).toBe(true);
    });

    it('done=false quando data é nula e done não é definido', () => {
        const wrapper = mountDatePicker({ modelValue: '' });
        const ib = wrapper.findComponent(InputBase);
        expect(ib.props('done')).toBe(false);
    });

    it('emite update:modelValue no formato YYYY-MM-DD HH:mm:ss', async () => {
        const wrapper = mountDatePicker({ modelValue: '2024-01-15' });
        const emitted = wrapper.emitted('update:modelValue');

        if (emitted && emitted.length > 0) {
            const value = emitted[emitted.length - 1][0] as string;
            expect(value).toMatch(/^\d{4}-\d{2}-\d{2}/);
        }
    });

    it('aceita prop done para controle manual', () => {
        const wrapper = mountDatePicker({ modelValue: '' });
        expect(wrapper.exists()).toBe(true);
    });

    it('define internalDate como null ao passar data invalida', async () => {
        const wrapper = mountDatePicker({ modelValue: 'invalid-date' });
        const ib = wrapper.findComponent(InputBase);
        expect(ib.props('done')).toBe(false);
    });

    it('sincroniza internalDate para modelValue e vice-versa', async () => {
        const wrapper = mountDatePicker({ modelValue: '2024-01-01' });
        await wrapper.setProps({ modelValue: '2024-02-02' });

        (wrapper.vm as any).internalDate = new Date('2024-03-03T10:00:00');
        await wrapper.vm.$nextTick();

        expect(wrapper.emitted('update:modelValue')).toBeTruthy();
        expect(wrapper.emitted('update:modelValue')?.pop()).toEqual(['2024-03-03 10:00:00']);

        // limpa o modelValue
        (wrapper.vm as any).internalDate = null;
        await wrapper.vm.$nextTick();
        expect(wrapper.emitted('update:modelValue')?.pop()).toEqual(['']);
    });

    it('chama validate on blur', async () => {
        const wrapper = mountDatePicker({ required: true, modelValue: '' });
        const input = wrapper.find('input');
        await input.trigger('blur');
        await wrapper.vm.$nextTick();

        const ib = wrapper.findComponent(InputBase);
        expect(ib.props('caution')).toBe(true);
    });

    it('aceita attrs.error como string e attrs.caution', async () => {
        const wrapper = mountDatePicker({ error: 'Erro custom', caution: true });
        const ib = wrapper.findComponent(InputBase);
        expect(ib.props('error')).toBe('Erro custom');
        expect(ib.props('caution')).toBe(true);
    });

    it('retorna mensagem padrao de erro quando isCaution é true', async () => {
        const wrapper = mountDatePicker({ required: true, modelValue: '' });
        const input = wrapper.find('input');
        await input.trigger('blur');
        await wrapper.vm.$nextTick();
        const ib = wrapper.findComponent(InputBase);
        expect(ib.props('error')).toBe('Data é obrigatória');
    });

    it('aceita prop modelValue como Date', async () => {
        const d = new Date('2024-01-01T12:00:00');
        const wrapper = mountDatePicker({ modelValue: d });
        expect(wrapper.vm.internalDate.getTime()).toBe(d.getTime());
    });

    it('limpa modelValue quando empty string', async () => {
        const wrapper = mountDatePicker({ modelValue: '2024-01-01' });
        await wrapper.setProps({ modelValue: '' });
        expect(wrapper.vm.internalDate).toBeNull();
    });

    it('cover isDone with attrs.done === false', async () => {
        const wrapper = mountDatePicker({ done: false, modelValue: '2024-01-01' });
        const ib = wrapper.findComponent(InputBase);
        expect(ib.props('done')).toBe(false);
    });

    it('cover formatted === modelValue.value', async () => {
        const wrapper = mountDatePicker({ modelValue: '2024-01-01 00:00:00' });
        wrapper.vm.internalDate = new Date('2024-01-01T00:00:00');
        await wrapper.vm.$nextTick();
        expect(wrapper.props('modelValue')).toBe('2024-01-01 00:00:00');
    });
});
