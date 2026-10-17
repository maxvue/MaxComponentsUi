import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxInputRagSourceType from '../../src/components/MaxInputRagSourceType.vue';
import MaxDomainSelect from '../../src/components/base/MaxDomainSelect.vue';
import { RAG_SOURCE_TYPE_OPTIONS } from '../../src/constants/aiInputs';

function mountRagSourceType(props: Record<string, any> = {}, attrs: Record<string, any> = {}) {
    return mount(MaxInputRagSourceType, {
        props: { modelValue: null, ...props },
        attrs
    });
}

describe('MaxInputRagSourceType (I13)', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('renderiza MaxDomainSelect com as 4 opções de tipo de fonte RAG', () => {
        const wrapper = mountRagSourceType();
        const domainSelect = wrapper.findComponent(MaxDomainSelect);

        expect(domainSelect.exists()).toBe(true);
        expect(domainSelect.props('options')).toEqual(RAG_SOURCE_TYPE_OPTIONS);
        expect(domainSelect.props('options').length).toBe(4);
        expect(domainSelect.props('label')).toBe('Tipo de fonte RAG');
    });

    it('emite tipo de fonte no update:modelValue e change ao selecionar mysql', async () => {
        const wrapper = mountRagSourceType();
        const domainSelect = wrapper.findComponent(MaxDomainSelect);

        domainSelect.vm.$emit('update:modelValue', 'mysql');
        domainSelect.vm.$emit('change', 'mysql');
        await wrapper.vm.$nextTick();

        expect(wrapper.emitted('update:modelValue')).toEqual([['mysql']]);
        expect(wrapper.emitted('change')).toEqual([['mysql']]);
    });

    it('emite clear quando o seletor é limpo', async () => {
        const wrapper = mountRagSourceType({ clearable: true, modelValue: 'document' });
        const domainSelect = wrapper.findComponent(MaxDomainSelect);

        domainSelect.vm.$emit('clear');
        await wrapper.vm.$nextTick();

        expect(wrapper.emitted('clear')).toBeDefined();
    });
});
