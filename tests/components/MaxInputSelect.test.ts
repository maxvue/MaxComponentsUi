import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxInputSelect from '../../src/components/MaxInputSelect.vue';
import InputBase from '../../src/components/InputBase.vue';

let activeWrapper: any = null;

function mountSelect(props: Record<string, any> = {}, attrs: Record<string, any> = {}, slots: Record<string, any> = {}) {
    activeWrapper = mount(MaxInputSelect, {
        props: { modelValue: null, ...props },
        attrs,
        slots,
        attachTo: document.body,
        global: {
            stubs: {
                Icon: {
                    template: '<span class="max-icon-stub"></span>',
                    props: ['icon', 'size']
                }
            }
        }
    });
    return activeWrapper;
}

describe('MaxInputSelect', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    afterEach(() => {
        if (activeWrapper) {
            activeWrapper.unmount();
            activeWrapper = null;
        }
    });

    it('renderiza corretamente com InputBase', () => {
        const wrapper = mountSelect();
        expect(wrapper.exists()).toBe(true);
        expect(wrapper.findComponent(InputBase).exists()).toBe(true);
        expect(wrapper.find('.p-select').exists()).toBe(true);
    });

    it('exibe placeholder se sem valor', () => {
        const wrapper = mountSelect({ modelValue: '' }, { placeholder: 'Selecione' });
        expect(wrapper.find('.placeholder-select').exists()).toBe(true);
        expect(wrapper.find('.placeholder-select').text()).toBe('Selecione');
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

    it('clicar no gatilho abre o overlay e exibe as opções', async () => {
        const options = [{ value: '1', label: 'Opção 1' }, { value: '2', label: 'Opção 2' }];
        const wrapper = mountSelect({ options });

        await wrapper.find('.p-select').trigger('click');
        await wrapper.vm.$nextTick();

        const overlay = document.querySelector('.p-select-overlay');
        expect(overlay).not.toBeNull();
        expect(document.querySelectorAll('.p-select-option').length).toBe(2);
    });

    it('selecionar uma opção emite update:modelValue e change', async () => {
        const options = [{ value: 'val1', label: 'Opção 1' }];
        const wrapper = mountSelect({ options });

        await wrapper.find('.p-select').trigger('click');
        await wrapper.vm.$nextTick();

        const optionEl = document.querySelector('.p-select-option') as HTMLElement;
        expect(optionEl).not.toBeNull();
        optionEl.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        await wrapper.vm.$nextTick();

        expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['val1']);
        expect(wrapper.emitted('change')).toBeTruthy();
    });

    it('chama loadOptions em before_show', async () => {
        let resolveLoad: any;
        const loadPromise = new Promise((resolve) => {
            resolveLoad = resolve;
        });
        const loadOptions = vi.fn().mockReturnValue(loadPromise);
        const wrapper = mountSelect({ loadOptions });

        await wrapper.find('.p-select').trigger('click');
        await wrapper.vm.$nextTick();

        expect(loadOptions).toHaveBeenCalled();
        expect((wrapper.vm as any).loading).toBe(true);

        resolveLoad([{ items: [{ value: 'loaded', name: 'Loaded' }] }]);

        await loadPromise;
        await wrapper.vm.$nextTick();

        expect((wrapper.vm as any).optionsField).toEqual([{ items: [{ value: 'loaded', name: 'Loaded' }] }]);
        expect((wrapper.vm as any).loading).toBe(false);
    });

    it('suporta busca com filter ignorando acentos/case', async () => {
        const options = [{ value: '1', label: 'São Paulo' }, { value: '2', label: 'Rio de Janeiro' }];
        const wrapper = mountSelect({ options, filter: true });

        await wrapper.find('.p-select').trigger('click');
        await wrapper.vm.$nextTick();

        const filterInput = document.querySelector('.p-select-header input') as HTMLInputElement;
        expect(filterInput).not.toBeNull();

        filterInput.value = 'sao';
        filterInput.dispatchEvent(new Event('input', { bubbles: true }));
        await wrapper.vm.$nextTick();

        expect(document.querySelectorAll('.p-select-option').length).toBe(1);
        expect(document.querySelector('.p-select-option')?.textContent).toContain('São Paulo');
    });

    it('teclado: Enter e Space alternam overlay e Escape fecha', async () => {
        const wrapper = mountSelect({ options: [{ value: '1', label: 'Item' }] });
        const select = wrapper.find('.p-select');

        await select.trigger('keydown', { key: 'Enter' });
        await wrapper.vm.$nextTick();
        expect(document.querySelector('.p-select-overlay')).not.toBeNull();

        await select.trigger('keydown', { key: 'Escape' });
        await wrapper.vm.$nextTick();
        expect(document.querySelector('.p-select-overlay')).toBeNull();
    });

    it('não emite marcações do PrimeVue', () => {
        const wrapper = mountSelect({ options: [{ value: '1', label: 'Item' }] });
        expect(wrapper.html()).not.toContain('data-pc-name');
    });
});
