import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import MaxInputCoordinateDecimalLat from '../../src/components/MaxInputCoordinateDecimalLat.vue';
import { vMaska } from 'maska/vue';

const globalOptions = {
    directives: { maska: vMaska },
    stubs: { InputBase: { template: '<div><slot /></div>', props: ['error', 'caution', 'done'] }, InputText: { template: '<input />' } }
};

describe('MaxInputCoordinateDecimalLat', () => {
    it('deve renderizar o componente corretamente', () => {
        const wrapper = mount(MaxInputCoordinateDecimalLat, { global: globalOptions });
        expect(wrapper.exists()).toBe(true);
    });

    it('deve formatar valor e emitir update:modelValue', async () => {
        const wrapper = mount(MaxInputCoordinateDecimalLat, {
            props: { modelValue: '' },
            global: globalOptions
        });
        wrapper.vm.temp_value = '-23.550520';
        await wrapper.vm.$nextTick();
        expect(wrapper.emitted('update:modelValue')).toBeTruthy();
        expect(wrapper.emitted('update:modelValue')?.pop()).toEqual([-23.55052]);
        // check negative ref
        expect(wrapper.vm.negative).toBe(true);
    });

    it('testa computed properties error, caution, e done com target inválido', async () => {
        const wrapper = mount(MaxInputCoordinateDecimalLat, {
            props: { modelValue: '100' }, // invalid lat
            global: globalOptions
        });
        expect(wrapper.vm.done).toBe(false);
        expect(wrapper.vm.caution).toBe(true);
        expect(wrapper.vm.error).toBe('Latitude inválida.');

        wrapper.vm.checkDone();
        expect(wrapper.vm.isDone).toBe(false);
    });

    it('testa computed property caution quando temp_value é vazio', async () => {
        const wrapper = mount(MaxInputCoordinateDecimalLat, {
            props: { modelValue: '' },
            global: globalOptions
        });
        expect(wrapper.vm.caution).toBe(false);
    });

    it('testa computed property error quando obrigatório e vazio', async () => {
        const wrapper = mount(MaxInputCoordinateDecimalLat, {
            props: { modelValue: '', required: true },
            global: globalOptions
        });
        expect(wrapper.vm.error).toBe('Campo obrigatório');
    });

    it('testa se emit complete quando done é verdadeiro', async () => {
        const wrapper = mount(MaxInputCoordinateDecimalLat, {
            props: { modelValue: '' },
            global: globalOptions
        });
        wrapper.vm.temp_value = '-23.5'; // valid lat inside Brazil
        await wrapper.vm.$nextTick();
        expect(wrapper.emitted('complete')).toBeTruthy();
    });

    it('testa as watch do props.modelValue', async () => {
        const wrapper = mount(MaxInputCoordinateDecimalLat, {
            props: { modelValue: '' },
            global: globalOptions
        });
        await wrapper.setProps({ modelValue: '-10' });
        expect(wrapper.vm.temp_value).toBe('-10');
    });

    it('testa propriedades done e caution manuais via prop', async () => {
        const wrapper = mount(MaxInputCoordinateDecimalLat, {
            props: { modelValue: '', done: true, caution: true },
            global: globalOptions
        });
        expect(wrapper.vm.done).toBe(true);
        expect(wrapper.vm.caution).toBe(true);
    });

    it('testa error retornando false quando válido', async () => {
        const wrapper = mount(MaxInputCoordinateDecimalLat, {
            props: { modelValue: '-23.5', required: true },
            global: globalOptions
        });
        expect(wrapper.vm.error).toBe(false);
    });

    it('aceita latitude 4.x pela máscara (dígito "4" no primeiro token) e marca done=true', async () => {
        const wrapper = mount(MaxInputCoordinateDecimalLat, {
            props: { modelValue: '' },
            global: globalOptions
        });
        wrapper.vm.temp_value = '4.5';
        await wrapper.vm.$nextTick();
        expect(wrapper.vm.maskValue.tokens['3'].pattern.test('4')).toBe(true);
        expect(wrapper.vm.done).toBe(true);
    });

    it('reseta negative ao esvaziar temp_value após um valor negativo', async () => {
        const wrapper = mount(MaxInputCoordinateDecimalLat, {
            props: { modelValue: '' },
            global: globalOptions
        });
        wrapper.vm.temp_value = '-23.5';
        await wrapper.vm.$nextTick();
        expect(wrapper.vm.negative).toBe(true);

        wrapper.vm.temp_value = '';
        await wrapper.vm.$nextTick();
        expect(wrapper.vm.negative).toBe(false);
    });

    it('campo vazio e não obrigatório não deve mostrar erro', async () => {
        const wrapper = mount(MaxInputCoordinateDecimalLat, {
            props: { modelValue: '', required: false },
            global: globalOptions
        });
        expect(wrapper.vm.error).toBe(false);
    });

    it('emite update:modelValue como number, não string', async () => {
        const wrapper = mount(MaxInputCoordinateDecimalLat, {
            props: { modelValue: '' },
            global: globalOptions
        });
        wrapper.vm.temp_value = '-23.550520';
        await wrapper.vm.$nextTick();
        const emittedValue = wrapper.emitted('update:modelValue')?.pop()?.[0];
        expect(typeof emittedValue).toBe('number');
    });

    it('não emite update:modelValue com valor congelado ao apagar (achado 10-like: reduz sem travar)', async () => {
        const wrapper = mount(MaxInputCoordinateDecimalLat, {
            props: { modelValue: '' },
            global: globalOptions
        });
        wrapper.vm.temp_value = '-23.550520';
        await wrapper.vm.$nextTick();

        wrapper.vm.temp_value = '';
        await wrapper.vm.$nextTick();
        expect(wrapper.emitted('update:modelValue')?.pop()).toEqual([0]);
    });
});
