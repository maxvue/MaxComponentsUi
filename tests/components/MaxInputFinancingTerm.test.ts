import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxInputFinancingTerm from '../../src/components/MaxInputFinancingTerm.vue';
import MaxDomainSelect from '../../src/components/base/MaxDomainSelect.vue';
import { FINANCING_TERM_OPTIONS } from '../../src/constants/financingInputs';

function mountFinancingTerm(props: Record<string, any> = {}, attrs: Record<string, any> = {}) {
    return mount(MaxInputFinancingTerm, {
        props: { modelValue: null, ...props },
        attrs
    });
}

describe('MaxInputFinancingTerm (I02)', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('renderiza MaxDomainSelect com as 8 opções padrão de prazo em meses', () => {
        const wrapper = mountFinancingTerm();
        const domainSelect = wrapper.findComponent(MaxDomainSelect);

        expect(domainSelect.exists()).toBe(true);
        expect(domainSelect.props('options')).toEqual(FINANCING_TERM_OPTIONS);
        expect(domainSelect.props('options').length).toBe(8);
        expect(domainSelect.props('label')).toBe('Prazo do financiamento');
    });

    it('permite sobrescrever opções com opções numéricas customizadas e lista vazia []', () => {
        const customOptions = [
            { value: 6, label: '6 meses', name: '6 meses' },
            { value: 12, label: '12 meses', name: '12 meses' }
        ];
        const wrapperCustom = mountFinancingTerm({ options: customOptions });
        const selectCustom = wrapperCustom.findComponent(MaxDomainSelect);
        expect(selectCustom.props('options')).toEqual(customOptions);

        const wrapperEmpty = mountFinancingTerm({ options: [] });
        const selectEmpty = wrapperEmpty.findComponent(MaxDomainSelect);
        expect(selectEmpty.props('options')).toEqual([]);
    });

    it('emite número de prazo no update:modelValue ao selecionar', async () => {
        const wrapper = mountFinancingTerm();
        const domainSelect = wrapper.findComponent(MaxDomainSelect);

        domainSelect.vm.$emit('update:modelValue', 48);
        domainSelect.vm.$emit('change', 48);
        await wrapper.vm.$nextTick();

        expect(wrapper.emitted('update:modelValue')).toEqual([[48]]);
        expect(wrapper.emitted('change')).toEqual([[48]]);
    });

    it('emite clear quando o seletor é limpo', async () => {
        const wrapper = mountFinancingTerm({ clearable: true, modelValue: 60 });
        const domainSelect = wrapper.findComponent(MaxDomainSelect);

        domainSelect.vm.$emit('clear');
        await wrapper.vm.$nextTick();

        expect(wrapper.emitted('clear')).toBeDefined();
    });
});
