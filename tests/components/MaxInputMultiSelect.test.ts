import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxInputMultiSelect from '../../src/components/MaxInputMultiSelect.vue';

const sampleOptions = [
    { label: 'Opção 1', value: '1' },
    { label: 'Opção 2', value: '2' },
    { label: 'Opção 3', value: '3' }
];

function mountMultiSelect(props: Record<string, any> = {}) {
    return mount(MaxInputMultiSelect, {
        props: {
            options: sampleOptions,
            modelValue: [],
            ...props
        }
    });
}

describe('MaxInputMultiSelect', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('renderiza o componente e exibe placeholder quando vazio', () => {
        const wrapper = mountMultiSelect({ placeholder: 'Escolha itens' });
        expect(wrapper.exists()).toBe(true);
        expect(wrapper.text()).toContain('Escolha itens');
    });

    it('exibe chips para valores selecionados no modo chips', () => {
        const wrapper = mountMultiSelect({
            modelValue: ['1', '2'],
            displayMode: 'chips'
        });
        const chips = wrapper.findAll('.max-multiselect-chip');
        expect(chips.length).toBe(2);
        expect(wrapper.text()).toContain('Opção 1');
        expect(wrapper.text()).toContain('Opção 2');
    });

    it('exibe contagem quando excede maxSelectedLabels', () => {
        const wrapper = mountMultiSelect({
            options: [
                { label: 'A', value: 'a' },
                { label: 'B', value: 'b' },
                { label: 'C', value: 'c' },
                { label: 'D', value: 'd' }
            ],
            modelValue: ['a', 'b', 'c', 'd'],
            maxSelectedLabels: 2
        });
        expect(wrapper.find('.max-multiselect-summary').text()).toContain('4 itens selecionados');
    });

    it('permite remover um item clicando no botão do chip', async () => {
        const wrapper = mountMultiSelect({
            modelValue: ['1', '2']
        });
        const removeBtns = wrapper.findAll('.chip-remove');
        expect(removeBtns.length).toBe(2);

        await removeBtns[0].trigger('click');
        const emitted = wrapper.emitted('update:modelValue');
        expect(emitted).toBeTruthy();
        expect(emitted![0][0]).toEqual(['2']);
    });

    it('limpa toda a seleção ao clicar no botão clearable', async () => {
        const wrapper = mountMultiSelect({
            modelValue: ['1', '2'],
            clearable: true
        });
        const clearBtn = wrapper.find('.max-select-clear-btn');
        expect(clearBtn.exists()).toBe(true);

        await clearBtn.trigger('click');
        const emitted = wrapper.emitted('update:modelValue');
        expect(emitted).toBeTruthy();
        expect(emitted![0][0]).toEqual([]);
    });

    it('não permite abrir nem remover itens se estiver desabilitado', async () => {
        const wrapper = mountMultiSelect({
            modelValue: ['1'],
            disabled: true
        });
        expect(wrapper.find('.chip-remove').exists()).toBe(false);

        const trigger = wrapper.find('.max-multiselect-trigger');
        await trigger.trigger('click');
        expect(wrapper.find('.max-multiselect-overlay').exists()).toBe(false);
    });
});
