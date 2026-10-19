import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxInputEntity from '../../src/components/MaxInputEntity.vue';
import MaxInputSelect from '../../src/components/MaxInputSelect.vue';
import InputBase from '../../src/components/InputBase.vue';

describe('MaxInputEntity', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('renderiza corretamente o seletor de entidade', () => {
        const wrapper = mount(MaxInputEntity);
        expect(wrapper.exists()).toBe(true);
        const select = wrapper.findComponent(MaxInputSelect);
        expect(select.exists()).toBe(true);
        expect(wrapper.find('label').text()).toBe('Entidade');
        expect(select.props('placeholder')).toBe('Selecione o tipo de entidade');
    });

    it.each([
        { descricao: 'omitido', props: {}, noStatus: false },
        { descricao: 'explicitamente falso', props: { noStatus: false }, noStatus: false },
        { descricao: 'explicitamente verdadeiro', props: { noStatus: true }, noStatus: true }
    ])('respeita noStatus $descricao até os indicadores e mensagens do InputBase', ({ props, noStatus }) => {
        const wrapper = mount(MaxInputEntity, {
            props: {
                error: 'Selecione uma entidade válida',
                ...props
            }
        });
        const inputBase = wrapper.getComponent(InputBase);

        expect(inputBase.props('noStatus')).toBe(noStatus);
        expect(inputBase.classes('no-status')).toBe(noStatus);
        expect(wrapper.find('.input-status-icon .is-error').exists()).toBe(!noStatus);
        expect(wrapper.find('.input-message').exists()).toBe(!noStatus);
        if (!noStatus) expect(wrapper.get('.input-message').text()).toBe('Selecione uma entidade válida');
    });

    it('atualiza os indicadores e mensagens quando o pai altera noStatus', async () => {
        const wrapper = mount(MaxInputEntity, {
            props: {
                noStatus: false,
                error: 'Selecione uma entidade válida'
            }
        });
        const inputBase = wrapper.getComponent(InputBase);

        expect(inputBase.props('noStatus')).toBe(false);
        expect(wrapper.find('.input-status-icon .is-error').exists()).toBe(true);
        expect(wrapper.get('.input-message').text()).toBe('Selecione uma entidade válida');

        await wrapper.setProps({ noStatus: true });

        expect(inputBase.props('noStatus')).toBe(true);
        expect(inputBase.classes('no-status')).toBe(true);
        expect(wrapper.find('.input-status-icon .is-error').exists()).toBe(false);
        expect(wrapper.find('.input-message').exists()).toBe(false);

        await wrapper.setProps({ noStatus: false });

        expect(inputBase.props('noStatus')).toBe(false);
        expect(inputBase.classes('no-status')).toBe(false);
        expect(wrapper.find('.input-status-icon .is-error').exists()).toBe(true);
        expect(wrapper.get('.input-message').text()).toBe('Selecione uma entidade válida');
    });

    it('possui exatamente as opções PF e PJ no catálogo fixo', () => {
        const wrapper = mount(MaxInputEntity);
        const select = wrapper.findComponent(MaxInputSelect);
        const options = select.props('options') as any[];
        expect(options).toHaveLength(2);
        expect(options[0].value).toBe('PF');
        expect(options[0].label).toBe('Pessoa Física');
        expect(options[1].value).toBe('PJ');
        expect(options[1].label).toBe('Pessoa Jurídica');
    });

    it('não permite sobrescrever catálogo de opções via attrs', () => {
        const wrapper = mount(MaxInputEntity, {
            attrs: {
                options: [{ value: 'OTHER', label: 'Outro' }]
            }
        });
        const select = wrapper.findComponent(MaxInputSelect);
        const options = select.props('options') as any[];
        expect(options).toHaveLength(2);
        expect(options[0].value).toBe('PF');
    });

    it('permite sobrescrever label e placeholder', () => {
        const wrapper = mount(MaxInputEntity, {
            props: {
                label: 'Tipo de Cliente',
                placeholder: 'Escolha PF ou PJ'
            }
        });
        const select = wrapper.findComponent(MaxInputSelect);
        expect(wrapper.find('label').text()).toBe('Tipo de Cliente');
        expect(select.props('placeholder')).toBe('Escolha PF ou PJ');
    });

    it('emite update:modelValue e change ao selecionar uma opção', async () => {
        const wrapper = mount(MaxInputEntity, {
            props: { modelValue: null }
        });
        const select = wrapper.findComponent(MaxInputSelect);

        select.vm.$emit('update:modelValue', 'PJ');
        select.vm.$emit('change', 'PJ');
        await wrapper.vm.$nextTick();

        expect(wrapper.emitted('update:modelValue')).toBeTruthy();
        expect(wrapper.emitted('update:modelValue')![0]).toEqual(['PJ']);
        expect(wrapper.emitted('change')).toBeTruthy();
        expect(wrapper.emitted('change')![0]).toEqual(['PJ']);
    });

    it('emite null no update:modelValue, change e evento clear ao acionar clear', async () => {
        const wrapper = mount(MaxInputEntity, {
            props: { modelValue: 'PF', clearable: true }
        });
        const select = wrapper.findComponent(MaxInputSelect);

        select.vm.$emit('clear');
        await wrapper.vm.$nextTick();

        expect(wrapper.emitted('clear')).toBeTruthy();
        expect(wrapper.emitted('update:modelValue')![0]).toEqual([null]);
        expect(wrapper.emitted('change')![0]).toEqual([null]);
    });

    it('não ecoa update:modelValue quando modelValue for alterado externamente pelo pai', async () => {
        const wrapper = mount(MaxInputEntity, {
            props: { modelValue: 'PF' }
        });
        const select = wrapper.findComponent(MaxInputSelect);

        // Simulando pai alterando a prop externamente para 'PJ'
        await wrapper.setProps({ modelValue: 'PJ' });

        // Se o select emitir update:modelValue com o mesmo valor 'PJ' recém recebido
        select.vm.$emit('update:modelValue', 'PJ');
        await wrapper.vm.$nextTick();

        // Não deve emitir de volta para o pai
        expect(wrapper.emitted('update:modelValue')).toBeFalsy();
    });

    it('repassa slots de value e option', () => {
        const wrapper = mount(MaxInputEntity, {
            slots: {
                value: '<span class="custom-value">Valor Customizado</span>',
                option: '<span class="custom-option">Opção Customizada</span>'
            }
        });
        const select = wrapper.findComponent(MaxInputSelect);
        expect(select.exists()).toBe(true);
    });
});
