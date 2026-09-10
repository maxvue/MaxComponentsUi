import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import MaxTitle2 from '../../src/components/MaxTitle2.vue';

function mountTitle2(props: Record<string, any> = {}, extraGlobal: Record<string, any> = {}) {
    return mount(MaxTitle2, {
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

describe('MaxTitle2', () => {
    it('renderiza título e subtítulo com classes semânticas e sem select-none na raiz', () => {
        const wrapper = mountTitle2({
            title: 'Título 2',
            subtitle: 'Subtítulo 2'
        });

        expect(wrapper.exists()).toBe(true);
        const rootEl = wrapper.find('.max-title-2');
        expect(rootEl.exists()).toBe(true);
        // Garante que a classe utilitária select-none foi removida do template
        expect(rootEl.classes()).not.toContain('select-none');

        const titleEl = wrapper.find('.text-h1');
        expect(titleEl.exists()).toBe(true);
        expect(titleEl.text()).toBe('Título 2');

        const subtitleEl = wrapper.find('.text-h2');
        expect(subtitleEl.exists()).toBe(true);
        expect(subtitleEl.text()).toBe('Subtítulo 2');
    });

    it('renderiza ícone com classe semântica title-icon sem mb-2', () => {
        const wrapper = mountTitle2({
            title: 'Título',
            icon: 'mdi:star'
        });

        const iconEl = wrapper.find('.title-icon');
        expect(iconEl.exists()).toBe(true);
        expect(iconEl.classes()).not.toContain('mb-2');
    });

    it('suporta h1 e h2 como aliases de title e subtitle', () => {
        const wrapper = mountTitle2({
            h1: 'Header 1',
            h2: 'Header 2'
        });

        expect(wrapper.find('.text-h1').text()).toBe('Header 1');
        expect(wrapper.find('.text-h2').text()).toBe('Header 2');
    });
});
