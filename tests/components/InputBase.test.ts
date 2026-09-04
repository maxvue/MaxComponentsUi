import { mount } from '@vue/test-utils';
import { describe, it, expect } from 'vitest';
import { defineComponent, h } from 'vue';
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

    it('renders a label with a non-empty for attribute when props.label is defined', () => {
        const wrapper = mount(InputBase, {
            props: { label: 'My Label' }
        });
        const label = wrapper.find('label');
        expect(label.exists()).toBe(true);
        expect(label.attributes('for')).toBeTruthy();
    });

    it('generates a different id for each instance within the same app', () => {
        // `useId()` gera ids unicos por app Vue raiz; para provar que duas instancias
        // de InputBase recebem ids diferentes entre si, ambas precisam viver na
        // mesma arvore/app (dois `mount()` separados criam apps distintas e
        // reiniciam o contador, o que nao provaria nada).
        const Wrapper = defineComponent({
            components: { InputBase },
            render: () => [
                h(InputBase, { label: 'Label A', ref: 'a' }),
                h(InputBase, { label: 'Label B', ref: 'b' })
            ]
        });
        const wrapper = mount(Wrapper);
        const labels = wrapper.findAll('label');
        const idA = labels[0].attributes('for');
        const idB = labels[1].attributes('for');
        expect(idA).toBeTruthy();
        expect(idB).toBeTruthy();
        expect(idA).not.toBe(idB);
    });

    it('exposes inputId and messageId as slot props', () => {
        let capturedInputId: string | undefined;
        let capturedMessageId: string | undefined;
        mount(InputBase, {
            props: { label: 'My Label' },
            slots: {
                default: (slotProps: { inputId?: string; messageId?: string }) => {
                    capturedInputId = slotProps.inputId;
                    capturedMessageId = slotProps.messageId;
                    return [];
                }
            }
        });
        expect(capturedInputId).not.toBeUndefined();
        expect(capturedMessageId).not.toBeUndefined();
    });

    it('sets aria-live="polite" on .input-message', () => {
        const wrapper = mount(InputBase, {
            props: { message: 'Hello' }
        });
        expect(wrapper.find('.input-message').attributes('aria-live')).toBe('polite');
    });

    it('sets role="alert" on .input-message when error is truthy, and not otherwise', () => {
        const errorWrapper = mount(InputBase, {
            props: { error: true }
        });
        expect(errorWrapper.find('.input-message').attributes('role')).toBe('alert');

        const noErrorWrapper = mount(InputBase, {
            props: { message: 'Hello' }
        });
        expect(noErrorWrapper.find('.input-message').attributes('role')).not.toBe('alert');
    });

    // O `no-border` nao e uma prop: e um attr que cai no elemento raiz por
    // fallthrough, e o SCSS o consome via `&[no-border]`. O teste garante que o
    // attr chega mesmo no `.max-input-main-div` (onde o seletor o espera), e nao
    // em algum no interno.
    it('forwards the no-border attribute to the root div', () => {
        const wrapper = mount(InputBase, {
            attrs: { 'no-border': '' }
        });
        const root = wrapper.find('.max-input-main-div');
        expect(root.attributes('no-border')).toBe('');
    });

    it('keeps no-border on the root div alongside the error state', () => {
        const wrapper = mount(InputBase, {
            props: { error: true },
            attrs: { 'no-border': '' }
        });
        const root = wrapper.find('.max-input-main-div');
        expect(root.attributes('no-border')).toBe('');
        expect(root.classes()).toContain('error');
    });

    it('sets aria-hidden="true" on the required asterisk when rendered', () => {
        const wrapper = mount(InputBase, {
            props: { required: true }
        });
        expect(wrapper.find('.required').attributes('aria-hidden')).toBe('true');
    });

    it('aplica classe with-icon-right em .input-status-icon quando iconRight está presente', () => {
        const wrapper = mount(InputBase, {
            props: { iconRight: 'mdi:magnify', done: true }
        });
        const statusIcon = wrapper.find('.input-status-icon');
        expect(statusIcon.exists()).toBe(true);
        expect(statusIcon.classes()).toContain('with-icon-right');
    });
});
