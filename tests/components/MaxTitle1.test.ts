import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import MaxTitle1 from '../../src/components/MaxTitle1.vue';

function mountTitle1(props: Record<string, any> = {}, extraGlobal: Record<string, any> = {}) {
    return mount(MaxTitle1, {
        props,
        global: {
            stubs: {
                MaxIcon: {
                    template: '<div class="max-icon" :class="$attrs.class"></div>'
                }
            },
            ...extraGlobal
        }
    });
}

describe('MaxTitle1', () => {
    it('renderiza título e subtítulo corretamente com classes semânticas', () => {
        const wrapper = mountTitle1({
            title: 'Título Principal',
            subtitle: 'Subtítulo Explicativo'
        });

        expect(wrapper.exists()).toBe(true);
        const titleEl = wrapper.find('.t1-main-text');
        expect(titleEl.exists()).toBe(true);
        expect(titleEl.text()).toBe('Título Principal');
        // Não deve possuir classes utilitárias inline
        expect(titleEl.classes()).not.toContain('text-lg');
        expect(titleEl.classes()).not.toContain('font-medium');
        expect(titleEl.classes()).not.toContain('uppercase');

        const subtitleEl = wrapper.find('.t2-main-text');
        expect(subtitleEl.exists()).toBe(true);
        expect(subtitleEl.text()).toBe('Subtítulo Explicativo');
        expect(subtitleEl.classes()).not.toContain('text-sm');
    });

    it('renderiza ícone com a classe semântica title-icon sem classe mb-2', () => {
        const wrapper = mountTitle1({
            title: 'Título',
            icon: 'mdi:home'
        });

        const iconEl = wrapper.find('.title-icon');
        expect(iconEl.exists()).toBe(true);
        expect(iconEl.classes()).not.toContain('mb-2');
    });

    it('aplica classe center quando prop center=true', () => {
        const wrapper = mountTitle1({
            title: 'Título Centralizado',
            center: true
        });

        expect(wrapper.find('.max-title-1').classes()).toContain('center');
    });

    it('suporta h1 e h2 como aliases de title e subtitle', () => {
        const wrapper = mountTitle1({
            h1: 'Alias Título',
            h2: 'Alias Subtítulo'
        });

        expect(wrapper.find('.t1-main-text').text()).toBe('Alias Título');
        expect(wrapper.find('.t2-main-text').text()).toBe('Alias Subtítulo');
    });
});
