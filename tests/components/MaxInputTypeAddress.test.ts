import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxInputTypeAddress from '../../src/components/MaxInputTypeAddress.vue';
import MaxInputSelect from '../../src/components/MaxInputSelect.vue';

function mountTypeAddress(props: Record<string, any> = {}, attrs: Record<string, any> = {}) {
    return mount(MaxInputTypeAddress, {
        props: { modelValue: '', ...props },
        attrs,
        global: {
            stubs: {
                MaxInputSelect: true
            }
        }
    });
}

describe('MaxInputTypeAddress', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('renderiza corretamente', () => {
        const wrapper = mountTypeAddress();
        expect(wrapper.exists()).toBe(true);
    });

    it('auto-detecta "Rua" quando street começa com "Rua"', async () => {
        const wrapper = mountTypeAddress({ street: 'Rua das Flores' });
        await wrapper.vm.$nextTick();

        const emitted = wrapper.emitted('update:modelValue');
        expect(emitted?.[0][0]).toBe('Rua');
    });

    it('auto-detecta "Avenida" quando street começa com "Av"', async () => {
        const wrapper = mountTypeAddress({ street: 'Av Paulista' });
        await wrapper.vm.$nextTick();
        expect(wrapper.emitted('update:modelValue')?.[0][0]).toBe('Avenida');
    });

    it('auto-detecta "Praça" com acento (normalização)', async () => {
        const wrapper = mountTypeAddress({ street: 'Praça da Sé' });
        await wrapper.vm.$nextTick();
        expect(wrapper.emitted('update:modelValue')?.[0][0]).toBe('Praça');
    });

    it('não auto-detecta se não encontrar match', async () => {
        const wrapper = mountTypeAddress({ street: 'Desconhecido 123' });
        await wrapper.vm.$nextTick();
        expect(wrapper.emitted('update:modelValue')).toBeFalsy();
    });

    it('não auto-detecta se street for falso (vazio)', async () => {
        const wrapper = mountTypeAddress({ street: '' });
        await wrapper.vm.$nextTick();
        expect(wrapper.emitted('update:modelValue')).toBeFalsy();
    });

    it('não emite update se o valor já for igual', async () => {
        const wrapper = mountTypeAddress({ modelValue: 'Rua', street: 'Rua das Flores' });
        await wrapper.vm.$nextTick();
        // O watch immediate detecta 'Rua', mas if (inputValue.value !== item.value) é falso
        // Não deve emitir (além do possível emit gerado pelo watch inputValue que é inicializado)
        // Actually watch(inputValue) might emit on first bind depending on if it's immediate, but it's not immediate.
        expect(wrapper.emitted('update:modelValue')).toBeFalsy();
    });

    it('detecta mudança de modelValue vindo via prop', async () => {
        const wrapper = mountTypeAddress({ modelValue: '' });
        await wrapper.setProps({ modelValue: 'Avenida' });
        expect((wrapper.vm as any).inputValue).toBe('Avenida');
    });

    it('detecta mudança de inputValue e emite', async () => {
        const wrapper = mountTypeAddress({ modelValue: '' });
        (wrapper.vm as any).inputValue = 'Travessa';
        await wrapper.vm.$nextTick();
        expect(wrapper.emitted('update:modelValue')?.[0][0]).toBe('Travessa');
    });

    it('usa attrs.street se props.street não estiver definido', async () => {
        const wrapper = mountTypeAddress({}, { street: 'Vila Madalena' });
        await wrapper.vm.$nextTick();
        expect(wrapper.emitted('update:modelValue')?.[0][0]).toBe('Vila');
    });
});
