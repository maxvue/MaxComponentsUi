import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxInputDiscount from '../../src/components/MaxInputDiscount.vue';
import InputBase from '../../src/components/InputBase.vue';

function mountInputDiscount(props: Record<string, any> = {}, attrs: Record<string, any> = {}) {
    return mount(MaxInputDiscount, {
        props: { ...props },
        attrs
    });
}

describe('MaxInputDiscount', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('renderiza corretamente com InputBase e input nativo', () => {
        const wrapper = mountInputDiscount();
        expect(wrapper.exists()).toBe(true);
        const input = wrapper.find('input');
        expect(input.exists()).toBe(true);
        expect(input.classes()).toContain('max-input-native');
    });

    it('inicializa com tipo percent e máscara da direita para a esquerda', async () => {
        const wrapper = mountInputDiscount({
            gross: 100,
            type_discount: 'percent',
            modelValue: 0
        });

        const input = wrapper.find('input');
        // Ao digitar '5' -> '0,5 %'
        await input.trigger('keydown', { key: '5' });
        expect(input.element.value).toContain('0,5');

        // Ao digitar '3' -> '5,3 %'
        await input.trigger('keydown', { key: '3' });
        expect(input.element.value).toContain('5,3');
        expect(wrapper.emitted('update:modelValue')?.[1]).toEqual([5.3]);
    });

    it('calcula o preço corretamente em modo percent: price = gross - (gross * discount / 100)', async () => {
        const wrapper = mountInputDiscount({
            gross: 200,
            type_discount: 'percent',
            modelValue: 10
        });

        // 10% de 200 = 20, price = 180
        expect(wrapper.emitted('update:price')?.[0]).toEqual([180]);
    });

    it('inicializa com tipo currency e máscara da direita para a esquerda (2 casas)', async () => {
        const wrapper = mountInputDiscount({
            gross: 500,
            type_discount: 'currency',
            modelValue: 0
        });

        const input = wrapper.find('input');
        // Digita 1 -> R$ 0,01
        await input.trigger('keydown', { key: '1' });
        expect(input.element.value).toContain('0,01');

        // Digita 4 -> R$ 0,14
        await input.trigger('keydown', { key: '4' });
        expect(input.element.value).toContain('0,14');

        // Digita 0 -> R$ 1,40
        await input.trigger('keydown', { key: '0' });
        expect(input.element.value).toContain('1,40');

        // Digita 0 -> R$ 14,00
        await input.trigger('keydown', { key: '0' });
        expect(input.element.value).toContain('14,00');
        expect(wrapper.emitted('update:modelValue')?.slice(-1)[0]).toEqual([14]);
    });

    it('calcula o preço corretamente em modo currency: price = gross - discount', async () => {
        const wrapper = mountInputDiscount({
            gross: 250,
            type_discount: 'currency',
            modelValue: 50
        });

        // price = 250 - 50 = 200
        expect(wrapper.emitted('update:price')?.[0]).toEqual([200]);
    });

    it('suporta aliases startValue para gross e endValue para price', () => {
        const wrapper = mountInputDiscount({
            startValue: 300,
            type_discount: 'currency',
            discount: 30
        });

        expect(wrapper.emitted('update:price')?.[0]).toEqual([270]);
    });

    it('sincroniza bidirecionalmente quando price muda externamente', async () => {
        const wrapper = mountInputDiscount({
            gross: 200,
            type_discount: 'percent',
            modelValue: 0
        });

        // Atualiza a prop price para 160 -> desconto deve virar 20%
        await wrapper.setProps({ price: 160 });
        expect(wrapper.emitted('update:modelValue')?.slice(-1)[0]).toEqual([20]);
    });

    it('alterna o tipo e converte o valor equivalente ao clicar no símbolo', async () => {
        const wrapper = mountInputDiscount({
            gross: 200,
            type_discount: 'percent',
            modelValue: 10
        });

        // 10% de 200 = R$ 20,00
        const symbolBtn = wrapper.find('.max-discount-symbol');
        expect(symbolBtn.exists()).toBe(true);
        expect(symbolBtn.text()).toBe('%');

        // Clica para alternar para currency
        await symbolBtn.trigger('click');
        expect(wrapper.emitted('update:type_discount')?.[0]).toEqual(['currency']);

        const input = wrapper.find('input');
        expect(input.element.value).toContain('20,00');
        expect(wrapper.find('.max-discount-symbol').text()).toBe('R$');
    });

    it('no modo auto comuta para percent ao teclar % e para currency ao teclar $ ou R', async () => {
        const wrapper = mountInputDiscount({
            gross: 1000,
            type_discount: 'auto',
            modelValue: 0
        });

        const input = wrapper.find('input');

        // Tecla R -> comuta para currency
        await input.trigger('keydown', { key: 'R' });
        expect(wrapper.find('.max-discount-symbol').text()).toBe('R$');

        // Tecla % -> comuta para percent
        await input.trigger('keydown', { key: '%' });
        expect(wrapper.find('.max-discount-symbol').text()).toBe('%');
    });

    it('valida limites: ativa erro se exceder max_percent ou max_discount', async () => {
        const wrapper = mountInputDiscount({
            gross: 100,
            max_percent: 20,
            type_discount: 'percent',
            modelValue: 25,
            error_message: 'Desconto acima do limite permitido'
        });

        const ib = wrapper.findComponent(InputBase);
        expect(ib.props('error')).toBe('Desconto acima do limite permitido');
    });

    it('se passar noMessage, respeita a prioridade e oculta mensagem mesmo com erro', async () => {
        const wrapper = mountInputDiscount({
            gross: 100,
            max_percent: 20,
            type_discount: 'percent',
            modelValue: 30,
            error_message: 'Erro',
            noMessage: true
        });

        const ib = wrapper.findComponent(InputBase);
        expect(ib.props('noMessage')).toBe(true);
    });

    it('se não passar error_message e houver erro, exibe apenas erro visual com noMessage true por padrão', async () => {
        const wrapper = mountInputDiscount({
            gross: 100,
            max_percent: 15,
            type_discount: 'percent',
            modelValue: 20
        });

        const ib = wrapper.findComponent(InputBase);
        expect(ib.props('error')).toBe(true);
        expect(ib.props('noMessage')).toBe(true);
    });

    it('apaga dígitos com Backspace e limpa com Delete', async () => {
        const wrapper = mountInputDiscount({
            gross: 100,
            type_discount: 'percent',
            modelValue: 0
        });

        const input = wrapper.find('input');
        await input.trigger('keydown', { key: '5' });
        await input.trigger('keydown', { key: '3' });
        expect(input.element.value).toContain('5,3');

        // Backspace apaga o '3' -> buffer '5' -> '0,5 %'
        await input.trigger('keydown', { key: 'Backspace' });
        expect(input.element.value).toContain('0,5');

        // Delete limpa tudo
        await input.trigger('keydown', { key: 'Delete' });
        expect(input.element.value).toContain('0,0');
    });

    it('calcula max_percent automaticamente se apenas max_discount for passado', () => {
        const wrapper = mountInputDiscount({
            gross: 500,
            max_discount: 50,
            type_discount: 'percent'
        });

        const vm = wrapper.vm as any;
        // 50 / 500 = 10%
        expect(vm.effectiveMaxPercent).toBe(10);
    });

    it('calcula max_discount automaticamente se apenas max_percent for passado', () => {
        const wrapper = mountInputDiscount({
            gross: 400,
            max_percent: 25,
            type_discount: 'currency'
        });

        const vm = wrapper.vm as any;
        // 25% de 400 = 100
        expect(vm.effectiveMaxDiscount).toBe(100);
    });

    it('desabilita o campo e o botão de alternância quando disabled=true', async () => {
        const wrapper = mountInputDiscount({
            gross: 100,
            disabled: true,
            modelValue: 10,
            type_discount: 'percent'
        });

        const input = wrapper.find('input');
        expect(input.attributes('disabled')).toBeDefined();

        const btn = wrapper.find('.max-discount-symbol');
        expect(btn.attributes('disabled')).toBeDefined();

        await btn.trigger('click');
        // Não deve alternar
        expect(wrapper.emitted('update:type_discount')).toBeUndefined();
    });
});
