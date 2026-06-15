import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import MaxTextInputFloatLabel from '../../src/components/MaxTextInputFloatLabel.vue';

describe('MaxTextInputFloatLabel.vue', () => {
    it('deve renderizar o componente descontinuado', () => {
        const wrapper = mount(MaxTextInputFloatLabel);
        expect(wrapper.exists()).toBe(true);
        expect(wrapper.html()).toContain('<!-- Componente Descontinuado -->');
    });
});
