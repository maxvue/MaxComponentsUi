import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxInputWireSize from '../../src/components/MaxInputWireSize.vue';
import MaxDomainSelect from '../../src/components/base/MaxDomainSelect.vue';
import { WIRE_SIZE_OPTIONS } from '../../src/constants/electricalInputs';

function mountWireSize(props: Record<string, any> = {}, attrs: Record<string, any> = {}) {
    return mount(MaxInputWireSize, {
        props: { modelValue: null, ...props },
        attrs
    });
}

describe('MaxInputWireSize (D02)', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('renderiza MaxDomainSelect com 24 opções de bitola e busca ativa por padrão', () => {
        const wrapper = mountWireSize();
        const domainSelect = wrapper.findComponent(MaxDomainSelect);

        expect(domainSelect.exists()).toBe(true);
        expect(domainSelect.props('options')).toEqual(WIRE_SIZE_OPTIONS);
        expect(domainSelect.props('options').length).toBe(24);
        expect(domainSelect.props('label')).toBe('Seção do condutor');
        expect(domainSelect.props('filter')).toBe(true);
    });

    it('formata seções decimais em pt-BR com sufixo mm²', () => {
        const opt05 = WIRE_SIZE_OPTIONS.find((opt) => opt.value === 0.5);
        expect(opt05?.label).toBe('0,5 mm²');

        const opt25 = WIRE_SIZE_OPTIONS.find((opt) => opt.value === 2.5);
        expect(opt25?.label).toBe('2,5 mm²');

        const opt1000 = WIRE_SIZE_OPTIONS.find((opt) => opt.value === 1000);
        expect(opt1000?.label).toBe('1000 mm²');
    });

    it('emite valor numérico no update:modelValue ao selecionar bitola', async () => {
        const wrapper = mountWireSize();
        const domainSelect = wrapper.findComponent(MaxDomainSelect);

        domainSelect.vm.$emit('update:modelValue', 2.5);
        domainSelect.vm.$emit('change', 2.5);
        await wrapper.vm.$nextTick();

        expect(wrapper.emitted('update:modelValue')).toEqual([[2.5]]);
        expect(wrapper.emitted('change')).toEqual([[2.5]]);
    });

    it('emite null no update:modelValue ao limpar', async () => {
        const wrapper = mountWireSize({ modelValue: 4, clearable: true });
        const domainSelect = wrapper.findComponent(MaxDomainSelect);

        domainSelect.vm.$emit('update:modelValue', null);
        domainSelect.vm.$emit('change', null);
        domainSelect.vm.$emit('clear');
        await wrapper.vm.$nextTick();

        expect(wrapper.emitted('update:modelValue')).toEqual([[null]]);
        expect(wrapper.emitted('clear')).toBeDefined();
    });
});
