import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import MaxDoneIcon from '../../src/components/MaxDoneIcon.vue';

describe('MaxDoneIcon', () => {
    it('renderiza o container com as classes corretas', () => {
        const wrapper = mount(MaxDoneIcon);
        expect(wrapper.classes()).toContain('icon-done-max');
        expect(wrapper.classes()).toContain('max-done-icon');
    });

    it('renderiza o elemento SVG de check', () => {
        const wrapper = mount(MaxDoneIcon);
        const svg = wrapper.find('svg');
        expect(svg.exists()).toBe(true);
        expect(svg.attributes('viewBox')).toBe('0 0 24 24');
        expect(svg.attributes('width')).toBe('24');
        expect(svg.attributes('height')).toBe('24');
    });

    it('repassa atributos adicionais ao elemento raiz', () => {
        const wrapper = mount(MaxDoneIcon, {
            attrs: {
                'data-testid': 'done-status-icon',
                'aria-label': 'Sucesso'
            }
        });

        expect(wrapper.attributes('data-testid')).toBe('done-status-icon');
        expect(wrapper.attributes('aria-label')).toBe('Sucesso');
    });
});
