import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxInputAiExecutionType from '../../src/components/MaxInputAiExecutionType.vue';
import MaxDomainSelect from '../../src/components/base/MaxDomainSelect.vue';
import { AI_EXECUTION_TYPE_OPTIONS } from '../../src/constants/aiInputs';

function mountAiExecutionType(props: Record<string, any> = {}, attrs: Record<string, any> = {}) {
    return mount(MaxInputAiExecutionType, {
        props: { modelValue: null, ...props },
        attrs
    });
}

describe('MaxInputAiExecutionType (D04)', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('renderiza MaxDomainSelect com opções cloud e local', () => {
        const wrapper = mountAiExecutionType();
        const domainSelect = wrapper.findComponent(MaxDomainSelect);

        expect(domainSelect.exists()).toBe(true);
        expect(domainSelect.props('options')).toEqual(AI_EXECUTION_TYPE_OPTIONS);
        expect(domainSelect.props('options').length).toBe(2);
        expect(domainSelect.props('label')).toBe('Tipo de execução');
    });

    it('emite cloud ou local no update:modelValue', async () => {
        const wrapper = mountAiExecutionType();
        const domainSelect = wrapper.findComponent(MaxDomainSelect);

        domainSelect.vm.$emit('update:modelValue', 'cloud');
        domainSelect.vm.$emit('change', 'cloud');
        await wrapper.vm.$nextTick();

        expect(wrapper.emitted('update:modelValue')).toEqual([['cloud']]);
        expect(wrapper.emitted('change')).toEqual([['cloud']]);
    });
});
