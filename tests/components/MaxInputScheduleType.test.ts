import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxInputScheduleType from '../../src/components/MaxInputScheduleType.vue';
import MaxDomainSelect from '../../src/components/base/MaxDomainSelect.vue';
import { SCHEDULE_TYPE_OPTIONS } from '../../src/constants/editorialInputs';

function mountScheduleType(props: Record<string, any> = {}, attrs: Record<string, any> = {}) {
    return mount(MaxInputScheduleType, {
        props: { modelValue: null, ...props },
        attrs
    });
}

describe('MaxInputScheduleType (D08)', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('renderiza MaxDomainSelect com as 4 opções de estratégia de agendamento', () => {
        const wrapper = mountScheduleType();
        const domainSelect = wrapper.findComponent(MaxDomainSelect);

        expect(domainSelect.exists()).toBe(true);
        expect(domainSelect.props('options')).toEqual(SCHEDULE_TYPE_OPTIONS);
        expect(domainSelect.props('options').length).toBe(4);
        expect(domainSelect.props('label')).toBe('Tipo de agendamento');
    });

    it('emite código de tipo de agendamento no update:modelValue ao selecionar', async () => {
        const wrapper = mountScheduleType();
        const domainSelect = wrapper.findComponent(MaxDomainSelect);

        domainSelect.vm.$emit('update:modelValue', 'monthly_nth_weekday');
        domainSelect.vm.$emit('change', 'monthly_nth_weekday');
        await wrapper.vm.$nextTick();

        expect(wrapper.emitted('update:modelValue')).toEqual([['monthly_nth_weekday']]);
        expect(wrapper.emitted('change')).toEqual([['monthly_nth_weekday']]);
    });
});
