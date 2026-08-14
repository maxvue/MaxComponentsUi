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
        const wrapper = mountAvatar({ name: 'João' });
        expect(wrapper.exists()).toBe(true);
    });

    it('exibe imagem quando imageUrl é fornecido', () => {
        const wrapper = mountAvatar({ imageUrl: 'https://example.com/photo.jpg', name: 'João' });
        const img = wrapper.find('img.max-user-avatar__image');
        expect(img.exists()).toBe(true);
        expect(img.attributes('src')).toBe('https://example.com/photo.jpg');
    });

    it('exibe iniciais quando imageUrl não é fornecido', () => {
        const wrapper = mountAvatar({ name: 'Maria' });
        const initials = wrapper.find('.max-user-avatar__initials');
        expect(initials.exists()).toBe(true);
        expect(initials.text()).toBe('MA');
    });

    it('gera iniciais com 2 caracteres maiúsculos', () => {
        const wrapper = mountAvatar({ name: 'joão silva' });
        const initials = wrapper.find('.max-user-avatar__initials');
        expect(initials.text()).toBe('JO');
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
