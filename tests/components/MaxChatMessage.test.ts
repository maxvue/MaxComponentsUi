import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import MaxChatMessage from '../../src/components/MaxChatMessage.vue';

describe('MaxChatMessage', () => {
    it('renderiza texto hostil literalmente', () => {
        const wrapper = mount(MaxChatMessage, { props: { id: 'm1', author: 'Atendente', text: '<img src=x onerror=alert(1)>' } });
        expect(wrapper.find('img').exists()).toBe(false);
        expect(wrapper.text()).toContain('<img src=x onerror=alert(1)>');
    });
});
