import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxInputMonitoringCredentialFlow from '../../src/components/MaxInputMonitoringCredentialFlow.vue';
import MaxDomainSelect from '../../src/components/base/MaxDomainSelect.vue';
import { MONITORING_CREDENTIAL_FLOW_OPTIONS } from '../../src/constants/monitoringInputs';

function mountMonitoringCredentialFlow(props: Record<string, any> = {}, attrs: Record<string, any> = {}) {
    return mount(MaxInputMonitoringCredentialFlow, {
        props: { modelValue: null, ...props },
        attrs
    });
}

describe('MaxInputMonitoringCredentialFlow (I08)', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('renderiza MaxDomainSelect com as 3 opções de fluxo de credencial', () => {
        const wrapper = mountMonitoringCredentialFlow();
        const domainSelect = wrapper.findComponent(MaxDomainSelect);

        expect(domainSelect.exists()).toBe(true);
        expect(domainSelect.props('options')).toEqual(MONITORING_CREDENTIAL_FLOW_OPTIONS);
        expect(domainSelect.props('options').length).toBe(3);
        expect(domainSelect.props('label')).toBe('Fluxo de credencial');
    });

    it('emite fluxo de credencial no update:modelValue e change', async () => {
        const wrapper = mountMonitoringCredentialFlow();
        const domainSelect = wrapper.findComponent(MaxDomainSelect);

        domainSelect.vm.$emit('update:modelValue', 'oauth_flow');
        domainSelect.vm.$emit('change', 'oauth_flow');
        await wrapper.vm.$nextTick();

        expect(wrapper.emitted('update:modelValue')).toEqual([['oauth_flow']]);
        expect(wrapper.emitted('change')).toEqual([['oauth_flow']]);
    });

    it('emite clear quando o seletor é limpo', async () => {
        const wrapper = mountMonitoringCredentialFlow({ clearable: true, modelValue: 'direct' });
        const domainSelect = wrapper.findComponent(MaxDomainSelect);

        domainSelect.vm.$emit('clear');
        await wrapper.vm.$nextTick();

        expect(wrapper.emitted('clear')).toBeDefined();
    });
});
