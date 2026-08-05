import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxPhoneField from '../../src/components/MaxPhoneField.vue';

function mountPhoneField(props: Record<string, any> = {}, attrs: Record<string, any> = {}) {
    return mount(MaxPhoneField, {
        props: { modelValue: '', ...props },
        attrs,
        global: {
            stubs: {
                MaxInputSelect: {
                    template: '<div class="max-input-select-stub"><slot name="value" :value="modelValue" /></div>',
                    props: ['modelValue', 'options']
                }
            }
        }
    });
}

describe('MaxPhoneField', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('renderiza corretamente sem PrimeVue', () => {
        const wrapper = mountPhoneField();
        expect(wrapper.exists()).toBe(true);
        expect(wrapper.html()).not.toContain('data-pc-name');
    });

    it('aplica DDI correto pelo modelValue com 2 digitos (55)', async () => {
        const wrapper = mountPhoneField({ modelValue: '5511999999999' });
        await wrapper.vm.$nextTick();
        const country = (wrapper.vm as any).country;
        expect(country.ddi).toBe(55);
        expect((wrapper.vm as any).phone).toBe('(11) 9 9999 - 9999');
    });

    it('aplica DDI correto pelo modelValue com 1 digito (ex: 1 EUA)', async () => {
        const wrapper = mountPhoneField({ modelValue: '18005551234' });
        await wrapper.vm.$nextTick();
        const country = (wrapper.vm as any).country;
        expect(country.ddi).toBe(1);
        expect((wrapper.vm as any).phone).toBe('8005551234');
    });

    it('aplica DDI default se o código for desconhecido (ex: 999)', async () => {
        const wrapper = mountPhoneField({ modelValue: '999123456' });
        await wrapper.vm.$nextTick();
        const country = (wrapper.vm as any).country;
        expect(country.ddi).toBe(55);
        expect((wrapper.vm as any).phone).toBe('(99) 9 1234 - 56');
    });

    it('limpa campos se modelValue vier vazio ou undefined', async () => {
        const wrapper = mountPhoneField({ modelValue: '5511999999999' });
        await wrapper.setProps({ modelValue: '' });
        expect((wrapper.vm as any).phone).toBe('');
    });

    it('não faz nada se o novo modelValue for o mesmo que temp_value', async () => {
        const wrapper = mountPhoneField({ modelValue: '5511999999999' });
        await wrapper.setProps({ modelValue: '5511999999999' });
        expect((wrapper.vm as any).phone).toBe('(11) 9 9999 - 9999');
    });

    it('remove "0" inicial no watch do phone', async () => {
        const wrapper = mountPhoneField({ modelValue: '5511999999999' });
        (wrapper.vm as any).phone = '01199999999';
        await wrapper.vm.$nextTick();
        expect((wrapper.vm as any).phone).toBe('(11) 9 9999 - 999');
    });

    it('computa maskValue para default % se country !== 55', async () => {
        const wrapper = mountPhoneField({ modelValue: '18005551234' });
        await wrapper.vm.$nextTick();
        const mask = (wrapper.vm as any).maskValue.mask;
        expect(mask).toBe('%');
    });

    it('computa maskValue de telefone fixo ou 8 dígitos se não tiver 9º digito', async () => {
        const wrapper = mountPhoneField({ modelValue: '551144445555' });
        await wrapper.vm.$nextTick();
        const mask = (wrapper.vm as any).maskValue.mask;
        expect(mask).toBe('(##) #### - ####$$');
    });

    it('computa maskValue celular (9 dígitos)', async () => {
        const wrapper = mountPhoneField({ modelValue: '5511999999999' });
        await wrapper.vm.$nextTick();
        const mask = (wrapper.vm as any).maskValue.mask;
        expect(mask).toBe('(##) 9 #### - ####$$');
    });

    it('testa noMask quando ctrl+v é acionado', async () => {
        const wrapper = mountPhoneField();
        (wrapper.vm as any).onFocus = true;
        (wrapper.vm as any).noMask = true;
        await wrapper.vm.$nextTick();

        const mask = (wrapper.vm as any).maskValue.mask;
        expect(mask).toBe('$$$$$$$$$$$$$$$$$$$$$$$$$$$$$');
    });
});
