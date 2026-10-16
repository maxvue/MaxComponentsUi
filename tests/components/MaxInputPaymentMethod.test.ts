import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxInputPaymentMethod from '../../src/components/MaxInputPaymentMethod.vue';
import MaxDomainSelect from '../../src/components/base/MaxDomainSelect.vue';
import { PAYMENT_METHOD_OPTIONS } from '../../src/constants/paymentMethods';

function mountPaymentMethod(props: Record<string, any> = {}, attrs: Record<string, any> = {}) {
    return mount(MaxInputPaymentMethod, {
        props: { modelValue: null, ...props },
        attrs
    });
}

describe('MaxInputPaymentMethod (D07)', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('renderiza MaxDomainSelect com opções restritas a PIX e Cartão de crédito', () => {
        const wrapper = mountPaymentMethod();
        const domainSelect = wrapper.findComponent(MaxDomainSelect);

        expect(domainSelect.exists()).toBe(true);
        expect(domainSelect.props('options')).toEqual(PAYMENT_METHOD_OPTIONS);
        expect(domainSelect.props('options').length).toBe(2);
        expect(domainSelect.props('label')).toBe('Método de pagamento');
    });

    it('emite pix ou credit_card no update:modelValue ao selecionar', async () => {
        const wrapper = mountPaymentMethod();
        const domainSelect = wrapper.findComponent(MaxDomainSelect);

        domainSelect.vm.$emit('update:modelValue', 'pix');
        domainSelect.vm.$emit('change', 'pix');
        await wrapper.vm.$nextTick();

        expect(wrapper.emitted('update:modelValue')).toEqual([['pix']]);
        expect(wrapper.emitted('change')).toEqual([['pix']]);
    });

    it('emite null no update:modelValue e clear ao limpar', async () => {
        const wrapper = mountPaymentMethod({ modelValue: 'credit_card', clearable: true });
        const domainSelect = wrapper.findComponent(MaxDomainSelect);

        domainSelect.vm.$emit('update:modelValue', null);
        domainSelect.vm.$emit('change', null);
        domainSelect.vm.$emit('clear');
        await wrapper.vm.$nextTick();

        expect(wrapper.emitted('update:modelValue')).toEqual([[null]]);
        expect(wrapper.emitted('clear')).toBeDefined();
    });
});
