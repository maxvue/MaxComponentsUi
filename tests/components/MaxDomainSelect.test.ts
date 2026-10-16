import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxDomainSelect from '../../src/components/base/MaxDomainSelect.vue';
import MaxInputSelect from '../../src/components/MaxInputSelect.vue';
import InputBase from '../../src/components/InputBase.vue';
import type { DomainSelectOption } from '../../src/types/domainInputs';

const SAMPLE_OPTIONS: readonly DomainSelectOption<string>[] = Object.freeze([
    { value: 'opt1', label: 'Opção 1', name: 'Opção 1' },
    { value: 'opt2', label: 'Opção 2', name: 'Opção 2' },
    { value: 'opt3', label: 'Opção 3', name: 'Opção 3' }
]);

function mountDomainSelect(props: Record<string, any> = {}, attrs: Record<string, any> = {}, slots: Record<string, any> = {}) {
    return mount(MaxDomainSelect, {
        props: {
            options: SAMPLE_OPTIONS,
            modelValue: null,
            ...props
        },
        attrs,
        slots
    });
}

describe('MaxDomainSelect (adaptador privado)', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('renderiza MaxInputSelect com catálogo e bindings corretos', () => {
        const wrapper = mountDomainSelect({
            label: 'Campo de Teste',
            placeholder: 'Selecione algo',
            filter: true,
            required: true,
            disabled: false
        });

        const select = wrapper.findComponent(MaxInputSelect);
        expect(select.exists()).toBe(true);
        expect(select.props('options')).toEqual(SAMPLE_OPTIONS);
        expect(select.props('optionValue')).toBe('value');
        expect(select.props('optionLabel')).toBe('label');
        expect(wrapper.findComponent(InputBase).props('label')).toBe('Campo de Teste');
        expect(select.props('placeholder')).toBe('Selecione algo');
        expect(select.props('filter')).toBe(true);
        expect(select.props('required')).toBe(true);
    });

    it('filtra atributos reservados e encaminha atributos permitidos', () => {
        const wrapper = mountDomainSelect(
            {},
            {
                id: 'custom-id',
                'data-testid': 'domain-select-test',
                options: [{ value: 'fake', label: 'Fake', name: 'Fake' }],
                'option-value': 'fake-key',
                optionValue: 'fake-key',
                loadOptions: () => {},
                'load-options': () => {},
                default: 'fake-default'
            }
        );

        const select = wrapper.findComponent(MaxInputSelect);
        expect(wrapper.find('.max-select').attributes('id')).toBe('custom-id');
        expect(wrapper.find('[data-testid="domain-select-test"]').exists()).toBe(true);
        // As opções não foram sobrescritas pelo atributo reservado
        expect(select.props('options')).toEqual(SAMPLE_OPTIONS);
        expect(select.props('optionValue')).toBe('value');
    });

    it('ativa isClearable para clearable ou showClear', () => {
        const wrapper1 = mountDomainSelect({ clearable: true });
        expect(wrapper1.findComponent(MaxInputSelect).props('clearable')).toBe(true);

        const wrapper2 = mountDomainSelect({ showClear: true });
        expect(wrapper2.findComponent(MaxInputSelect).props('clearable')).toBe(true);

        const wrapper3 = mountDomainSelect({ clearable: false, showClear: false });
        expect(wrapper3.findComponent(MaxInputSelect).props('clearable')).toBe(false);
    });

    it('não produz eco de update:modelValue quando o pai altera o modelValue', async () => {
        const wrapper = mountDomainSelect({ modelValue: 'opt1' });
        await wrapper.vm.$nextTick();

        // Alteração vinda do pai
        await wrapper.setProps({ modelValue: 'opt2' });
        await wrapper.vm.$nextTick();

        // Não deve emitir de volta ao pai
        expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    });

    it('emite update:modelValue e change ao selecionar uma opção válida', async () => {
        const wrapper = mountDomainSelect({ modelValue: null });
        const select = wrapper.findComponent(MaxInputSelect);

        select.vm.$emit('update:modelValue', 'opt2');
        select.vm.$emit('change', 'opt2');
        await wrapper.vm.$nextTick();

        expect(wrapper.emitted('update:modelValue')).toEqual([['opt2']]);
        expect(wrapper.emitted('change')).toEqual([['opt2']]);
    });

    it('emite null no update:modelValue e evento clear ao limpar seleção', async () => {
        const wrapper = mountDomainSelect({ modelValue: 'opt1' });
        const select = wrapper.findComponent(MaxInputSelect);

        select.vm.$emit('update:modelValue', null);
        select.vm.$emit('change', null);
        select.vm.$emit('clear');
        await wrapper.vm.$nextTick();

        expect(wrapper.emitted('update:modelValue')).toEqual([[null]]);
        expect(wrapper.emitted('change')).toEqual([[null]]);
        expect(wrapper.emitted('clear')).toBeDefined();
    });

    it('trata valores vazios sem disparar erro automático', () => {
        const wrapper1 = mountDomainSelect({ modelValue: null });
        expect(wrapper1.findComponent(MaxInputSelect).props('error')).toBeUndefined();

        const wrapper2 = mountDomainSelect({ modelValue: '' });
        expect(wrapper2.findComponent(MaxInputSelect).props('error')).toBeUndefined();
    });

    it('marca erro local de opção inválida quando o valor é desconhecido e não há erro explícito', () => {
        const wrapper = mountDomainSelect({ modelValue: 'valor-desconhecido' });
        const select = wrapper.findComponent(MaxInputSelect);

        expect(select.props('error')).toBe('Opção selecionada inválida');
        const unknownSpan = wrapper.find('.max-domain-unknown-value');
        expect(unknownSpan.exists()).toBe(true);
        expect(unknownSpan.text()).toBe('valor-desconhecido');
    });

    it('respeita a precedência de erro explícito do consumidor mesmo para valor desconhecido', () => {
        const wrapperFalse = mountDomainSelect({
            modelValue: 'desconhecido',
            error: false
        });
        expect(wrapperFalse.findComponent(MaxInputSelect).props('error')).toBe(false);

        const wrapperCustom = mountDomainSelect({
            modelValue: 'desconhecido',
            error: 'Erro de validação do formulário'
        });
        expect(wrapperCustom.findComponent(MaxInputSelect).props('error')).toBe('Erro de validação do formulário');
    });

    it('suporta slots customizados de value e option', () => {
        const wrapper = mountDomainSelect(
            { modelValue: 'opt1' },
            {},
            {
                value: '<span class="custom-value-slot">Custom Value</span>',
                option: '<span class="custom-option-slot">Custom Option</span>'
            }
        );

        expect(wrapper.find('.custom-value-slot').exists()).toBe(true);
    });

    it('duas instâncias não compartilham estado e mantêm catálogos imutáveis', async () => {
        const wrapper1 = mountDomainSelect({ modelValue: 'opt1' });
        const wrapper2 = mountDomainSelect({ modelValue: 'opt2' });

        expect(wrapper1.findComponent(MaxInputSelect).props('modelValue')).toBe('opt1');
        expect(wrapper2.findComponent(MaxInputSelect).props('modelValue')).toBe('opt2');

        expect(Object.isFrozen(SAMPLE_OPTIONS)).toBe(true);
    });
});
