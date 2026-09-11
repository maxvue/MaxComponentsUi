import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import MaxErrorIcon from '../../src/components/MaxErrorIcon.vue';

describe('MaxErrorIcon', () => {
    it('renderiza o container com as classes semânticas', () => {
        const wrapper = mount(MaxErrorIcon);
        expect(wrapper.classes()).toContain('max-error-icon');
        expect(wrapper.classes()).toContain('icon-error-max');
    });

    it('renderiza elemento SVG com viewBox correto', () => {
        const wrapper = mount(MaxErrorIcon);
        const svg = wrapper.find('svg');
        expect(svg.exists()).toBe(true);
        expect(svg.attributes('viewBox')).toBe('0 0 512 512');
    });

    it('repassa atributos arbitrários ao nó raiz', () => {
        const wrapper = mount(MaxErrorIcon, {
            attrs: {
                'data-test': 'error-icon-test',
                role: 'img',
                'aria-label': 'Erro'
            }
        });

        expect(wrapper.attributes('data-test')).toBe('error-icon-test');
        expect(wrapper.attributes('role')).toBe('img');
        expect(wrapper.attributes('aria-label')).toBe('Erro');
    });
});
