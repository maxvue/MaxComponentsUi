import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import MaxLoaderIcon from '../../src/components/MaxLoaderIcon.vue';

describe('MaxLoaderIcon', () => {
    it('renderiza o elemento raiz com a classe semântica max-loader-icon-div', () => {
        const wrapper = mount(MaxLoaderIcon);
        expect(wrapper.classes()).toContain('max-loader-icon-div');
    });

    it('renderiza o SVG interno com definições de gradiente e caminhos', () => {
        const wrapper = mount(MaxLoaderIcon);
        const svg = wrapper.find('svg');
        expect(svg.exists()).toBe(true);
        expect(svg.attributes('viewBox')).toBe('0 0 24 24');
        expect(svg.findAll('linearGradient')).toHaveLength(2);
    });

    it('repassa atributos e estilos inline ao elemento raiz', () => {
        const wrapper = mount(MaxLoaderIcon, {
            attrs: {
                'data-testid': 'custom-loader-icon',
                style: 'width: 40px; height: 40px;'
            }
        });

        expect(wrapper.attributes('data-testid')).toBe('custom-loader-icon');
        expect(wrapper.attributes('style')).toContain('width: 40px');
        expect(wrapper.attributes('style')).toContain('height: 40px');
    });
});
