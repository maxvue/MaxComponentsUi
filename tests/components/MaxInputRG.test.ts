import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxInputRG from '../../src/components/MaxInputRG.vue';

function mountRG(props: Record<string, any> = {}) {
    return mount(MaxInputRG, {
        props: {
            modelValue: '',
            ...props
        }
    });
}

describe('MaxInputRG', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('renderiza o input básico de RG com placeholder padrão', () => {
        const wrapper = mountRG();
        expect(wrapper.exists()).toBe(true);
        const input = wrapper.find('.max-rg-number');
        expect(input.exists()).toBe(true);
        expect(input.attributes('placeholder')).toBe('00.000.000-0');
    });

    it('renderiza campos de emissor e UF quando habilitados via props', () => {
        const wrapper = mountRG({
            showIssuer: true,
            showUf: true
        });
        expect(wrapper.find('.max-rg-issuer').exists()).toBe(true);
        expect(wrapper.find('.max-rg-uf').exists()).toBe(true);
    });

    it('suporta modelo em formato de objeto com number, issuer e uf', () => {
        const wrapper = mountRG({
            showIssuer: true,
            showUf: true,
            modelValue: {
                number: '12.345.678-9',
                issuer: 'SSP',
                uf: 'SP'
            }
        });
        const numInput = wrapper.find('.max-rg-number').element as HTMLInputElement;
        const issInput = wrapper.find('.max-rg-issuer').element as HTMLInputElement;
        const ufInput = wrapper.find('.max-rg-uf').element as HTMLInputElement;

        expect(numInput.value).toBe('12.345.678-9');
        expect(issInput.value).toBe('SSP');
        expect(ufInput.value).toBe('SP');
    });

    it('emite update:modelValue ao digitar no campo de número', async () => {
        const wrapper = mountRG();
        const input = wrapper.find('.max-rg-number');
        await input.setValue('12.345.678-0');
        await input.trigger('input');

        const emitted = wrapper.emitted('update:modelValue');
        expect(emitted).toBeTruthy();
        expect(emitted![0][0]).toBe('12.345.678-0');
    });
});
