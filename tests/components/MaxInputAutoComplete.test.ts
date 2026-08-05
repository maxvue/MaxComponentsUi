import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxInputAutoComplete from '../../src/components/MaxInputAutoComplete.vue';
import InputBase from '../../src/components/InputBase.vue';

let activeWrapper: any = null;

function mountAutoComplete(props: Record<string, any> = {}, attrs: Record<string, any> = {}) {
    activeWrapper = mount(MaxInputAutoComplete, {
        props: { modelValue: '', options: [], ...props },
        attrs,
        attachTo: document.body
    });
    return activeWrapper;
}

describe('MaxInputAutoComplete.vue', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    afterEach(() => {
        if (activeWrapper) {
            activeWrapper.unmount();
            activeWrapper = null;
        }
    });

    it('deve renderizar o componente com InputBase', () => {
        const wrapper = mountAutoComplete();
        expect(wrapper.exists()).toBe(true);
        expect(wrapper.findComponent(InputBase).exists()).toBe(true);
        expect(wrapper.find('input[role="combobox"]').exists()).toBe(true);
    });

    it('deve reagir à mudança de props', async () => {
        const wrapper = mountAutoComplete({
            options: [{ label: 'Opção 1', value: 'opt1' }]
        });
        await wrapper.setProps({ modelValue: 'opt1' });
        expect((wrapper.vm as any).temp_value).toBe('opt1');
    });

    it('calcula temp_value_string corretamente com string e object', () => {
        const wrapperStr = mountAutoComplete({ modelValue: 'string_value' });
        expect((wrapperStr.vm as any).temp_value_string).toBe('string_value');

        const wrapperObj = mountAutoComplete({ modelValue: { value: 'obj_value' } });
        expect((wrapperObj.vm as any).temp_value_string).toBe('obj_value');
    });

    it('calcula isDone e caution corretamente no blur', async () => {
        const wrapper = mountAutoComplete({ required: true, modelValue: '' });
        const input = wrapper.find('input[role="combobox"]');
        await input.trigger('blur');
        await new Promise((resolve) => setTimeout(resolve, 200));

        expect((wrapper.vm as any).isDone).toBe(false);
        expect((wrapper.vm as any).caution).toBe(true);
    });

    it('calcula isDone = true quando required e tem valor no blur', async () => {
        const wrapper = mountAutoComplete({ required: true, modelValue: 'algum valor' });
        const input = wrapper.find('input[role="combobox"]');
        await input.trigger('blur');
        await new Promise((resolve) => setTimeout(resolve, 200));

        expect((wrapper.vm as any).isDone).toBe(true);
    });

    it('respeita prop done explícita', async () => {
        const wrapper = mountAutoComplete({ done: true });
        const input = wrapper.find('input[role="combobox"]');
        await input.trigger('blur');
        await new Promise((resolve) => setTimeout(resolve, 200));

        expect((wrapper.vm as any).isDone).toBe(true);
    });

    it('executa search e filtra opções ao digitar ou focar', async () => {
        const options = [
            { label: 'Maçã', value: 'apple' },
            { name: 'Banana', value: 'banana' }
        ];
        const wrapper = mountAutoComplete({ options });
        const input = wrapper.find('input[role="combobox"]');

        await input.setValue('açã');
        await input.trigger('input');
        await wrapper.vm.$nextTick();

        const filtered = (wrapper.vm as any).filtered_values;
        expect(filtered.length).toBe(1);
        expect(filtered[0].value).toBe('apple');
    });

    it('emite update:modelValue apenas se for object', async () => {
        const wrapper = mountAutoComplete();

        (wrapper.vm as any).temp_value = 'some_str';
        await wrapper.vm.$nextTick();
        expect(wrapper.emitted('update:modelValue')).toBeFalsy();

        const obj = { value: 'val' };
        (wrapper.vm as any).temp_value = obj;
        await wrapper.vm.$nextTick();
        expect(wrapper.emitted('update:modelValue')?.[0][0]).toEqual(obj);
    });

    it('não emite marcações do PrimeVue', () => {
        const wrapper = mountAutoComplete();
        expect(wrapper.html()).not.toContain('data-pc-name');
    });
});
