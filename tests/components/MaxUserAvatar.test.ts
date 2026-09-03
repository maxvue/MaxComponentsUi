import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxUserAvatar from '../../src/components/MaxUserAvatar.vue';

function mountAvatar(props: Record<string, any> = {}) {
    return mount(MaxUserAvatar, {
        props
    });
}

describe('MaxUserAvatar', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('renderiza corretamente', () => {
        const wrapper = mountAvatar();
        expect(wrapper.exists()).toBe(true);
        expect(wrapper.classes()).toContain('max-user-avatar');
        expect(wrapper.classes()).toContain('p-avatar-circle');
    });

    it('exibe imagem quando imageUrl é fornecido', () => {
        const wrapper = mountAvatar({ imageUrl: 'https://example.com/photo.jpg', name: 'João' });
        const img = wrapper.find('img.max-user-avatar__image');
        expect(img.exists()).toBe(true);
        expect(img.attributes('src')).toBe('https://example.com/photo.jpg');
    });

    it('exibe o ícone clarity:avatar-solid quando imageUrl não é fornecido', () => {
        const wrapper = mountAvatar({ name: 'Maria' });
        expect(wrapper.find('img.max-user-avatar__image').exists()).toBe(false);
        const icon = wrapper.findComponent({ name: 'MaxIcon' });
        expect(icon.exists()).toBe(true);
        expect(icon.props('icon')).toBe('clarity:avatar-solid');
    });

    it('exibe o ícone clarity:avatar-solid quando ocorre erro no carregamento da imagem', async () => {
        const wrapper = mountAvatar({ imageUrl: 'https://example.com/not-found.jpg', name: 'João' });
        const img = wrapper.find('img.max-user-avatar__image');
        expect(img.exists()).toBe(true);

        await img.trigger('error');

        expect(wrapper.find('img.max-user-avatar__image').exists()).toBe(false);
        const icon = wrapper.findComponent({ name: 'MaxIcon' });
        expect(icon.exists()).toBe(true);
        expect(icon.props('icon')).toBe('clarity:avatar-solid');
    });

    it('aplica v-tooltip condicionalmente dependendo do showTooltip', () => {
        const tooltipDirective = vi.fn();
        const _wrapper = mount(MaxUserAvatar, {
            props: { name: 'João', showTooltip: false },
            global: {
                directives: { tooltip: tooltipDirective }
            }
        });

        // Quando showTooltip é false, tooltip recebe null
        expect(tooltipDirective).toHaveBeenCalled();
        const callArgs = tooltipDirective.mock.calls[0];
        expect(callArgs[1].value).toBe(null);

        const _wrapper2 = mount(MaxUserAvatar, {
            props: { name: 'João', showTooltip: true, imageUrl: 'img.jpg' },
            global: {
                directives: { tooltip: tooltipDirective }
            }
        });

        // Quando showTooltip é true e tem name, recebe name
        const callArgs2 = tooltipDirective.mock.calls[1];
        expect(callArgs2[1].value).toBe('João');
    });
});
