import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxInputAiBillingUnit from '../../src/components/MaxInputAiBillingUnit.vue';
import MaxDomainSelect from '../../src/components/base/MaxDomainSelect.vue';
import { AI_BILLING_UNIT_OPTIONS } from '../../src/constants/aiInputs';

function mountAiBillingUnit(props: Record<string, any> = {}, attrs: Record<string, any> = {}) {
    return mount(MaxInputAiBillingUnit, {
        props: { modelValue: null, ...props },
        attrs
    });
}

describe('MaxInputAiBillingUnit (D06)', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('renderiza MaxDomainSelect com 7 unidades de cobrança', () => {
        const wrapper = mountAiBillingUnit();
        const domainSelect = wrapper.findComponent(MaxDomainSelect);

        expect(domainSelect.exists()).toBe(true);
        expect(domainSelect.props('options')).toEqual(AI_BILLING_UNIT_OPTIONS);
        expect(domainSelect.props('options').length).toBe(7);
        expect(domainSelect.props('label')).toBe('Unidade de cobrança');
    });

    it('distingue m_tokens e tokens claramente nos rótulos', () => {
        const mTokens = AI_BILLING_UNIT_OPTIONS.find((opt) => opt.value === 'm_tokens');
        const tokens = AI_BILLING_UNIT_OPTIONS.find((opt) => opt.value === 'tokens');

        expect(mTokens?.label).toBe('Por 1 milhão de tokens');
        expect(tokens?.label).toBe('Por token');
    });

    it('emite unidade no update:modelValue ao selecionar', async () => {
        const wrapper = mountAiBillingUnit();
        const domainSelect = wrapper.findComponent(MaxDomainSelect);

        domainSelect.vm.$emit('update:modelValue', 'characters');
        domainSelect.vm.$emit('change', 'characters');
        await wrapper.vm.$nextTick();

        expect(wrapper.emitted('update:modelValue')).toEqual([['characters']]);
        expect(wrapper.emitted('change')).toEqual([['characters']]);
    });
});
