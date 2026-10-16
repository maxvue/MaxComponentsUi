import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxBaseQuantity from '../../src/components/base/MaxBaseQuantity.vue';
import InputBase from '../../src/components/InputBase.vue';

function mountQuantity(props: Record<string, any> = {}, attrs: Record<string, any> = {}) {
    return mount(MaxBaseQuantity, {
        props: { modelValue: null, ...props },
        attrs
    });
}

describe('MaxBaseQuantity', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('renderiza corretamente', () => {
        const wrapper = mountQuantity();
        expect(wrapper.exists()).toBe(true);
    });

    it('utiliza classe max-input-native e estrutura interna limpa', () => {
        const wrapper = mountQuantity();
        const input = wrapper.find('input');
        expect(input.classes()).toContain('max-input-native');
        expect(input.classes()).toContain('max-quantity-input');
    });

    it('não emite update:modelValue no mount', () => {
        const wrapper = mountQuantity({ modelValue: 25 });
        expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    });

    it('aceita zero como valor legítimo', () => {
        const wrapper = mountQuantity({ modelValue: 0, min: 0 });
        const input = wrapper.find('input');
        expect((input.element as HTMLInputElement).value).toBe('0');
        expect(wrapper.findComponent(InputBase).props('error')).toBeFalsy();
    });

    it('emite update:modelValue ao digitar número válido', async () => {
        const wrapper = mountQuantity({ modelValue: 10 });
        const input = wrapper.find('input');
        await input.setValue('45');

        expect(wrapper.emitted('update:modelValue')).toBeTruthy();
        const emitted = wrapper.emitted('update:modelValue')!;
        expect(emitted[emitted.length - 1]).toEqual([45]);
    });

    it('emite número parseado ao digitar formato decimal pt-BR com vírgula e milhar', async () => {
        const wrapper = mountQuantity({ modelValue: 0 });
        const input = wrapper.find('input');
        await input.setValue('1.250,50');

        expect(wrapper.emitted('update:modelValue')).toBeTruthy();
        const emitted = wrapper.emitted('update:modelValue')!;
        expect(emitted[emitted.length - 1]).toEqual([1250.5]);
    });

    it('rejeita formato ponto decimal falso pt-BR (ex: 1.5) e não emite modelo inválido', async () => {
        const wrapper = mountQuantity({ modelValue: 10 });
        const input = wrapper.find('input');
        await input.setValue('1.5');

        const emitted = wrapper.emitted('update:modelValue') ?? [];
        expect(emitted.length).toBe(0);
        expect(wrapper.text()).toContain('Use vírgula para casas decimais');
    });

    it('emite null ao limpar o input', async () => {
        const wrapper = mountQuantity({ modelValue: 100 });
        const input = wrapper.find('input');
        await input.setValue('');

        expect(wrapper.emitted('update:modelValue')).toBeTruthy();
        const emitted = wrapper.emitted('update:modelValue')!;
        expect(emitted[emitted.length - 1]).toEqual([null]);
    });

    it('rejeita caracteres não numéricos sem emitir novo valor', async () => {
        const wrapper = mountQuantity({ modelValue: 50 });
        const input = wrapper.find('input');
        await input.setValue('abc');

        expect(wrapper.emitted('update:modelValue')).toBeUndefined();
        expect(wrapper.text()).toContain('Valor contém caracteres inválidos');
    });

    it('valida limites mínimo e máximo', async () => {
        const wrapper = mountQuantity({ modelValue: 10, min: 5, max: 20 });
        const input = wrapper.find('input');

        await input.setValue('3');
        expect(wrapper.emitted('update:modelValue')).toBeUndefined();
        expect(wrapper.text()).toContain('Valor mínimo permitido é 5');

        await input.setValue('25');
        expect(wrapper.emitted('update:modelValue')).toBeUndefined();
        expect(wrapper.text()).toContain('Valor máximo permitido é 20');

        await input.setValue('15');
        const emitted = wrapper.emitted('update:modelValue')!;
        expect(emitted[emitted.length - 1]).toEqual([15]);
    });

    it('rejeita frações quando integer=true', async () => {
        const wrapper = mountQuantity({ modelValue: 10, integer: true });
        const input = wrapper.find('input');
        await input.setValue('10,5');

        expect(wrapper.emitted('update:modelValue')).toBeUndefined();
        expect(wrapper.text()).toContain('Valores decimais não são permitidos');
    });

    it('renderiza prefix e suffix fora do input nativo', () => {
        const wrapper = mountQuantity({ modelValue: 50, prefix: 'R$', suffix: 'kg' });
        const prefix = wrapper.find('.max-quantity-prefix');
        const suffix = wrapper.find('.max-quantity-suffix');
        expect(prefix.exists()).toBe(true);
        expect(prefix.text()).toBe('R$');
        expect(suffix.exists()).toBe(true);
        expect(suffix.text()).toBe('kg');
        const input = wrapper.find('input');
        expect((input.element as HTMLInputElement).value).toBe('50');
    });

    it('atualiza valor exibido quando modelValue muda externamente sem eco', async () => {
        const wrapper = mountQuantity({ modelValue: 10 });
        const input = wrapper.find('input');
        expect((input.element as HTMLInputElement).value).toBe('10');

        await wrapper.setProps({ modelValue: 99 });
        expect((input.element as HTMLInputElement).value).toBe('99');
    });

    it('exibe modelo inicial inválido sem corrigi-lo silenciosamente', () => {
        const wrapper = mountQuantity({ modelValue: 150, max: 100 });
        const input = wrapper.find('input');
        expect((input.element as HTMLInputElement).value).toBe('150');
        expect(wrapper.text()).toContain('Valor máximo permitido é 100');
        expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    });

    it('erro externo repassado via prop tem precedência', () => {
        const wrapper = mountQuantity({ modelValue: 10, error: 'Erro customizado externo' });
        expect(wrapper.findComponent(InputBase).props('error')).toBe('Erro customizado externo');
    });
});
