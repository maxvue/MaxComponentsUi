import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxInputCoordinateDecimalLat from '../../src/components/MaxInputCoordinateDecimalLat.vue';
import MaxInputCoordinateDecimalLng from '../../src/components/MaxInputCoordinateDecimalLng.vue';
import InputBase from '../../src/components/InputBase.vue';

function mountCoord(component: any, props: Record<string, any> = {}) {
    return mount(component, {
        props: { modelValue: '', ...props }
    });
}

describe('MaxInputCoordinateDecimalLat', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('renderiza corretamente', () => {
        const wrapper = mountCoord(MaxInputCoordinateDecimalLat);
        expect(wrapper.exists()).toBe(true);
    });

    it('valida latitude dentro do território brasileiro (-23.5) após blur', async () => {
        const wrapper = mountCoord(MaxInputCoordinateDecimalLat, { modelValue: -23.550520 });
        const input = wrapper.find('input');
        await input.trigger('blur');

        const ib = wrapper.findComponent(InputBase);
        expect(ib.props('done')).toBe(true);
    });

    it('valida latitude no limite norte do Brasil (5.0) após blur', async () => {
        const wrapper = mountCoord(MaxInputCoordinateDecimalLat, { modelValue: 5.0 });
        const input = wrapper.find('input');
        await input.trigger('blur');

        const ib = wrapper.findComponent(InputBase);
        expect(ib.props('done')).toBe(true);
    });

    it('invalida latitude fora do Brasil (positiva alta: 10.0)', () => {
        const wrapper = mountCoord(MaxInputCoordinateDecimalLat, { modelValue: 10.0 });
        const ib = wrapper.findComponent(InputBase);
        expect(ib.props('done')).not.toBe(true);
    });

    it('invalida latitude fora do Brasil (negativa extrema: -40.0)', () => {
        const wrapper = mountCoord(MaxInputCoordinateDecimalLat, { modelValue: -40.0 });
        const ib = wrapper.findComponent(InputBase);
        expect(ib.props('done')).not.toBe(true);
    });

    it('mostra erro "Campo obrigatório" quando vazio e required', () => {
        const wrapper = mountCoord(MaxInputCoordinateDecimalLat, { required: true, modelValue: '' });
        const ib = wrapper.findComponent(InputBase);
        expect(ib.props('error')).toBe('Campo obrigatório');
    });

    it('mostra erro "Latitude inválida." para valor fora da faixa', () => {
        const wrapper = mountCoord(MaxInputCoordinateDecimalLat, { modelValue: 50.0 });
        const ib = wrapper.findComponent(InputBase);
        expect(ib.props('error')).toBe('Latitude inválida.');
    });

    it('preserva InputBase como wrapper raiz e não emite marcações do PrimeVue em Lat', () => {
        const wrapper = mountCoord(MaxInputCoordinateDecimalLat);
        expect(wrapper.findComponent(InputBase).exists()).toBe(true);
        expect(wrapper.element.classList).toContain('max-input-main-div');
        expect(wrapper.html()).not.toContain('data-pc-name');
        expect(wrapper.html()).not.toContain('data-pc-section');
    });
});

describe('MaxInputCoordinateDecimalLng', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('renderiza corretamente', () => {
        const wrapper = mountCoord(MaxInputCoordinateDecimalLng);
        expect(wrapper.exists()).toBe(true);
    });

    it('valida longitude dentro do território brasileiro (-46.6) após blur', async () => {
        const wrapper = mountCoord(MaxInputCoordinateDecimalLng, { modelValue: -46.633309 });
        const input = wrapper.find('input');
        await input.trigger('blur');

        const ib = wrapper.findComponent(InputBase);
        expect(ib.props('done')).toBe(true);
    });

    it('invalida longitude fora do Brasil (-80.0)', () => {
        const wrapper = mountCoord(MaxInputCoordinateDecimalLng, { modelValue: -80.0 });
        const ib = wrapper.findComponent(InputBase);
        expect(ib.props('done')).not.toBe(true);
    });

    it('invalida longitude positiva (fora do Brasil)', () => {
        const wrapper = mountCoord(MaxInputCoordinateDecimalLng, { modelValue: 10.0 });
        const ib = wrapper.findComponent(InputBase);
        expect(ib.props('done')).not.toBe(true);
    });

    it('mostra erro "Campo obrigatório" quando vazio e required', () => {
        const wrapper = mountCoord(MaxInputCoordinateDecimalLng, { required: true, modelValue: '' });
        const ib = wrapper.findComponent(InputBase);
        expect(ib.props('error')).toBe('Campo obrigatório');
    });

    it('mostra erro "Longitude inválida." para valor fora da faixa', () => {
        const wrapper = mountCoord(MaxInputCoordinateDecimalLng, { modelValue: -80.0 });
        const ib = wrapper.findComponent(InputBase);
        expect(ib.props('error')).toBe('Longitude inválida.');
    });

    it('preserva InputBase como wrapper raiz e não emite marcações do PrimeVue em Lng', () => {
        const wrapper = mountCoord(MaxInputCoordinateDecimalLng);
        expect(wrapper.findComponent(InputBase).exists()).toBe(true);
        expect(wrapper.element.classList).toContain('max-input-main-div');
        expect(wrapper.html()).not.toContain('data-pc-name');
        expect(wrapper.html()).not.toContain('data-pc-section');
    });
});
