import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxTagSelect from '../../src/components/MaxTagSelect.vue';

function mountTagSelect(props: Record<string, any> = {}, attrs: Record<string, any> = {}) {
    return mount(MaxTagSelect, {
        props: { modelValue: null, ...props },
        attrs,
        global: {
            stubs: {
                Icon: true,
                MaxIcon: true,
                MaxIconButton: true,
                Select: {
                    name: 'Select',
                    template: '<div class="p-select" @click="$emit(\'before-show\')"><slot name="value" :value="modelValue" /></div>',
                    props: ['modelValue', 'options']
                }
            }
        }
    });
}

describe('MaxTagSelect', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('renderiza corretamente o componente MaxTagSelect', () => {
        const wrapper = mountTagSelect();
        expect(wrapper.exists()).toBe(true);
        expect(wrapper.classes()).toContain('max-select-tag');
    });

    it('exibe o placeholder de forma válida na div tab-placeholder-select quando sem valor', () => {
        const wrapper = mountTagSelect({ modelValue: '' }, { placeholder: 'Selecione a Tag' });
        const placeholderDiv = wrapper.find('.tab-placeholder-select');
        expect(placeholderDiv.exists()).toBe(true);
        expect(placeholderDiv.element.tagName.toLowerCase()).toBe('div');
        expect(placeholderDiv.text()).toBe('Selecione a Tag');
    });

    it('renderiza a pílula da tag com estilos de fundo e texto', async () => {
        const options = [
            { value: 'carrossel', label: 'Carrossel', name: 'Carrossel', background_color: '#C6E7F0' }
        ];
        const wrapper = mountTagSelect({ modelValue: 'carrossel', options });
        await wrapper.vm.$nextTick();

        const valueDiv = wrapper.find('.value-tag-div');
        expect(valueDiv.exists()).toBe(true);
        expect(wrapper.find('.tag-value-text').text()).toBe('Carrossel');
    });

    it('emite update:modelValue ao mudar o valor selecionado', async () => {
        const wrapper = mountTagSelect({ modelValue: 'a' });
        (wrapper.vm as any).temp_value = 'b';
        await wrapper.vm.$nextTick();
        expect(wrapper.emitted('update:modelValue')?.[0][0]).toBe('b');
    });
});
