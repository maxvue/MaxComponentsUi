import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxInputWireType from '../../src/components/MaxInputWireType.vue';
import MaxDomainSelect from '../../src/components/base/MaxDomainSelect.vue';
import { WIRE_TYPE_OPTIONS } from '../../src/constants/electricalInputs';

function mountWireType(props: Record<string, any> = {}, attrs: Record<string, any> = {}) {
    return mount(MaxInputWireType, {
        props: { modelValue: null, ...props },
        attrs
    });
}

describe('MaxInputWireType (D03)', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('renderiza MaxDomainSelect com 4 opções combinando material e isolamento', () => {
        const wrapper = mountWireType();
        const domainSelect = wrapper.findComponent(MaxDomainSelect);

        expect(domainSelect.exists()).toBe(true);
        expect(domainSelect.props('options')).toEqual(WIRE_TYPE_OPTIONS);
        expect(domainSelect.props('options').length).toBe(4);
        expect(domainSelect.props('label')).toBe('Material e isolamento');
        expect(domainSelect.props('filter')).toBe(false);
    });

    it('contém opções de cobre e alumínio com 70 °C e 90 °C', () => {
        const values = WIRE_TYPE_OPTIONS.map((opt) => opt.value);
        expect(values).toContain('copper-70');
        expect(values).toContain('copper-90');
        expect(values).toContain('aluminum-70');
        expect(values).toContain('aluminum-90');
    });

    it('emite código de material/isolamento no update:modelValue ao selecionar', async () => {
        const wrapper = mountWireType();
        const domainSelect = wrapper.findComponent(MaxDomainSelect);

        domainSelect.vm.$emit('update:modelValue', 'aluminum-90');
        domainSelect.vm.$emit('change', 'aluminum-90');
        await wrapper.vm.$nextTick();

        expect(wrapper.emitted('update:modelValue')).toEqual([['aluminum-90']]);
        expect(wrapper.emitted('change')).toEqual([['aluminum-90']]);
    });
});
