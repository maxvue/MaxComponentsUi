import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxUserAvatar from '../../src/components/MaxUserAvatar.vue';

function mountAvatar(props: Record<string, any> = {}) {
    return mount(MaxUserAvatar, {
        props,
        global: {
            stubs: {
                Avatar: {
                    template: '<div class="p-avatar" :data-label="label" :data-image="image"><slot /></div>',
                    props: ['image', 'label', 'shape']
                }
            }
        }
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
        const avatar = wrapper.find('.p-avatar');
        expect(avatar.attributes('data-image')).toBe('https://example.com/photo.jpg');
    });

    it('exibe iniciais quando imageUrl não é fornecido', () => {
        const wrapper = mountAvatar({ name: 'Maria' });
        const avatar = wrapper.find('.p-avatar');
        expect(avatar.attributes('data-label')).toBe('MA');
    });

    it('gera iniciais com 2 caracteres maiúsculos', () => {
        const wrapper = mountAvatar({ name: 'joão silva' });
        const avatar = wrapper.find('.p-avatar');
        expect(avatar.attributes('data-label')).toBe('JO');
    });

    it('aplica v-tooltip condicionalmente dependendo do showTooltip', () => {
        const tooltipDirective = vi.fn();
        const _wrapper = mount(MaxUserAvatar, {
            props: { name: 'João', showTooltip: false },
            global: {
                stubs: { Avatar: true },
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
                stubs: { Avatar: true },
                directives: { tooltip: tooltipDirective }
            }
        });

        // Quando showTooltip é true e tem name, recebe name
        const callArgs2 = tooltipDirective.mock.calls[1];
        expect(callArgs2[1].value).toBe('João');
    });
});
