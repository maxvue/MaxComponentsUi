import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxInputMonitoringAuthType from '../../src/components/MaxInputMonitoringAuthType.vue';
import MaxDomainSelect from '../../src/components/base/MaxDomainSelect.vue';
import { MONITORING_AUTH_TYPE_OPTIONS } from '../../src/constants/monitoringInputs';

function mountMonitoringAuthType(props: Record<string, any> = {}, attrs: Record<string, any> = {}) {
    return mount(MaxInputMonitoringAuthType, {
        props: { modelValue: null, ...props },
        attrs
    });
}

describe('MaxInputMonitoringAuthType (I07)', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('renderiza MaxDomainSelect com as 4 opções de modelo de autenticação', () => {
        const wrapper = mountMonitoringAuthType();
        const domainSelect = wrapper.findComponent(MaxDomainSelect);

        expect(domainSelect.exists()).toBe(true);
        expect(domainSelect.props('options')).toEqual(MONITORING_AUTH_TYPE_OPTIONS);
        expect(domainSelect.props('options').length).toBe(4);
        expect(domainSelect.props('label')).toBe('Tipo de autenticação');
    });

    it('emite tipo de autenticação no update:modelValue e change', async () => {
        const wrapper = mountMonitoringAuthType();
        const domainSelect = wrapper.findComponent(MaxDomainSelect);

        domainSelect.vm.$emit('update:modelValue', 'oauth2_redirect');
        domainSelect.vm.$emit('change', 'oauth2_redirect');
        await wrapper.vm.$nextTick();

        expect(wrapper.emitted('update:modelValue')).toEqual([['oauth2_redirect']]);
        expect(wrapper.emitted('change')).toEqual([['oauth2_redirect']]);
    });

    it('emite clear quando o seletor é limpo', async () => {
        const wrapper = mountMonitoringAuthType({ clearable: true, modelValue: 'python_automation' });
        const domainSelect = wrapper.findComponent(MaxDomainSelect);

        domainSelect.vm.$emit('clear');
        await wrapper.vm.$nextTick();

        expect(wrapper.emitted('clear')).toBeDefined();
    });
});
