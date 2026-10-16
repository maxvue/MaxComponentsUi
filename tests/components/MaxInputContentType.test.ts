import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxInputContentType from '../../src/components/MaxInputContentType.vue';
import MaxDomainSelect from '../../src/components/base/MaxDomainSelect.vue';
import { CONTENT_TYPE_OPTIONS } from '../../src/constants/editorialInputs';

function mountContentType(props: Record<string, any> = {}, attrs: Record<string, any> = {}) {
    return mount(MaxInputContentType, {
        props: { modelValue: null, ...props },
        attrs
    });
}

describe('MaxInputContentType (D10)', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('renderiza MaxDomainSelect com as 5 opções de tipo de conteúdo base', () => {
        const wrapper = mountContentType();
        const domainSelect = wrapper.findComponent(MaxDomainSelect);

        expect(domainSelect.exists()).toBe(true);
        expect(domainSelect.props('options')).toEqual(CONTENT_TYPE_OPTIONS);
        expect(domainSelect.props('options').length).toBe(5);
        expect(domainSelect.props('label')).toBe('Tipo de conteúdo base');
    });

    it('emite código do tipo de conteúdo no update:modelValue ao selecionar', async () => {
        const wrapper = mountContentType();
        const domainSelect = wrapper.findComponent(MaxDomainSelect);

        domainSelect.vm.$emit('update:modelValue', 'pdf');
        domainSelect.vm.$emit('change', 'pdf');
        await wrapper.vm.$nextTick();

        expect(wrapper.emitted('update:modelValue')).toEqual([['pdf']]);
        expect(wrapper.emitted('change')).toEqual([['pdf']]);
    });
});
