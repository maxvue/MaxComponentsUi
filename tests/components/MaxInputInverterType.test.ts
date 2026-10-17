import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxInputInverterType from '../../src/components/MaxInputInverterType.vue';
import MaxDomainSelect from '../../src/components/base/MaxDomainSelect.vue';
import { INVERTER_TYPE_OPTIONS } from '../../src/constants/electricalInputs';

function mountInverterType(props: Record<string, any> = {}, attrs: Record<string, any> = {}) {
    return mount(MaxInputInverterType, {
        props: { modelValue: null, ...props },
        attrs
    });
}

describe('MaxInputInverterType (I06)', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('renderiza MaxDomainSelect com as 2 opções de inversor preservando a caixa', () => {
        const wrapper = mountInverterType();
        const domainSelect = wrapper.findComponent(MaxDomainSelect);

        expect(domainSelect.exists()).toBe(true);
        expect(domainSelect.props('options')).toEqual(INVERTER_TYPE_OPTIONS);
        expect(domainSelect.props('options').length).toBe(2);
        expect(domainSelect.props('label')).toBe('Tipo de inversor');
    });

    it('emite String e Micro preservando a caixa exata', async () => {
        const wrapper = mountInverterType();
        const domainSelect = wrapper.findComponent(MaxDomainSelect);

        domainSelect.vm.$emit('update:modelValue', 'String');
        domainSelect.vm.$emit('change', 'String');
        await wrapper.vm.$nextTick();

        expect(wrapper.emitted('update:modelValue')).toEqual([['String']]);
        expect(wrapper.emitted('change')).toEqual([['String']]);

        domainSelect.vm.$emit('update:modelValue', 'Micro');
        domainSelect.vm.$emit('change', 'Micro');
        await wrapper.vm.$nextTick();

        expect(wrapper.emitted('update:modelValue')).toEqual([['String'], ['Micro']]);
    });

    it('emite clear quando o seletor é limpo', async () => {
        const wrapper = mountInverterType({ clearable: true, modelValue: 'Micro' });
        const domainSelect = wrapper.findComponent(MaxDomainSelect);

        domainSelect.vm.$emit('clear');
        await wrapper.vm.$nextTick();

        expect(wrapper.emitted('clear')).toBeDefined();
    });
});
