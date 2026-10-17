import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxInputOccupation from '../../src/components/MaxInputOccupation.vue';
import MaxDomainSelect from '../../src/components/base/MaxDomainSelect.vue';
import { OCCUPATION_OPTIONS } from '../../src/constants/financingInputs';

function mountOccupation(props: Record<string, any> = {}, attrs: Record<string, any> = {}) {
    return mount(MaxInputOccupation, {
        props: { modelValue: null, ...props },
        attrs
    });
}

describe('MaxInputOccupation (I01)', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('renderiza MaxDomainSelect com as 7 opções padrão de ocupação e rótulo padrão', () => {
        const wrapper = mountOccupation();
        const domainSelect = wrapper.findComponent(MaxDomainSelect);

        expect(domainSelect.exists()).toBe(true);
        expect(domainSelect.props('options')).toEqual(OCCUPATION_OPTIONS);
        expect(domainSelect.props('options').length).toBe(7);
        expect(domainSelect.props('label')).toBe('Ocupação');
    });

    it('permite sobrescrever opções via prop options e aceita lista vazia []', () => {
        const customOptions = [
            { value: 'MEDICO', label: 'Médico', name: 'Médico' },
            { value: 'ADVOGADO', label: 'Advogado', name: 'Advogado' }
        ];
        const wrapperCustom = mountOccupation({ options: customOptions });
        const selectCustom = wrapperCustom.findComponent(MaxDomainSelect);
        expect(selectCustom.props('options')).toEqual(customOptions);

        const wrapperEmpty = mountOccupation({ options: [] });
        const selectEmpty = wrapperEmpty.findComponent(MaxDomainSelect);
        expect(selectEmpty.props('options')).toEqual([]);
    });

    it('emite código de ocupação no update:modelValue e change ao selecionar', async () => {
        const wrapper = mountOccupation();
        const domainSelect = wrapper.findComponent(MaxDomainSelect);

        domainSelect.vm.$emit('update:modelValue', 'CLT');
        domainSelect.vm.$emit('change', 'CLT');
        await wrapper.vm.$nextTick();

        expect(wrapper.emitted('update:modelValue')).toEqual([['CLT']]);
        expect(wrapper.emitted('change')).toEqual([['CLT']]);
    });

    it('emite clear quando o seletor é limpo', async () => {
        const wrapper = mountOccupation({ clearable: true, modelValue: 'AUTONOMO' });
        const domainSelect = wrapper.findComponent(MaxDomainSelect);

        domainSelect.vm.$emit('clear');
        await wrapper.vm.$nextTick();

        expect(wrapper.emitted('clear')).toBeDefined();
    });
});
