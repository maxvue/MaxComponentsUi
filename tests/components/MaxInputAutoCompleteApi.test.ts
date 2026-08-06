import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxInputAutoCompleteApi from '../../src/components/MaxInputAutoCompleteApi.vue';

function mountAutoCompleteApi(props: Record<string, any> = {}, attrs: Record<string, any> = {}) {
    return mount(MaxInputAutoCompleteApi, {
        props: { route: '/api/test', modelValue: '', ...props },
        attrs,
        global: {
            stubs: {
                MaxInputAutoComplete: {
                    template: '<div class="max-input-auto-complete-stub" @blur="$emit(\'blur\')" @complete="$emit(\'complete\')"><slot name="option" :option="{ model: \'Model Test\', sub_label: \'Sub Test\' }" /></div>',
                    props: ['options', 'modelValue']
                }
            }
        }
    });
}

describe('MaxInputAutoCompleteApi.vue', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('deve renderizar o componente sem PrimeVue', () => {
        const wrapper = mountAutoCompleteApi();
        expect(wrapper.exists()).toBe(true);
        expect(wrapper.html()).not.toContain('data-pc-name');
    });

    it('atualiza o valor quando modificado via props', async () => {
        const wrapper = mountAutoCompleteApi();
        (wrapper.vm as any).temp_value = '1';
        expect((wrapper.vm as any).temp_value).toBe('1');
    });

    it('calcula temp_value_string corretamente', () => {
        const wrapper = mountAutoCompleteApi({ modelValue: 'string_value' });
        const vm = wrapper.vm as any;
        expect(vm.temp_value_string).toBe('string_value');

        vm.temp_value = { value: 'obj_value' };
        expect(vm.temp_value_string).toBe('obj_value');

        vm.temp_value = { label: 'obj_label' };
        expect(vm.temp_value_string).toBe('obj_label');

        vm.temp_value = { id: 'obj_id' };
        expect(vm.temp_value_string).toBe('obj_id');

        vm.temp_value = {};
        expect(vm.temp_value_string).toBe('');
    });

    it('retorna string vazia se temp_value não for string/object com prop', () => {
        const wrapper = mountAutoCompleteApi({ modelValue: null });
        const vm = wrapper.vm as any;
        expect(vm.temp_value_string).toBe('');
    });

    it('calcula isDone corretamente no blur', async () => {
        const wrapper = mountAutoCompleteApi({ required: true, modelValue: '' });
        await wrapper.find('.max-input-auto-complete-stub').trigger('blur');
        expect((wrapper.vm as any).isDone).toBe(false);
    });

    it('calcula isDone = true quando required e tem valor no blur', async () => {
        const wrapper = mountAutoCompleteApi({ required: true, modelValue: 'algum valor' });
        await wrapper.find('.max-input-auto-complete-stub').trigger('blur');
        expect((wrapper.vm as any).isDone).toBe(true);
    });

    it('respeita prop done explícita', async () => {
        const wrapper = mountAutoCompleteApi({ done: true });
        await wrapper.find('.max-input-auto-complete-stub').trigger('blur');
        expect((wrapper.vm as any).isDone).toBe(true);
    });

    it('testIsDone usa caution invertida caso isRequired não exista', () => {
        const wrapper = mountAutoCompleteApi({ caution: true });
        const done = (wrapper.vm as any).testIsDone();
        expect(done).toBe(false);
    });

    it('executa search e filtra corretamente', async () => {
        const wrapper = mountAutoCompleteApi();
        (wrapper.vm as any).list = [
            { label: 'Maçã', value: 'apple', sub_label: 'Fruit' },
            { name: 'Banana', value: 'banana', sub_label: 'Fruit' }
        ];

        (wrapper.vm as any).temp_value = 'açã';
        await wrapper.vm.$nextTick();

        const filtered = (wrapper.vm as any).filtered_values;
        expect(filtered.length).toBe(1);
        expect(filtered[0].value).toBe('apple');
    });

    it('emite update:modelValue apenas se for object', async () => {
        const wrapper = mountAutoCompleteApi();

        (wrapper.vm as any).temp_value = 'some_str';
        await wrapper.vm.$nextTick();
        expect(wrapper.emitted('update:modelValue')).toBeFalsy();

        const obj = { value: 'val' };
        (wrapper.vm as any).temp_value = obj;
        await wrapper.vm.$nextTick();
        expect(wrapper.emitted('update:modelValue')?.[0][0]).toEqual(obj);
    });

    it('renderiza o slot de option corretamente', () => {
        const wrapper = mountAutoCompleteApi();

        const labelEl = wrapper.find('.autocomplete-item-select-label');
        const subLabelEl = wrapper.find('.autocomplete-item-select-sub-label');

        expect(labelEl.text()).toBe('Model Test');
        expect(subLabelEl.text()).toBe('Sub Test');
    });
});
