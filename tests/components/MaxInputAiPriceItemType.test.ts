import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxInputAiPriceItemType from '../../src/components/MaxInputAiPriceItemType.vue';
import MaxDomainSelect from '../../src/components/base/MaxDomainSelect.vue';
import { AI_PRICE_ITEM_TYPE_OPTIONS } from '../../src/constants/aiInputs';

function mountAiPriceItemType(props: Record<string, any> = {}, attrs: Record<string, any> = {}) {
    return mount(MaxInputAiPriceItemType, {
        props: { modelValue: null, ...props },
        attrs
    });
}

describe('MaxInputAiPriceItemType (I11)', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('renderiza MaxDomainSelect com as 35 opções canônicas de tipo de item de preço de IA', () => {
        const wrapper = mountAiPriceItemType();
        const domainSelect = wrapper.findComponent(MaxDomainSelect);

        expect(domainSelect.exists()).toBe(true);
        expect(domainSelect.props('options')).toEqual(AI_PRICE_ITEM_TYPE_OPTIONS);
        expect(domainSelect.props('options').length).toBe(35);
        expect(domainSelect.props('label')).toBe('Modalidade de preço de IA');

        // Confere que valores canônicos chave estão presentes
        const values = AI_PRICE_ITEM_TYPE_OPTIONS.map((o) => o.value);
        expect(values).toContain('global');
        expect(values).toContain('text');
        expect(values).toContain('embedding');
        expect(values).toContain('speech_to_speech');
        expect(values).toContain('lip_sync');
    });

    it('emite código de modalidade canônica no update:modelValue e change', async () => {
        const wrapper = mountAiPriceItemType();
        const domainSelect = wrapper.findComponent(MaxDomainSelect);

        domainSelect.vm.$emit('update:modelValue', 'image_upscale');
        domainSelect.vm.$emit('change', 'image_upscale');
        await wrapper.vm.$nextTick();

        expect(wrapper.emitted('update:modelValue')).toEqual([['image_upscale']]);
        expect(wrapper.emitted('change')).toEqual([['image_upscale']]);
    });

    it('emite clear quando o seletor é limpo', async () => {
        const wrapper = mountAiPriceItemType({ clearable: true, modelValue: 'tts' });
        const domainSelect = wrapper.findComponent(MaxDomainSelect);

        domainSelect.vm.$emit('clear');
        await wrapper.vm.$nextTick();

        expect(wrapper.emitted('clear')).toBeDefined();
    });
});
