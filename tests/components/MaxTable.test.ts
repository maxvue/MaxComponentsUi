import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxTable from '../../src/components/MaxTable.vue';
import { ref } from 'vue';

const mockWidth = ref(0);
vi.mock('@maxvue/max-use', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@maxvue/max-use')>();
    return {
        ...actual,
        useElementSize: vi.fn(() => ({ width: mockWidth, height: ref(0) }))
    };
});

function mountTable(props: Record<string, any> = {}, attrs: Record<string, any> = {}) {
    return mount(MaxTable, {
        props,
        attrs: { value: [], ...attrs }
    });
}

describe('MaxTable', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('renderiza corretamente sem PrimeVue', () => {
        const wrapper = mountTable();
        expect(wrapper.find('.max-table-main-div').exists()).toBe(true);
        expect(wrapper.find('.p-datatable').exists()).toBe(true);
        expect(wrapper.html()).not.toContain('data-pc-name');
    });

    it('expõe width via defineExpose', () => {
        const wrapper = mountTable();
        expect((wrapper.vm as any).width).toBeDefined();
    });

    it('aceita slots personalizados', () => {
        const wrapper = mount(MaxTable, {
            attrs: { value: [{ id: 1 }] },
            slots: {
                default: '<td class="custom-slot">Custom</td>'
            }
        });
        expect(wrapper.find('.custom-slot').exists()).toBe(true);
    });

    it('renderiza o slot "buttons" e calcula o width', async () => {
        const wrapper = mount(MaxTable, {
            attrs: { value: [{ id: 1 }] },
            slots: {
                buttons: '<button class="action-btn">Action</button>'
            }
        });

        expect(wrapper.find('.max-table-buttons').exists()).toBe(true);
        expect(wrapper.find('.action-btn').exists()).toBe(true);

        const vm = wrapper.vm as any;

        mockWidth.value = 50;
        await wrapper.vm.$nextTick();

        expect(vm.width).toBe(60);

        mockWidth.value = 100;
        await wrapper.vm.$nextTick();
        expect(vm.width).toBe(60);
    });
});
