import { describe, it, expect, beforeEach, vi } from 'vitest';
import { config, mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxUserAvatar from '../../src/components/MaxUserAvatar.vue';
import { useConfirmStore } from '../../src/stores/useConfirm.Store';

let pinia: ReturnType<typeof createPinia>;

function mountAvatar(props: Record<string, any> = {}, options: Record<string, any> = {}) {
    return mount(MaxUserAvatar, {
        props,
        ...options
    });
}

describe('MaxUserAvatar', () => {
    beforeEach(() => {
        pinia = createPinia();
        setActivePinia(pinia);
        config.global.plugins = [pinia];
    });

    it('renderiza corretamente sem classes residuais do PrimeVue', () => {
        const wrapper = mountAvatar();
        expect(wrapper.exists()).toBe(true);
        expect(wrapper.classes()).toContain('max-user-avatar');
        expect(wrapper.classes()).not.toContain('p-avatar');
        expect(wrapper.classes()).not.toContain('p-avatar-circle');
    });

    it('exibe imagem quando imageUrl é fornecido', () => {
        const wrapper = mountAvatar({ imageUrl: 'https://example.com/photo.jpg', name: 'João' });
        const img = wrapper.find('img.max-user-avatar__image');
        expect(img.exists()).toBe(true);
        expect(img.attributes('src')).toBe('https://example.com/photo.jpg');
    });

    it('suporta aliases de imagem: image, url, href e ref', () => {
        const w1 = mountAvatar({ image: 'https://example.com/1.jpg' });
        expect(w1.find('img.max-user-avatar__image').attributes('src')).toBe('https://example.com/1.jpg');

        const w2 = mountAvatar({ url: 'https://example.com/2.jpg' });
        expect(w2.find('img.max-user-avatar__image').attributes('src')).toBe('https://example.com/2.jpg');

        const w3 = mountAvatar({ href: 'https://example.com/3.jpg' });
        expect(w3.find('img.max-user-avatar__image').attributes('src')).toBe('https://example.com/3.jpg');

        const Parent = {
            components: { MaxUserAvatar },
            template: '<MaxUserAvatar ref="https://example.com/4.jpg" />'
        };
        const w4 = mount(Parent);
        expect(w4.find('img.max-user-avatar__image').attributes('src')).toBe('https://example.com/4.jpg');
    });

    it('exibe as iniciais quando não há imagem e o name é fornecido', () => {
        const w1 = mountAvatar({ name: 'Maria' });
        const initials1 = w1.find('.max-user-avatar__initials');
        expect(initials1.exists()).toBe(true);
        expect(initials1.text()).toBe('MA');

        const w2 = mountAvatar({ name: 'João Silva' });
        const initials2 = w2.find('.max-user-avatar__initials');
        expect(initials2.text()).toBe('JS');

        const w3 = mountAvatar({ name: 'Carlos Eduardo Santos' });
        const initials3 = w3.find('.max-user-avatar__initials');
        expect(initials3.text()).toBe('CS');
    });

    it('exibe o ícone clarity:avatar-solid quando nem imagem nem name são fornecidos', () => {
        const wrapper = mountAvatar();
        expect(wrapper.find('img.max-user-avatar__image').exists()).toBe(false);
        expect(wrapper.find('.max-user-avatar__initials').exists()).toBe(false);
        const icon = wrapper.findComponent({ name: 'MaxIcon' });
        expect(icon.exists()).toBe(true);
        expect(icon.props('icon')).toBe('clarity:avatar-solid');
    });

    it('exibe fallback apropriado quando ocorre erro no carregamento da imagem', async () => {
        // Com name -> exibe iniciais
        const wrapperWithName = mountAvatar({ imageUrl: 'https://example.com/not-found.jpg', name: 'João Silva' });
        const img1 = wrapperWithName.find('img.max-user-avatar__image');
        expect(img1.exists()).toBe(true);
        await img1.trigger('error');
        expect(wrapperWithName.find('img.max-user-avatar__image').exists()).toBe(false);
        expect(wrapperWithName.find('.max-user-avatar__initials').text()).toBe('JS');

        // Sem name -> exibe ícone
        const wrapperNoName = mountAvatar({ imageUrl: 'https://example.com/not-found.jpg' });
        const img2 = wrapperNoName.find('img.max-user-avatar__image');
        await img2.trigger('error');
        expect(wrapperNoName.find('img.max-user-avatar__image').exists()).toBe(false);
        const icon = wrapperNoName.findComponent({ name: 'MaxIcon' });
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

        expect(tooltipDirective).toHaveBeenCalled();
        const callArgs = tooltipDirective.mock.calls[0];
        expect(callArgs[1].value).toBe(null);

        const _wrapper2 = mount(MaxUserAvatar, {
            props: { name: 'João', showTooltip: true, imageUrl: 'img.jpg' },
            global: {
                directives: { tooltip: tooltipDirective }
            }
        });

        const callArgs2 = tooltipDirective.mock.calls[1];
        expect(callArgs2[1].value).toBe('João');
    });

    it('respeita a prop noClick impedindo ação de clique e confirmação de remoção', async () => {
        const confirmStore = useConfirmStore();
        const wrapper = mountAvatar({ remove: true, noClick: true, name: 'Usuário' });

        expect(wrapper.classes()).toContain('no-click');
        expect(wrapper.classes()).not.toContain('removable');

        await wrapper.trigger('click');
        expect(confirmStore.show).toBe(false);
    });

    it('aciona o fluxo de confirmação de remoção quando remove está ativo e noClick é falso', async () => {
        const confirmStore = useConfirmStore();
        const wrapper = mountAvatar({ remove: true, labelRemove: 'Excluir usuário?' });

        expect(wrapper.classes()).toContain('removable');
        await wrapper.trigger('click');
        expect(confirmStore.show).toBe(true);
        expect(confirmStore.message).toBe('Excluir usuário?');

        confirmStore.acceptProps.action();
        expect(wrapper.emitted('remove')).toBeTruthy();
    });

    it('aplica dimensões com size, width, height, maxWidth e maxHeight mantendo proporção 1:1', () => {
        // Com size string
        const wSize = mountAvatar({ size: '56px' });
        expect(wSize.attributes('style')).toContain('width: 56px');
        expect(wSize.attributes('style')).toContain('height: 56px');

        // Com size número
        const wSizeNum = mountAvatar({ size: 48 });
        expect(wSizeNum.attributes('style')).toContain('width: 48px');
        expect(wSizeNum.attributes('style')).toContain('height: 48px');

        // Com width
        const wWidth = mountAvatar({ width: '32px' });
        expect(wWidth.attributes('style')).toContain('width: 32px');
        expect(wWidth.attributes('style')).toContain('height: 32px');

        // Com height
        const wHeight = mountAvatar({ height: '64px' });
        expect(wHeight.attributes('style')).toContain('width: 64px');
        expect(wHeight.attributes('style')).toContain('height: 64px');

        // Com maxWidth isolado (width e height padrão ficam 100%)
        const wMax = mountAvatar({ maxWidth: '80px' });
        expect(wMax.attributes('style')).toContain('max-width: 80px');
        expect(wMax.attributes('style')).toContain('max-height: 80px');
        expect(wMax.attributes('style')).toContain('width: 100%');
        expect(wMax.attributes('style')).toContain('height: 100%');

        // Com max-height em kebab-case
        const wMaxHeight = mountAvatar({ 'max-height': 50 });
        expect(wMaxHeight.attributes('style')).toContain('max-width: 50px');
        expect(wMaxHeight.attributes('style')).toContain('max-height: 50px');
        expect(wMaxHeight.attributes('style')).toContain('width: 100%');
        expect(wMaxHeight.attributes('style')).toContain('height: 100%');

        // Com size E maxWidth
        const wSizeAndMax = mountAvatar({ size: '40px', maxWidth: '80px' });
        expect(wSizeAndMax.attributes('style')).toContain('max-width: 80px');
        expect(wSizeAndMax.attributes('style')).toContain('max-height: 80px');
        expect(wSizeAndMax.attributes('style')).toContain('width: 40px');
        expect(wSizeAndMax.attributes('style')).toContain('height: 40px');
    });

    it('renderiza o wrapper e ícone de fallback com classes estruturais corretas', () => {
        const wrapper = mountAvatar();
        const iconWrapper = wrapper.find('.max-user-avatar__icon-wrapper');
        expect(iconWrapper.exists()).toBe(true);

        const iconComponent = iconWrapper.findComponent({ name: 'MaxIcon' });
        expect(iconComponent.exists()).toBe(true);
        expect(iconComponent.classes()).toContain('max-user-avatar__icon');
        expect(iconComponent.props('icon')).toBe('clarity:avatar-solid');
        expect(iconComponent.props('size')).toBe('72%');
        expect(iconComponent.props('color')).toBe('#fff');
    });
});
