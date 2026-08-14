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
        mockWidth.value = 0;
    });

    it('renderiza corretamente', () => {
        const wrapper = mountTable();
        expect(wrapper.find('.max-table-main-div').exists()).toBe(true);
    });

    it('renderiza container de tabela internamente', () => {
        const wrapper = mountTable();
        expect(wrapper.find('.p-datatable').exists()).toBe(true);
    });

    it('expõe width via defineExpose', () => {
        const wrapper = mountTable();
        expect((wrapper.vm as any).width).toBeDefined();
    });

    it('aceita slots personalizados', () => {
        const wrapper = mount(MaxTable, {
            attrs: { value: [] },
            slots: {
                default: '<div class="custom-slot">Custom</div>'
            }
        });
        expect(wrapper.find('.custom-slot').exists()).toBe(true);
    });

    it('renderiza o slot "buttons" e calcula o width', async () => {
        const wrapper = mount(MaxTable, {
            attrs: { value: [] },
            slots: {
                buttons: '<button class="action-btn">Action</button>'
            }
        });

        expect(wrapper.find('.p-column').exists()).toBe(true);
        expect(wrapper.find('.max-table-buttons').exists()).toBe(true);
        expect(wrapper.find('.action-btn').exists()).toBe(true);

        const vm = wrapper.vm as any;

        mockWidth.value = 50;
        await wrapper.vm.$nextTick();

        expect(vm.width).toBe(60); // calculated_width.value + 10

        // Atualizar novamente não deve mudar se width.value > 1
        mockWidth.value = 100;
        await wrapper.vm.$nextTick();
        expect(vm.width).toBe(60);
    });

    it('renderiza a coluna de botões apenas uma única vez mesmo com múltiplos slots declarados (header, footer, buttons)', () => {
        const wrapper = mount(MaxTable, {
            attrs: { value: [] },
            slots: {
                header: '<div class="header-slot">Header</div>',
                footer: '<div class="footer-slot">Footer</div>',
                buttons: '<button class="action-btn">Action</button>'
            }
        });

        const columns = wrapper.findAll('.p-column');
        expect(columns.length).toBe(1);
    });
});
