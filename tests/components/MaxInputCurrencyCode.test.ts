import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxInputCurrencyCode from '../../src/components/MaxInputCurrencyCode.vue';
import MaxInputSelect from '../../src/components/MaxInputSelect.vue';

describe('MaxInputCurrencyCode', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('renderiza com catálogo de moedas padrão incluindo BRL, USD e EUR', () => {
        const wrapper = mount(MaxInputCurrencyCode, {
            props: {
                modelValue: 'BRL'
            }
        });
        expect(wrapper.exists()).toBe(true);
        const select = wrapper.findComponent(MaxInputSelect);
        expect(select.exists()).toBe(true);
        const options = select.props('options') as any[];
        expect(options.some((o) => o.code === 'BRL')).toBe(true);
        expect(options.some((o) => o.code === 'USD')).toBe(true);
        expect(options.some((o) => o.code === 'EUR')).toBe(true);
    });

    it('exibe o símbolo e o código da moeda selecionada no slot de valor', () => {
        const wrapper = mount(MaxInputCurrencyCode, {
            props: {
                modelValue: 'USD'
            }
        });
        expect(wrapper.text()).toContain('USD');
        expect(wrapper.text()).toContain('$');
    });

    it('emite update:modelValue e change ao selecionar outra moeda', async () => {
        const wrapper = mount(MaxInputCurrencyCode, {
            props: {
                modelValue: 'BRL'
            }
        });
        const select = wrapper.findComponent(MaxInputSelect);
        await select.vm.$emit('update:modelValue', 'EUR');

        const emitted = wrapper.emitted('update:modelValue');
        expect(emitted).toBeTruthy();
        expect(emitted![0][0]).toBe('EUR');

        const changeEmitted = wrapper.emitted('change');
        expect(changeEmitted).toBeTruthy();
        expect(changeEmitted![0][0]).toBe('EUR');
        expect((changeEmitted![0][1] as any).name).toBe('Euro');
    });
});
