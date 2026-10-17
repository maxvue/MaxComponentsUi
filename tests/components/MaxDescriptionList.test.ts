import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import MaxDescriptionList from '../../src/components/MaxDescriptionList.vue';

describe('MaxDescriptionList', () => {
    it('preserva zero e false, e apresenta vazios', () => {
        const wrapper = mount(MaxDescriptionList, { props: { items: [{ id: 'a', label: 'Zero', value: 0 }, { id: 'b', label: 'Ativo', value: false }, { id: 'c', label: 'Vazio', value: null }] } });
        expect(wrapper.text()).toContain('0');
        expect(wrapper.text()).toContain('Não');
        expect(wrapper.text()).toContain('—');
    });
});
