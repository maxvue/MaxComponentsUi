import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import MaxTableColumn from '../../src/components/MaxTableColumn.vue';

vi.mock('@maxvue/max-use', () => ({
    useElementSize: () => ({ width: { value: 100 } })
}));

describe('MaxTableColumn.vue', () => {
    it('deve montar corretamente', () => {
        const wrapper = mount(MaxTableColumn, {
            global: {
                stubs: {
                    Column: true
                }
            }
        });
        expect(wrapper.exists()).toBe(true);
    });
});
