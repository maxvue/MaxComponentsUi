import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxInputFinancingGracePeriod from '../../src/components/MaxInputFinancingGracePeriod.vue';
import MaxDomainSelect from '../../src/components/base/MaxDomainSelect.vue';
import { FINANCING_GRACE_PERIOD_OPTIONS } from '../../src/constants/financingInputs';

function mountFinancingGracePeriod(props: Record<string, any> = {}, attrs: Record<string, any> = {}) {
    return mount(MaxInputFinancingGracePeriod, {
        props: { modelValue: null, ...props },
        attrs
    });
}

describe('MaxInputFinancingGracePeriod (I03)', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('renderiza MaxDomainSelect com as 4 opções padrão de carência em dias', () => {
        const wrapper = mountFinancingGracePeriod();
        const domainSelect = wrapper.findComponent(MaxDomainSelect);

        expect(domainSelect.exists()).toBe(true);
        expect(domainSelect.props('options')).toEqual(FINANCING_GRACE_PERIOD_OPTIONS);
        expect(domainSelect.props('options').length).toBe(4);
        expect(domainSelect.props('label')).toBe('Carência da primeira parcela');
    });

    it('permite sobrescrever opções com opções numéricas customizadas e lista vazia []', () => {
        const customOptions = [
            { value: 15, label: '15 dias', name: '15 dias' },
            { value: 45, label: '45 dias', name: '45 dias' }
        ];
        const wrapperCustom = mountFinancingGracePeriod({ options: customOptions });
        const selectCustom = wrapperCustom.findComponent(MaxDomainSelect);
        expect(selectCustom.props('options')).toEqual(customOptions);

        const wrapperEmpty = mountFinancingGracePeriod({ options: [] });
        const selectEmpty = wrapperEmpty.findComponent(MaxDomainSelect);
        expect(selectEmpty.props('options')).toEqual([]);
    });

    it('emite número de carência no update:modelValue ao selecionar', async () => {
        const wrapper = mountFinancingGracePeriod();
        const domainSelect = wrapper.findComponent(MaxDomainSelect);

        domainSelect.vm.$emit('update:modelValue', 90);
        domainSelect.vm.$emit('change', 90);
        await wrapper.vm.$nextTick();

        expect(wrapper.emitted('update:modelValue')).toEqual([[90]]);
        expect(wrapper.emitted('change')).toEqual([[90]]);
    });

    it('emite clear quando o seletor é limpo', async () => {
        const wrapper = mountFinancingGracePeriod({ clearable: true, modelValue: 30 });
        const domainSelect = wrapper.findComponent(MaxDomainSelect);

        domainSelect.vm.$emit('clear');
        await wrapper.vm.$nextTick();

        expect(wrapper.emitted('clear')).toBeDefined();
    });
});
