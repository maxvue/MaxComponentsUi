import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxInputCheckbox from '../../src/components/MaxInputCheckbox.vue';
import MaxInputRadio from '../../src/components/MaxInputRadio.vue';

// A cobertura de MaxInputToggle e MaxInputSwitch vive em seus arquivos dedicados:
// tests/components/MaxInputToggle.test.ts e tests/components/MaxInputSwitch.test.ts

describe('MaxInputCheckbox', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('renderiza corretamente e atualiza v-model via props', async () => {
        const wrapper = mount(MaxInputCheckbox, {
            props: { modelValue: false }
        });
        expect(wrapper.exists()).toBe(true);
        await wrapper.setProps({ modelValue: true });
    });

    it('renderiza com label', () => {
        const wrapper = mount(MaxInputCheckbox, {
            props: { modelValue: false, label: 'Aceito os termos' }
        });
        expect(wrapper.text()).toContain('Aceito os termos');
    });

    it('atualiza temp_value para emitir v-model', async () => {
        const wrapper = mount(MaxInputCheckbox, {
            props: { modelValue: false }
        });
        const vm = wrapper.vm as any;
        vm.temp_value = true;
        await wrapper.vm.$nextTick();
        expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([true]);
    });
});

describe('MaxInputRadio', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('renderiza corretamente com label', () => {
        const wrapper = mount(MaxInputRadio, {
            props: { modelValue: null, value: 'opcao1' },
            attrs: { label: 'Opção 1' },
            global: {
                stubs: { RadioButton: { template: '<input type="radio" />' }, Icon: true }
            }
        });
        expect(wrapper.exists()).toBe(true);
        expect(wrapper.text()).toContain('Opção 1');
    });

    it('renderiza icon quando attrs.icon é fornecido', () => {
        const wrapper = mount(MaxInputRadio, {
            props: { modelValue: null, value: 'opcao1' },
            attrs: { icon: 'mdi:check' },
            global: {
                stubs: { MaxIcon: { template: '<div class="icon"></div>' } }
            }
        });
        expect(wrapper.find('.icon').exists()).toBe(true);
    });

    it('onClick seleciona o radio e atualiza modelValue', async () => {
        const wrapper = mount(MaxInputRadio, {
            props: { modelValue: null, value: 'opcao1' }
        });

        await wrapper.find('.radio-button-input-main-div').trigger('click');
        expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['opcao1']);
    });

    it('atualiza modelo e emite evento', async () => {
        const wrapper = mount(MaxInputRadio, {
            props: { modelValue: null, value: 'opcao1' },
            global: {
                stubs: { RadioButton: { template: '<input type="radio" />' }, Icon: true }
            }
        });

        (wrapper.vm as any).temp_value = 'opcao1';
        await wrapper.vm.$nextTick();
        expect(wrapper.emitted('update:modelValue')?.[0][0]).toBe('opcao1');
    });

    it('watch props.modelValue atualiza temp_value', async () => {
        const wrapper = mount(MaxInputRadio, {
            props: { modelValue: null, value: 'opcao1' },
            global: {
                stubs: { RadioButton: { template: '<input type="radio" />' }, Icon: true }
            }
        });

        await wrapper.setProps({ modelValue: 'opcao2' });
        expect((wrapper.vm as any).temp_value).toBe('opcao2');
    });
});

