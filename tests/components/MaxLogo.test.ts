import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import MaxLogo from '../../src/components/MaxLogo.vue';

function mountLogo(props: Record<string, any> = {}) {
    return mount(MaxLogo, {
        props,
        global: {
            stubs: {
                RouterLink: {
                    name: 'RouterLink',
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

    it('envolve a imagem com RouterLink para "/" por padrão', () => {
        const wrapper = mountLogo();
        const link = wrapper.findComponent({ name: 'RouterLink' });
        expect(link.exists()).toBe(true);
        expect(link.props('to')).toBe('/');
    });

    it('aceita destino to customizado', () => {
        const wrapper = mountLogo({ to: '/dashboard' });
        const link = wrapper.findComponent({ name: 'RouterLink' });
        expect(link.exists()).toBe(true);
        expect(link.props('to')).toBe('/dashboard');
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

    it('suporta alt customizado e exibe fallback acessível ao ocorrer erro no carregamento da imagem', async () => {
        const wrapper = mountLogo({
            src: '/media/engeapp-symbol-9fdaa226.svg',
            alt: 'Símbolo ENGEAPP',
            fallbackLabel: 'MaxCode'
        });

        const img = wrapper.find('img');
        expect(img.exists()).toBe(true);
        expect(img.attributes('alt')).toBe('Símbolo ENGEAPP');

        // Dispara evento de erro na imagem
        await img.trigger('error');

        // Imagem quebrada removida, fallback visível exibido
        expect(wrapper.find('img').exists()).toBe(false);
        const fallback = wrapper.find('.max-logo-fallback');
        expect(fallback.exists()).toBe(true);
        expect(fallback.text()).toBe('MaxCode');
        expect(fallback.attributes('role')).toBe('img');
        expect(fallback.attributes('aria-label')).toBe('Símbolo ENGEAPP');

        // Link continua presente
        const link = wrapper.findComponent({ name: 'RouterLink' });
        expect(link.exists()).toBe(true);

        // Ao alterar a src, tenta carregar novamente a nova imagem
        await wrapper.setProps({ src: '/media/nova-logo.svg' });
        expect(wrapper.find('img').exists()).toBe(true);
        expect(wrapper.find('.max-logo-fallback').exists()).toBe(false);
    });
});

