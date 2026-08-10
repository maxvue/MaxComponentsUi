import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import MaxInputFile from '../../src/components/MaxInputFile.vue';

describe('MaxInputFile', () => {
    it('deve renderizar o componente corretamente', () => {
        const wrapper = mount(MaxInputFile);
        expect(wrapper.exists()).toBe(true);
    });

    it('não renderiza nenhum conteúdo (template vazio, componente sem lógica)', () => {
        const wrapper = mount(MaxInputFile);
        expect(wrapper.html()).toBe('');
        expect(wrapper.findAll('*').length).toBe(0);
    });
});
