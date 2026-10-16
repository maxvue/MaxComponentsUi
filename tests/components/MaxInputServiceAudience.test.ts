import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxInputServiceAudience from '../../src/components/MaxInputServiceAudience.vue';
import MaxDomainSelect from '../../src/components/base/MaxDomainSelect.vue';
import { SERVICE_AUDIENCE_OPTIONS } from '../../src/constants/serviceInputs';

function mountServiceAudience(props: Record<string, any> = {}, attrs: Record<string, any> = {}) {
    return mount(MaxInputServiceAudience, {
        props: { modelValue: null, ...props },
        attrs
    });
}

describe('MaxInputServiceAudience (I05)', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('renderiza MaxDomainSelect com as 4 opções de público do serviço', () => {
        const wrapper = mountServiceAudience();
        const domainSelect = wrapper.findComponent(MaxDomainSelect);

        expect(domainSelect.exists()).toBe(true);
        expect(domainSelect.props('options')).toEqual(SERVICE_AUDIENCE_OPTIONS);
        expect(domainSelect.props('options').length).toBe(4);
        expect(domainSelect.props('label')).toBe('Público do serviço');
    });

    it('emite nobody como valor válido distinto de null', async () => {
        const wrapper = mountServiceAudience();
        const domainSelect = wrapper.findComponent(MaxDomainSelect);

        domainSelect.vm.$emit('update:modelValue', 'nobody');
        domainSelect.vm.$emit('change', 'nobody');
        await wrapper.vm.$nextTick();

        expect(wrapper.emitted('update:modelValue')).toEqual([['nobody']]);
        expect(wrapper.emitted('change')).toEqual([['nobody']]);
    });

    it('emite clear quando o seletor é limpo', async () => {
        const wrapper = mountServiceAudience({ clearable: true, modelValue: 'both' });
        const domainSelect = wrapper.findComponent(MaxDomainSelect);

        domainSelect.vm.$emit('clear');
        await wrapper.vm.$nextTick();

        expect(wrapper.emitted('clear')).toBeDefined();
    });
});
