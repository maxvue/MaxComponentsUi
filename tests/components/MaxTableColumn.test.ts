import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import MaxTableColumn from '../../src/components/MaxTableColumn.vue';

describe('MaxTableColumn.vue', () => {
    it('deve montar corretamente sem PrimeVue', () => {
        const wrapper = mount(MaxTableColumn, {
            props: { header: 'Nome', field: 'name' }
        });
        expect(wrapper.exists()).toBe(true);
        expect(wrapper.html()).not.toContain('data-pc-name');
    });
});
