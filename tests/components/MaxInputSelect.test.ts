import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
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
                MaxIcon: true
            }
        }
    });
}

describe('MaxInputSelect', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    afterEach(() => {
        document.body.innerHTML = '';
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
        const loadPromise = new Promise((resolve) => {
            resolveLoad = resolve;
        });
        const loadOptions = vi.fn().mockReturnValue(loadPromise);
        const wrapper = mountSelect({ loadOptions });

        await wrapper.find('.p-select').trigger('click');

        expect(loadOptions).toHaveBeenCalled();
        expect((wrapper.vm as any).loading).toBe(true);

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

    it('não lança quando loadOptions retorna lista plana com groupOptions setado', async () => {
        const groupOptions = [{ label: 'Group 1', items: [{ value: 'b', name: 'B' }] }];
        let resolveLoad: any;
        const loadPromise = new Promise((resolve) => {
            resolveLoad = resolve;
        });
        const loadOptions = vi.fn().mockReturnValue(loadPromise);
        const wrapper = mountSelect({ modelValue: 'flat', groupOptions, loadOptions });

        await wrapper.find('.p-select').trigger('click');

        resolveLoad([{ value: 'flat', name: 'Flat Option' }]);
        await loadPromise;
        await wrapper.vm.$nextTick();

        const vm = wrapper.vm as any;
        expect(() => vm.option_selected).not.toThrow();
        expect(vm.option_selected.name).toBe('Flat Option');
    });

    it('não exibe placeholder e exibe option quando modelValue é 0', async () => {
        const options = [{ value: 0, name: 'Opção Zero' }];
        const wrapper = mountSelect({ modelValue: 0, options, placeholder: 'Selecione' });
        await wrapper.vm.$nextTick();

        expect(wrapper.find('.placeholder-select').exists()).toBe(false);
        expect(wrapper.find('.value-div').exists()).toBe(true);
        expect(wrapper.find('.value-div').text()).toContain('Opção Zero');
    });

    it('não exibe placeholder e exibe option quando modelValue é false', async () => {
        const options = [{ value: false, name: 'Opção Falsa' }];
        const wrapper = mountSelect({ modelValue: false, options, placeholder: 'Selecione' });
        await wrapper.vm.$nextTick();

        expect(wrapper.find('.placeholder-select').exists()).toBe(false);
        expect(wrapper.find('.value-div').exists()).toBe(true);
        expect(wrapper.find('.value-div').text()).toContain('Opção Falsa');
    });

    it('não exibe placeholder e exibe option quando modelValue é null e há opção com valor null', async () => {
        const options = [{ value: null, name: 'Opção Nula' }];
        const wrapper = mountSelect({ modelValue: null, options, placeholder: 'Selecione' });
        await wrapper.vm.$nextTick();

        expect(wrapper.find('.placeholder-select').exists()).toBe(false);
        expect(wrapper.find('.value-div').exists()).toBe(true);
        expect(wrapper.find('.value-div').text()).toContain('Opção Nula');
    });

    it('exibe placeholder e não exibe value-div quando modelValue é órfão', async () => {
        const options = [{ value: 'a', name: 'Opção A' }];
        const wrapper = mountSelect({ modelValue: 'orfao', options, placeholder: 'Selecione' });
        await wrapper.vm.$nextTick();

        expect(wrapper.find('.placeholder-select').exists()).toBe(true);
        expect(wrapper.find('.placeholder-select').text()).toBe('Selecione');
        expect(wrapper.find('.value-div').exists()).toBe(false);
    });

    it('exibe placeholder e não exibe value-div quando modelValue é null sem opção correspondente', async () => {
        const options = [{ value: 'a', name: 'Opção A' }];
        const wrapper = mountSelect({ modelValue: null, options, placeholder: 'Selecione' });
        await wrapper.vm.$nextTick();

        expect(wrapper.find('.placeholder-select').exists()).toBe(true);
        expect(wrapper.find('.placeholder-select').text()).toBe('Selecione');
        expect(wrapper.find('.value-div').exists()).toBe(false);
    });

    it('aplica height padrão de 27px nos itens da lista', async () => {
        const options = [
            { value: '1', name: 'Opção 1' },
            { value: '2', name: 'Opção 2' }
        ];
        const wrapper = mountSelect({ options }, {}, true);
        await wrapper.find('.p-select').trigger('click');
        await wrapper.vm.$nextTick();

        const item = document.body.querySelector('.p-select-option') as HTMLElement;
        expect(item).not.toBeNull();
        expect(item.style.height).toBe('27px');
    });

    it('aplica height customizado quando listHeight é informado como número ou string', async () => {
        const options = [{ value: '1', name: 'Opção 1' }];
        const wrapper = mountSelect({ options, listHeight: 40 }, {}, true);
        await wrapper.find('.p-select').trigger('click');
        await wrapper.vm.$nextTick();

        const item = document.body.querySelector('.p-select-option') as HTMLElement;
        expect(item).not.toBeNull();
        expect(item.style.height).toBe('40px');
    });

    it('aplica height customizado quando listHeight é informado com unidade CSS', async () => {
        const options = [{ value: '1', name: 'Opção 1' }];
        const wrapper = mountSelect({ options, listHeight: '2.5rem' }, {}, true);
        await wrapper.find('.p-select').trigger('click');
        await wrapper.vm.$nextTick();

        const item = document.body.querySelector('.p-select-option') as HTMLElement;
        expect(item).not.toBeNull();
        expect(item.style.height).toBe('2.5rem');
    });

    it('foca no input de filtro ao abrir quando filter=true', async () => {
        const options = [{ value: '1', name: 'Opção 1' }];
        const focusSpy = vi.spyOn(HTMLInputElement.prototype, 'focus');
        const wrapper = mountSelect({ options, filter: true }, {}, true);

        await wrapper.find('.p-select').trigger('click');
        await wrapper.vm.$nextTick();

        expect(focusSpy).toHaveBeenCalled();
        focusSpy.mockRestore();
    });
});


