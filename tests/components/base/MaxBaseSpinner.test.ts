import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import MaxBaseSpinner from '../../../src/components/base/MaxBaseSpinner.vue';

describe('MaxBaseSpinner', () => {
    it('renderiza um <svg> com viewBox="25 25 50 50"', () => {
        const wrapper = mount(MaxBaseSpinner);
        const svg = wrapper.find('svg');
        expect(svg.exists()).toBe(true);
        expect(svg.attributes('viewBox')).toBe('25 25 50 50');
    });

    it('aplica role="progressbar" e aria-busy="true"', () => {
        const wrapper = mount(MaxBaseSpinner);
        const root = wrapper.find('.max-base-spinner');
        expect(root.attributes('role')).toBe('progressbar');
        expect(root.attributes('aria-busy')).toBe('true');
    });

    it('aplica as classes max-base-spinner e max-base-spinner-spin', () => {
        const wrapper = mount(MaxBaseSpinner);
        expect(wrapper.find('.max-base-spinner').exists()).toBe(true);
        expect(wrapper.find('.max-base-spinner-spin').exists()).toBe(true);
    });

    it('strokeWidth customizado chega ao atributo stroke-width do <circle>', () => {
        const wrapper = mount(MaxBaseSpinner, { props: { strokeWidth: '5' } });
        const circle = wrapper.find('circle');
        expect(circle.attributes('stroke-width')).toBe('5');
    });

    it('fill customizado e aplicado no <circle>', () => {
        const wrapper = mount(MaxBaseSpinner, { props: { fill: 'red' } });
        const circle = wrapper.find('circle');
        expect(circle.attributes('fill')).toBe('red');
    });

    it('animationDuration customizado vira style inline no <svg>', () => {
        const wrapper = mount(MaxBaseSpinner, { props: { animationDuration: '5s' } });
        const svg = wrapper.find('svg');
        expect(svg.attributes('style')).toContain('animation-duration: 5s');
    });

    it('ariaLabel customizado e refletido', () => {
        const wrapper = mount(MaxBaseSpinner, { props: { ariaLabel: 'Processando' } });
        expect(wrapper.find('.max-base-spinner').attributes('aria-label')).toBe('Processando');
    });

    it('defaults corretos quando nenhuma prop e passada', () => {
        const wrapper = mount(MaxBaseSpinner);
        const circle = wrapper.find('circle');
        expect(circle.attributes('stroke-width')).toBe('2');
        expect(circle.attributes('fill')).toBe('none');
        expect(wrapper.find('svg').attributes('style')).toContain('animation-duration: 2s');
        expect(wrapper.find('.max-base-spinner').attributes('aria-label')).toBe('Carregando');
    });

    it('nao emite classes ou dependencias do PrimeVue', () => {
        const html = require('fs').readFileSync(
            require('path').resolve(__dirname, '../../../src/components/base/MaxBaseSpinner.vue'),
            'utf-8'
        );
        expect(html).not.toContain('primevue');
        expect(html).not.toContain('@primeuix');
        expect(/\.p-[a-z-]/.test(html)).toBe(false);
    });
});
