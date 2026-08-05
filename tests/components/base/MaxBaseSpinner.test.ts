import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import MaxBaseSpinner from '../../../src/components/base/MaxBaseSpinner.vue';

describe('MaxBaseSpinner', () => {
    it('renderiza um <svg> com o viewBox do padrão Material', () => {
        const wrapper = mount(MaxBaseSpinner);
        const svg = wrapper.find('svg');

        expect(svg.exists()).toBe(true);
        expect(svg.attributes('viewBox')).toBe('25 25 50 50');
    });

    it('o círculo usa cx/cy/r do padrão (traço fecha a volta)', () => {
        const wrapper = mount(MaxBaseSpinner);
        const circle = wrapper.find('circle');

        expect(circle.attributes('cx')).toBe('50');
        expect(circle.attributes('cy')).toBe('50');
        expect(circle.attributes('r')).toBe('20');
        expect(circle.attributes('stroke-miterlimit')).toBe('10');
    });

    it('expõe role=progressbar e aria-busy=true', () => {
        const wrapper = mount(MaxBaseSpinner);

        expect(wrapper.attributes('role')).toBe('progressbar');
        expect(wrapper.attributes('aria-busy')).toBe('true');
    });

    it('aplica as classes p-progressspinner e p-progressspinner-spin', () => {
        const wrapper = mount(MaxBaseSpinner);

        expect(wrapper.classes()).toContain('p-progressspinner');
        expect(wrapper.find('svg').classes()).toContain('p-progressspinner-spin');
        expect(wrapper.find('circle').classes()).toContain('p-progressspinner-circle');
    });

    it('strokeWidth padrão é 2 e o customizado chega ao <circle>', () => {
        expect(mount(MaxBaseSpinner).find('circle').attributes('stroke-width')).toBe('2');

        const wrapper = mount(MaxBaseSpinner, { props: { strokeWidth: '7' } });
        expect(wrapper.find('circle').attributes('stroke-width')).toBe('7');
    });

    it('fill padrão é none e o customizado é aplicado', () => {
        expect(mount(MaxBaseSpinner).find('circle').attributes('fill')).toBe('none');

        const wrapper = mount(MaxBaseSpinner, { props: { fill: 'red' } });
        expect(wrapper.find('circle').attributes('fill')).toBe('red');
    });

    it('animationDuration vira style inline no <svg> e no <circle>', () => {
        const wrapper = mount(MaxBaseSpinner, { props: { animationDuration: '.5s' } });

        // precisa chegar aos dois: o svg gira, o circle desenha o traço
        expect((wrapper.find('svg').element as SVGElement).style.animationDuration).toBe('.5s');
        expect((wrapper.find('circle').element as SVGElement).style.animationDuration).toBe('.5s');
    });

    it('animationDuration padrão é 2s', () => {
        const wrapper = mount(MaxBaseSpinner);
        expect((wrapper.find('svg').element as SVGElement).style.animationDuration).toBe('2s');
    });

    it('ariaLabel tem default e aceita customização', () => {
        expect(mount(MaxBaseSpinner).attributes('aria-label')).toBe('Carregando');

        const wrapper = mount(MaxBaseSpinner, { props: { ariaLabel: 'Enviando arquivo' } });
        expect(wrapper.attributes('aria-label')).toBe('Enviando arquivo');
    });

    it('aria-label passado como ATRIBUTO sobrescreve o default', () => {
        // é assim que MaxPdfView.vue usa hoje: aria-label, não a prop ariaLabel
        const wrapper = mount(MaxBaseSpinner, { attrs: { 'aria-label': 'Custom ProgressSpinner' } });
        expect(wrapper.attributes('aria-label')).toBe('Custom ProgressSpinner');
    });

    it('style vindo como atributo chega à raiz (dimensionamento dos consumidores)', () => {
        // MaxPdfView e MaxInputFileUpload dimensionam o spinner por style inline
        const wrapper = mount(MaxBaseSpinner, { attrs: { style: 'width: 50px; height: 50px;' } });

        expect((wrapper.element as HTMLElement).style.width).toBe('50px');
        expect((wrapper.element as HTMLElement).style.height).toBe('50px');
    });

    it('não emite marcação de componente PrimeVue', () => {
        const wrapper = mount(MaxBaseSpinner);
        expect(wrapper.html()).not.toContain('p-component');
    });
});
