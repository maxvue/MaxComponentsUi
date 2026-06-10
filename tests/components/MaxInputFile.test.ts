import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import MaxInputFile from '../../src/components/MaxInputFile.vue';

describe('MaxInputFile', () => {
    it('deve renderizar o componente corretamente', () => {
        const wrapper = mount(MaxInputFile);
        expect(wrapper.exists()).toBe(true);
    });
});
