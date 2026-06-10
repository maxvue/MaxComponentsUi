import { mount } from '@vue/test-utils';
import { describe, it, expect } from 'vitest';
import InputBase from '../../src/components/InputBase.vue';
import FloatLabel from 'primevue/floatlabel';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import Message from 'primevue/message';

describe('InputBase.vue', () => {
    const globalOptions = {
        components: { FloatLabel, IconField, InputIcon, Message }
    };

    it('renders with label and inline true', () => {
        const wrapper = mount(InputBase, {
            props: { label: 'My Label', inLine: true },
            global: globalOptions
        });
        expect(wrapper.find('.in-line-label').exists()).toBe(true);
        expect(wrapper.find('.in-line-label').text()).toBe('My Label');
        expect(wrapper.find('.max-input-label').exists()).toBe(false);
    });

    it('renders iconRight and tests caution string', () => {
        const wrapper = mount(InputBase, {
            props: { iconRight: 'mdi:right', caution: 'Caution message' },
            global: globalOptions
        });
        // Line 12
        expect(wrapper.html()).toContain('icon="mdi:right"');
        // Line 133
        expect(wrapper.find('.input-message').text()).toContain('Caution message');
    });

    it('renders message with iconMessage', () => {
        const wrapper = mount(InputBase, {
            props: { message: 'Main message', iconMessage: 'mdi:info' },
            global: globalOptions
        });
        // Line 135
        expect(wrapper.find('.input-message').text()).toContain('Main message');
        // Line 19
        expect(wrapper.html()).toContain('icon="mdi:info"');
    });
});
