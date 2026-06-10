import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxInputSelect from '../../src/components/MaxInputSelect.vue';

function mountSelect(props: Record<string, any> = {}, attrs: Record<string, any> = {}) {
    return mount(MaxInputSelect, {
        props: { modelValue: null, ...props },
        attrs,
        global: {
            stubs: {
                Icon: true,
                Select: {
                    name: 'Select',
                    template: '<div class="p-select" @click="$emit(\'before-show\')"><slot name="value" :value="modelValue" /></div>',
                    props: ['modelValue', 'options']
                }
            }
        }
    });
}

function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

describe('MaxInputSelect', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('renderiza corretamente', () => {
        const wrapper = mountSelect();
        expect(wrapper.exists()).toBe(true);
    });

    it('exibe placeholder se sem valor', () => {
        const wrapper = mountSelect({ modelValue: '' }, { placeholder: 'Selecione' });
        expect(wrapper.find('.placeholder-select').exists()).toBe(true);
    });

    it('renderiza options simples e calcula option_selected', async () => {
        const options = [{ value: 'a', name: 'A', icon: 'mdi:test' }];
        const wrapper = mountSelect({ modelValue: 'a', options });
        await wrapper.vm.$nextTick();
        
        const vm = wrapper.vm as any;
        expect(vm.option_selected.name).toBe('A');
    });

    it('renderiza groupOptions e calcula option_selected', async () => {
        const groupOptions = [
            { label: 'Group 1', items: [{ value: 'b', name: 'B' }] }
        ];
        const wrapper = mountSelect({ modelValue: 'b', groupOptions });
        await wrapper.vm.$nextTick();
        
        const vm = wrapper.vm as any;
        expect(vm.option_selected.name).toBe('B');
    });

    it('retorna vazio se option_selected não encontrar', async () => {
        const options = [{ value: 'a', name: 'A' }];
        const wrapper = mountSelect({ modelValue: 'c', options });
        const vm = wrapper.vm as any;
        expect(vm.option_selected).toEqual({});
    });

    it('chama loadOptions em before_show', async () => {
        let resolveLoad: any;
        const loadPromise = new Promise(resolve => {
            resolveLoad = resolve;
        });
        const loadOptions = vi.fn().mockReturnValue(loadPromise);
        const wrapper = mountSelect({ loadOptions });
        
        wrapper.find('.p-select').trigger('click');
        
        // Let event loop process click
        await wrapper.vm.$nextTick();
        
        expect(loadOptions).toHaveBeenCalled();
        expect((wrapper.vm as any).loading).toBe(true);
        
        // Return valid group format because option_selected will try to iterate it
        resolveLoad([{ items: [{ value: 'loaded', name: 'Loaded' }] }]);
        
        await loadPromise;
        await wrapper.vm.$nextTick();
        
        expect((wrapper.vm as any).optionsField).toEqual([{ items: [{ value: 'loaded', name: 'Loaded' }] }]);
        expect((wrapper.vm as any).loading).toBe(false);
    });

    it('atualiza temp_value pelo watch de modelValue', async () => {
        const wrapper = mountSelect({ modelValue: 'a' });
        await wrapper.setProps({ modelValue: 'b' });
        expect((wrapper.vm as any).temp_value).toBe('b');
    });

    it('emite update:modelValue ao alterar temp_value', async () => {
        const wrapper = mountSelect();
        (wrapper.vm as any).temp_value = 'new_value';
        await wrapper.vm.$nextTick();
        expect(wrapper.emitted('update:modelValue')?.[0][0]).toBe('new_value');
    });
});
