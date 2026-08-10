import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import MaxInputCoordinateDecimalLng from '../../src/components/MaxInputCoordinateDecimalLng.vue';
import { vMaska } from 'maska/vue';

const globalOptions = {
    directives: { maska: vMaska },
    stubs: { InputBase: { template: '<div><slot /></div>', props: ['error', 'caution', 'done'] }, InputText: { template: '<input />' } }
};

describe('MaxInputCoordinateDecimalLng', () => {
    it('deve renderizar o componente corretamente', () => {
        const wrapper = mount(MaxInputCoordinateDecimalLng, { global: globalOptions });
        expect(wrapper.exists()).toBe(true);
    });

    it('deve formatar valor e emitir update:modelValue', async () => {
        const wrapper = mount(MaxInputCoordinateDecimalLng, {
            props: { modelValue: '' },
            global: globalOptions
        });
        wrapper.vm.temp_value = '-46.633308';
        await wrapper.vm.$nextTick();
        expect(wrapper.emitted('update:modelValue')).toBeTruthy();
        expect(wrapper.emitted('update:modelValue')?.pop()).toEqual([-46.633308]);
    });

    it('testa computed properties error, caution, e done com target inválido', async () => {
        const wrapper = mount(MaxInputCoordinateDecimalLng, {
            props: { modelValue: '100' }, // invalid lng for BR
            global: globalOptions
        });
        expect(wrapper.vm.done).toBe(false);
        expect(wrapper.vm.caution).toBe(true);
        expect(wrapper.vm.error).toBe('Longitude inválida.');

        wrapper.vm.checkDone();
        expect(wrapper.vm.isDone).toBe(false);
    });

    it('testa computed property caution quando temp_value é vazio', async () => {
        const wrapper = mount(MaxInputCoordinateDecimalLng, {
            props: { modelValue: '' },
            global: globalOptions
        });
        expect(wrapper.vm.caution).toBe(false);
    });

    it('testa computed property error quando obrigatório e vazio', async () => {
        const wrapper = mount(MaxInputCoordinateDecimalLng, {
            props: { modelValue: '', required: true },
            global: globalOptions
        });
        expect(wrapper.vm.error).toBe('Campo obrigatório');
    });

    it('testa se emit complete quando done é verdadeiro', async () => {
        const wrapper = mount(MaxInputCoordinateDecimalLng, {
            props: { modelValue: '' },
            global: globalOptions
        });
        wrapper.vm.temp_value = '-46.6'; // valid lng inside Brazil
        await wrapper.vm.$nextTick();
        expect(wrapper.emitted('complete')).toBeTruthy();
    });

    it('testa as watch do props.modelValue', async () => {
        const wrapper = mount(MaxInputCoordinateDecimalLng, {
            props: { modelValue: '' },
            global: globalOptions
        });
        await wrapper.setProps({ modelValue: '-40' });
        expect(wrapper.vm.temp_value).toBe(-40);
    });

    it('testa propriedades done e caution manuais via prop', async () => {
        const wrapper = mount(MaxInputCoordinateDecimalLng, {
            props: { modelValue: '', done: true, caution: true },
            global: globalOptions
        });
        expect(wrapper.vm.done).toBe(true);
        expect(wrapper.vm.caution).toBe(true);
    });

    it('testa error retornando false quando válido', async () => {
        const wrapper = mount(MaxInputCoordinateDecimalLng, {
            props: { modelValue: '-46.6', required: true },
            global: globalOptions
        });
        expect(wrapper.vm.error).toBe(false);
    });

    it('campo obrigatório e vazio não deve retornar done=true', async () => {
        const wrapper = mount(MaxInputCoordinateDecimalLng, {
            props: { modelValue: '', required: true },
            global: globalOptions
        });
        expect(wrapper.vm.done).not.toBe(true);
    });
});
