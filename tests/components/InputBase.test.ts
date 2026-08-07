import { mount } from '@vue/test-utils';
import { describe, it, expect } from 'vitest';
import InputBase from '../../src/components/InputBase.vue';
import MaxIcon from '../../src/components/MaxIcon.vue';

const hasIcon = (wrapper: ReturnType<typeof mount>, icon: string) =>
    wrapper.findAllComponents(MaxIcon).some((c) => c.props('icon') === icon);

describe('InputBase.vue', () => {
    it('renders with label and inline true', () => {
        const wrapper = mount(InputBase, {
            props: { label: 'My Label', inLine: true }
        });
        expect(wrapper.find('.in-line-label').exists()).toBe(true);
        expect(wrapper.find('.in-line-label').text()).toBe('My Label');
        expect(wrapper.find('.max-input-label').exists()).toBe(false);
    });

    it('renders iconRight and tests caution string', () => {
        const wrapper = mount(InputBase, {
            props: { iconRight: 'mdi:right', caution: 'Caution message' }
        });
        // Line 12
        expect(hasIcon(wrapper, 'mdi:right')).toBe(true);
        // Line 133
        expect(wrapper.find('.input-message').text()).toContain('Caution message');
    });

    it('renders message with iconMessage', () => {
        const wrapper = mount(InputBase, {
            props: { message: 'Main message', iconMessage: 'mdi:info' }
        });
        // Line 135
        expect(wrapper.find('.input-message').text()).toContain('Main message');
        // Line 19
        expect(hasIcon(wrapper, 'mdi:info')).toBe(true);
    });

    it('marks root as error when error is boolean true', () => {
        const wrapper = mount(InputBase, {
            props: { error: true }
        });
        expect(wrapper.find('.max-input-main-div').classes()).toContain('error');
        expect(hasIcon(wrapper, 'humbleicons:exclamation')).toBe(true);
    });

    it('treats done === false as an error state', () => {
        const wrapper = mount(InputBase, {
            props: { done: false }
        });
        expect(wrapper.find('.max-input-main-div').classes()).toContain('error');
    });

    it('hides all status icons and required when noStatus is set', () => {
        const wrapper = mount(InputBase, {
            props: { error: true, caution: 'c', required: true, noStatus: true }
        });
        const root = wrapper.find('.max-input-main-div');
        expect(root.classes()).not.toContain('error');
        expect(root.classes()).not.toContain('caution');
        expect(wrapper.find('.is-error').exists()).toBe(false);
        expect(wrapper.find('.is-caution').exists()).toBe(false);
        expect(wrapper.find('.required').exists()).toBe(false);
    });

    it('renders required asterisk when required and no status flag', () => {
        const wrapper = mount(InputBase, {
            props: { required: true }
        });
        expect(wrapper.find('.required').exists()).toBe(true);
        expect(wrapper.find('.required').text()).toBe('*');
    });

    // A linha de mensagem e sempre renderizada (reservando o espaco), ficando
    // vazia quando nao ha mensagem. O antigo `.message-spacer` deixou de existir
    // na migracao que removeu FloatLabel/IconField do PrimeVue.
    it('keeps an empty message line when there is no message', () => {
        const wrapper = mount(InputBase, {
            props: { label: 'Only label' }
        });
        expect(wrapper.find('.input-message').exists()).toBe(true);
        expect(wrapper.find('.input-message .message-text').text()).toBe('');
    });

    it('renders both left and right icons with the slot between them', () => {
        const wrapper = mount(InputBase, {
            props: { iconLeft: 'mdi:left', iconRight: 'mdi:right' },
            slots: { default: '<input class="slotted-input" />' }
        });
        expect(hasIcon(wrapper, 'mdi:left')).toBe(true);
        expect(hasIcon(wrapper, 'mdi:right')).toBe(true);
        expect(wrapper.findAllComponents(MaxIcon).length).toBe(2);
        expect(wrapper.find('.max-input-field-div .input-slot-div .slotted-input').exists()).toBe(true);
    });

    it('renders no input icon when noIcon is set even with icon defined', () => {
        const wrapper = mount(InputBase, {
            props: { icon: 'mdi:user', noIcon: true }
        });
        expect(wrapper.find('.max-inputicon').exists()).toBe(false);
    });
});
