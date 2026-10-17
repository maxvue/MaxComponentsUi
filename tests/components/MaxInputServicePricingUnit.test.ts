import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxInputServicePricingUnit from '../../src/components/MaxInputServicePricingUnit.vue';
import MaxDomainSelect from '../../src/components/base/MaxDomainSelect.vue';
import { SERVICE_PRICING_UNIT_OPTIONS } from '../../src/constants/serviceInputs';

function mountServicePricingUnit(props: Record<string, any> = {}, attrs: Record<string, any> = {}) {
    return mount(MaxInputServicePricingUnit, {
        props: { modelValue: null, ...props },
        attrs
    });
}

describe('MaxInputServicePricingUnit (I04)', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('renderiza MaxDomainSelect com as 4 opções de unidade de preço', () => {
        const wrapper = mountServicePricingUnit();
        const domainSelect = wrapper.findComponent(MaxDomainSelect);

        expect(domainSelect.exists()).toBe(true);
        expect(domainSelect.props('options')).toEqual(SERVICE_PRICING_UNIT_OPTIONS);
        expect(domainSelect.props('options').length).toBe(4);
        expect(domainSelect.props('label')).toBe('Unidade de preço do serviço');
    });

    it('emite unidade no update:modelValue e change ao selecionar', async () => {
        const wrapper = mountServicePricingUnit();
        const domainSelect = wrapper.findComponent(MaxDomainSelect);

        domainSelect.vm.$emit('update:modelValue', 'kwp');
        domainSelect.vm.$emit('change', 'kwp');
        await wrapper.vm.$nextTick();

        expect(wrapper.emitted('update:modelValue')).toEqual([['kwp']]);
        expect(wrapper.emitted('change')).toEqual([['kwp']]);
    });

    it('emite clear quando o seletor é limpo', async () => {
        const wrapper = mountServicePricingUnit({ clearable: true, modelValue: 'km' });
        const domainSelect = wrapper.findComponent(MaxDomainSelect);

        domainSelect.vm.$emit('clear');
        await wrapper.vm.$nextTick();

        expect(wrapper.emitted('clear')).toBeDefined();
    });
});
