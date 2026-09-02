import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import MaxLogo from '../../src/components/MaxLogo.vue';

function mountLogo(props: Record<string, any> = {}) {
    return mount(MaxLogo, {
        props,
        global: {
            stubs: {
                RouterLink: {
                    template: '<a class="router-link"><slot /></a>',
                    props: ['to']
                }
            }
        }
    });
}

describe('MaxLogo', () => {
    it('renderiza corretamente', () => {
        const wrapper = mountLogo();
        expect(wrapper.find('.logo').exists()).toBe(true);
    });

    it('não renderiza <img> quando src não é informado (evita 404 por padrão)', () => {
        const wrapper = mountLogo();
        const img = wrapper.find('img');
        expect(img.exists()).toBe(false);
    });

    it('aceita src customizado', () => {
        const wrapper = mountLogo({ src: '/assets/logo-custom.png' });
        const img = wrapper.find('img');
        expect(img.exists()).toBe(true);
        expect(img.attributes('src')).toBe('/assets/logo-custom.png');
    });

    it('envolve a imagem com RouterLink para "/"', () => {
        const wrapper = mountLogo();
        const link = wrapper.find('.router-link');
        expect(link.exists()).toBe(true);
    });

    it('aplica atributo rounded quando prop rounded=true', () => {
        const wrapper = mountLogo({ rounded: true });
        expect(wrapper.find('.logo').attributes('rounded')).toBeDefined();
    });

    it('não aplica atributo rounded por padrão', () => {
        const wrapper = mountLogo();
        expect(wrapper.find('.logo').attributes('rounded')).toBeUndefined();
    });

    it('aplica atributo no-padding quando prop noPadding=true', () => {
        const wrapper = mountLogo({ noPadding: true });
        expect(wrapper.find('.logo').attributes('no-padding')).toBeDefined();
    });

    it('não aplica atributo no-padding por padrão', () => {
        const wrapper = mountLogo();
        expect(wrapper.find('.logo').attributes('no-padding')).toBeUndefined();
    });
});

