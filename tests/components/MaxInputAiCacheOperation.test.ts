import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxInputAiCacheOperation from '../../src/components/MaxInputAiCacheOperation.vue';
import MaxDomainSelect from '../../src/components/base/MaxDomainSelect.vue';
import { AI_CACHE_OPERATION_OPTIONS } from '../../src/constants/aiInputs';

function mountAiCacheOperation(props: Record<string, any> = {}, attrs: Record<string, any> = {}) {
    return mount(MaxInputAiCacheOperation, {
        props: { modelValue: null, ...props },
        attrs
    });
}

describe('MaxInputAiCacheOperation (I12)', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('renderiza MaxDomainSelect com as 3 opções de operação de cache', () => {
        const wrapper = mountAiCacheOperation();
        const domainSelect = wrapper.findComponent(MaxDomainSelect);

        expect(domainSelect.exists()).toBe(true);
        expect(domainSelect.props('options')).toEqual(AI_CACHE_OPERATION_OPTIONS);
        expect(domainSelect.props('options').length).toBe(3);
        expect(domainSelect.props('label')).toBe('Operação de cache');
    });

    it('emite operação de cache no update:modelValue e change ao selecionar storage', async () => {
        const wrapper = mountAiCacheOperation();
        const domainSelect = wrapper.findComponent(MaxDomainSelect);

        domainSelect.vm.$emit('update:modelValue', 'storage');
        domainSelect.vm.$emit('change', 'storage');
        await wrapper.vm.$nextTick();

        expect(wrapper.emitted('update:modelValue')).toEqual([['storage']]);
        expect(wrapper.emitted('change')).toEqual([['storage']]);
    });

    it('emite clear quando o seletor é limpo', async () => {
        const wrapper = mountAiCacheOperation({ clearable: true, modelValue: 'write' });
        const domainSelect = wrapper.findComponent(MaxDomainSelect);

        domainSelect.vm.$emit('clear');
        await wrapper.vm.$nextTick();

        expect(wrapper.emitted('clear')).toBeDefined();
    });
});
