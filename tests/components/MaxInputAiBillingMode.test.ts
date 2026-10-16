import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxInputAiBillingMode from '../../src/components/MaxInputAiBillingMode.vue';
import MaxDomainSelect from '../../src/components/base/MaxDomainSelect.vue';
import { AI_BILLING_MODE_OPTIONS } from '../../src/constants/aiInputs';

function mountAiBillingMode(props: Record<string, any> = {}, attrs: Record<string, any> = {}) {
    return mount(MaxInputAiBillingMode, {
        props: { modelValue: null, ...props },
        attrs
    });
}

describe('MaxInputAiBillingMode (D05)', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('renderiza MaxDomainSelect com 4 formas de cobrança e rótulo padrão', () => {
        const wrapper = mountAiBillingMode();
        const domainSelect = wrapper.findComponent(MaxDomainSelect);

        expect(domainSelect.exists()).toBe(true);
        expect(domainSelect.props('options')).toEqual(AI_BILLING_MODE_OPTIONS);
        expect(domainSelect.props('options').length).toBe(4);
        expect(domainSelect.props('label')).toBe('Forma de cobrança');
    });

    it('contém free e local como opções distintas', () => {
        const freeOpt = AI_BILLING_MODE_OPTIONS.find((opt) => opt.value === 'free');
        const localOpt = AI_BILLING_MODE_OPTIONS.find((opt) => opt.value === 'local');

        expect(freeOpt?.label).toBe('Gratuito');
        expect(localOpt?.label).toBe('Local (custo zero)');
    });

    it('emite código de forma de cobrança ao selecionar', async () => {
        const wrapper = mountAiBillingMode();
        const domainSelect = wrapper.findComponent(MaxDomainSelect);

        domainSelect.vm.$emit('update:modelValue', 'bonus');
        domainSelect.vm.$emit('change', 'bonus');
        await wrapper.vm.$nextTick();

        expect(wrapper.emitted('update:modelValue')).toEqual([['bonus']]);
        expect(wrapper.emitted('change')).toEqual([['bonus']]);
    });
});
