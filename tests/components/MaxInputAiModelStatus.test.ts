import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxInputAiModelStatus from '../../src/components/MaxInputAiModelStatus.vue';
import MaxDomainSelect from '../../src/components/base/MaxDomainSelect.vue';
import { AI_MODEL_STATUS_OPTIONS } from '../../src/constants/aiInputs';

function mountAiModelStatus(props: Record<string, any> = {}, attrs: Record<string, any> = {}) {
    return mount(MaxInputAiModelStatus, {
        props: { modelValue: null, ...props },
        attrs
    });
}

describe('MaxInputAiModelStatus (I10)', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('renderiza MaxDomainSelect com as 3 opções de situação de modelo', () => {
        const wrapper = mountAiModelStatus();
        const domainSelect = wrapper.findComponent(MaxDomainSelect);

        expect(domainSelect.exists()).toBe(true);
        expect(domainSelect.props('options')).toEqual(AI_MODEL_STATUS_OPTIONS);
        expect(domainSelect.props('options').length).toBe(3);
        expect(domainSelect.props('label')).toBe('Situação do modelo');
    });

    it('emite status de modelo no update:modelValue e change', async () => {
        const wrapper = mountAiModelStatus();
        const domainSelect = wrapper.findComponent(MaxDomainSelect);

        domainSelect.vm.$emit('update:modelValue', 'approved');
        domainSelect.vm.$emit('change', 'approved');
        await wrapper.vm.$nextTick();

        expect(wrapper.emitted('update:modelValue')).toEqual([['approved']]);
        expect(wrapper.emitted('change')).toEqual([['approved']]);
    });

    it('emite clear quando o seletor é limpo', async () => {
        const wrapper = mountAiModelStatus({ clearable: true, modelValue: 'pending' });
        const domainSelect = wrapper.findComponent(MaxDomainSelect);

        domainSelect.vm.$emit('clear');
        await wrapper.vm.$nextTick();

        expect(wrapper.emitted('clear')).toBeDefined();
    });
});
