import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxInputMonthOccurrence from '../../src/components/MaxInputMonthOccurrence.vue';
import MaxDomainSelect from '../../src/components/base/MaxDomainSelect.vue';
import { MONTH_OCCURRENCE_OPTIONS } from '../../src/constants/editorialInputs';

function mountMonthOccurrence(props: Record<string, any> = {}, attrs: Record<string, any> = {}) {
    return mount(MaxInputMonthOccurrence, {
        props: { modelValue: null, ...props },
        attrs
    });
}

describe('MaxInputMonthOccurrence (D09)', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('renderiza MaxDomainSelect com as 5 ocorrências de 1ª a 5ª', () => {
        const wrapper = mountMonthOccurrence();
        const domainSelect = wrapper.findComponent(MaxDomainSelect);

        expect(domainSelect.exists()).toBe(true);
        expect(domainSelect.props('options')).toEqual(MONTH_OCCURRENCE_OPTIONS);
        expect(domainSelect.props('options').length).toBe(5);
        expect(domainSelect.props('label')).toBe('Ocorrência no mês');
    });

    it('garante que a 5ª ocorrência não possui rótulo "Último"', () => {
        const fifthOpt = MONTH_OCCURRENCE_OPTIONS.find((opt) => opt.value === 5);
        expect(fifthOpt?.label).toBe('5ª ocorrência');
        expect(fifthOpt?.label.toLowerCase()).not.toContain('último');
        expect(fifthOpt?.label.toLowerCase()).not.toContain('ultimo');
    });

    it('emite valor numérico 1 a 5 no update:modelValue ao selecionar', async () => {
        const wrapper = mountMonthOccurrence();
        const domainSelect = wrapper.findComponent(MaxDomainSelect);

        domainSelect.vm.$emit('update:modelValue', 5);
        domainSelect.vm.$emit('change', 5);
        await wrapper.vm.$nextTick();

        expect(wrapper.emitted('update:modelValue')).toEqual([[5]]);
        expect(wrapper.emitted('change')).toEqual([[5]]);
    });
});
