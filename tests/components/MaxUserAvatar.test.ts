import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxUserAvatar from '../../src/components/MaxUserAvatar.vue';

function mountAvatar(props: Record<string, any> = {}, options: Record<string, any> = {}) {
    return mount(MaxUserAvatar, {
        props,
        ...options
    });
}

describe('MaxUserAvatar', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('renderiza corretamente', () => {
        const wrapper = mountAvatar({ name: 'João' });
        expect(wrapper.exists()).toBe(true);
        expect(wrapper.find('.p-avatar').exists()).toBe(true);
        expect(wrapper.find('.p-avatar').classes()).toContain('p-component');
        expect(wrapper.find('.p-avatar').classes()).toContain('p-avatar-circle');
    });

    it('exibe imagem quando imageUrl é fornecido', () => {
        const wrapper = mountAvatar({ imageUrl: 'https://example.com/photo.jpg', name: 'João' });
        const img = wrapper.find('img');
        expect(img.exists()).toBe(true);
        expect(img.attributes('src')).toBe('https://example.com/photo.jpg');
        expect(wrapper.find('.p-avatar').classes()).toContain('p-avatar-image');
    });

    it('exibe iniciais quando imageUrl não é fornecido', () => {
        const wrapper = mountAvatar({ name: 'Maria' });
        const avatar = wrapper.find('.p-avatar');
        expect(avatar.text()).toBe('MA');
        expect(avatar.classes()).toContain('max-user-avatar-initials');
    });

    it('gera iniciais com 2 caracteres maiúsculos', () => {
        const wrapper = mountAvatar({ name: 'joão silva' });
        expect(wrapper.find('.p-avatar-text').text()).toBe('JO');
    });

    it('exibe apenas a primeira letra com initialsLength=1', () => {
        const wrapper = mountAvatar({ name: 'Maria Silva', initialsLength: 1 });
        expect(wrapper.find('.p-avatar-text').text()).toBe('M');
    });

    it('ignora espaço à esquerda em vez de renderizar avatar em branco', () => {
        const wrapper = mountAvatar({ name: '  maria', initialsLength: 1 });
        expect(wrapper.find('.p-avatar-text').text()).toBe('M');
    });

    it('não quebra quando o nome ainda não chegou', () => {
        const wrapper = mountAvatar({ initialsLength: 1 });
        expect(wrapper.find('.p-avatar-text').text()).toBe('');
    });

    it('aciona fallback para iniciais quando ocorre erro ao carregar imagem', async () => {
        const wrapper = mountAvatar({ imageUrl: 'https://example.com/broken.jpg', name: 'Pedro' });
        const img = wrapper.find('img');
        expect(img.exists()).toBe(true);

        await img.trigger('error');
        expect(wrapper.emitted('error')).toBeTruthy();
        expect(wrapper.find('img').exists()).toBe(false);
        expect(wrapper.find('.p-avatar-text').text()).toBe('PE');
    });

    it('expõe a classe de gancho e atributos ARIA no fallback de iniciais', () => {
        const wrapper = mountAvatar({ name: 'Maria' });
        const avatar = wrapper.find('.max-user-avatar-initials');
        expect(avatar.exists()).toBe(true);
        expect(avatar.attributes('role')).toBe('img');
        expect(avatar.attributes('aria-label')).toBe('Maria');
    });

    it('aplica v-tooltip condicionalmente dependendo do showTooltip', () => {
        const tooltipDirective = vi.fn();
        mountAvatar({ name: 'João', showTooltip: false }, {
            global: {
                directives: { tooltip: tooltipDirective }
            }
        });

        expect(tooltipDirective).toHaveBeenCalled();
        const callArgs = tooltipDirective.mock.calls[0];
        expect(callArgs[1].value).toBe(null);

        mountAvatar({ name: 'João', showTooltip: true, imageUrl: 'img.jpg' }, {
            global: {
                directives: { tooltip: tooltipDirective }
            }
        });

        const callArgs2 = tooltipDirective.mock.calls[1];
        expect(callArgs2[1].value).toBe('João');
    });

    it('não emite marcações do PrimeVue', () => {
        const wrapper = mountAvatar({ name: 'Limpo' });
        expect(wrapper.html()).not.toContain('data-pc-name');
    });
});
