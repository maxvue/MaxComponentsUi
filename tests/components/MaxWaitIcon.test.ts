import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import MaxWaitIcon from '../../src/components/MaxWaitIcon.vue';

describe('MaxWaitIcon', () => {
    it('renderiza o container com as classes semânticas', () => {
        const wrapper = mount(MaxWaitIcon);
        expect(wrapper.classes()).toContain('max-wait-icon');
        expect(wrapper.classes()).toContain('icon-done-max');
    });

    it('renderiza SVG com animações vetoriais de ampulheta', () => {
        const wrapper = mount(MaxWaitIcon);
        const svg = wrapper.find('svg');
        expect(svg.exists()).toBe(true);
        expect(svg.attributes('viewBox')).toBe('0 0 24 24');
        expect(svg.attributes('width')).toBe('24');
        expect(svg.attributes('height')).toBe('24');
    });

    it('repassa atributos arbitrários ao nó raiz', () => {
        const wrapper = mount(MaxWaitIcon, {
            attrs: {
                'data-test': 'wait-icon',
                'aria-hidden': 'true'
            }
        });

        expect(wrapper.attributes('data-test')).toBe('wait-icon');
        expect(wrapper.attributes('aria-hidden')).toBe('true');
    });
});
