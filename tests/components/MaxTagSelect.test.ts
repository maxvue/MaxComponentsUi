import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxTagSelect from '../../src/components/MaxTagSelect.vue';
import InputBase from '../../src/components/InputBase.vue';

let activeWrapper: any = null;

function mountTagSelect(props: Record<string, any> = {}, attrs: Record<string, any> = {}) {
    activeWrapper = mount(MaxTagSelect, {
        props: { modelValue: null, ...props },
        attrs,
        attachTo: document.body,
        global: {
            stubs: {
                MaxIcon: {
                    template: '<span class="max-icon-stub"></span>',
                    props: ['icon', 'size', 'color']
                },
                MaxIconButton: {
                    template: '<button class="max-icon-button-stub"></button>',
                    props: ['icon', 'size']
                }
            }
        }
    });
    return activeWrapper;
}

describe('MaxTagSelect', () => {
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
        const wrapper = mountTagSelect();
        expect(wrapper.exists()).toBe(true);
        expect(wrapper.findComponent(InputBase).exists()).toBe(true);
    });

    it('exibe placeholder quando sem valor selecionado', () => {
        const wrapper = mountTagSelect({ modelValue: '' }, { placeholder: 'Escolha uma tag' });
        expect(wrapper.find('.tab-placeholder-select').exists()).toBe(true);
        expect(wrapper.find('.tab-placeholder-select').text()).toBe('Escolha uma tag');
    });

    it('calcula option_selected com base na prop options', async () => {
        const options = [{ value: 1, label: 'Tag Alta', tag_color: '#ff0000' }];
        const wrapper = mountTagSelect({ modelValue: 1, options });
        await wrapper.vm.$nextTick();

        const vm = wrapper.vm as any;
        expect(vm.option_selected.label).toBe('Tag Alta');
    });

    it('sincroniza prop modelValue com temp_value e emite update', async () => {
        const wrapper = mountTagSelect({ modelValue: 1 });
        await wrapper.setProps({ modelValue: 2 });
        expect((wrapper.vm as any).temp_value).toBe(2);

        (wrapper.vm as any).temp_value = 3;
        await wrapper.vm.$nextTick();
        expect(wrapper.emitted('update:modelValue')?.pop()).toEqual([3]);
    });

    it('clicar no gatilho abre o overlay e exibe as opções com estilos de cor', async () => {
        const options = [
            { value: '1', label: 'Tag Verde', backgroundColor: '#00ff00' },
            { value: '2', label: 'Tag Azul', backgroundColor: '#0000ff' }
        ];
        const wrapper = mountTagSelect({ options });

        await wrapper.find('.p-select').trigger('click');
        await wrapper.vm.$nextTick();

        const overlay = document.querySelector('.p-select-overlay');
        expect(overlay).not.toBeNull();
        expect(document.querySelectorAll('.p-select-option').length).toBe(2);
    });

    it('selecionar uma opção emite update:modelValue e change', async () => {
        const options = [{ value: 'tag1', label: 'Urgente', backgroundColor: '#ff0000' }];
        const wrapper = mountTagSelect({ options });

        await wrapper.find('.p-select').trigger('click');
        await wrapper.vm.$nextTick();

        const optionEl = document.querySelector('.p-select-option') as HTMLElement;
        expect(optionEl).not.toBeNull();
        optionEl.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        await wrapper.vm.$nextTick();

        expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['tag1']);
        expect(wrapper.emitted('change')).toBeTruthy();
    });

    it('não emite marcações do PrimeVue', () => {
        const wrapper = mountTagSelect({ options: [{ value: 1, label: 'Tag' }] });
        expect(wrapper.html()).not.toContain('data-pc-name');
    });
});
