import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxBadgeButtonsGroup from '../../src/components/MaxBadgeButtonsGroup.vue';
import type { MaxBadgeButtonsGroupItem } from '../../src/components/MaxBadgeButtonsGroup.vue';

function mountBadgeButtonsGroup(props: Record<string, any> = {}) {
    return mount(MaxBadgeButtonsGroup, {
        props,
        global: {
            stubs: {
                MaxIcon: {
                    template: '<span class="max-icon"></span>'
                }
            }
        }
    });
}

const mockItems: MaxBadgeButtonsGroupItem[] = [
    { label: 'Todos', value: 'all', id: 1 },
    { label: 'Pendentes', value: 'pending', id: 2, color: 'var(--yellow-600)' },
    { label: 'Concluídos', value: 'completed', id: 3, color: 'var(--green-600)' }
];

describe('MaxBadgeButtonsGroup', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('renderiza os itens fornecidos como botões', () => {
        const wrapper = mountBadgeButtonsGroup({
            items: mockItems
        });

        const buttons = wrapper.findAll('button.max-badge-button');
        expect(buttons).toHaveLength(3);
        expect(wrapper.text()).toContain('Todos');
        expect(wrapper.text()).toContain('Pendentes');
        expect(wrapper.text()).toContain('Concluídos');
    });

    it('aplica espaçamento gap configurável no container', () => {
        const wrapper = mountBadgeButtonsGroup({
            items: mockItems,
            gap: '1rem'
        });

        const container = wrapper.find('.max-badge-buttons-group');
        expect(container.attributes('style')).toContain('gap: 1rem');
    });

    it('permite selecionar apenas 1 item por padrão (onlyOne: true)', async () => {
        const wrapper = mountBadgeButtonsGroup({
            items: mockItems,
            modelValue: []
        });

        const buttons = wrapper.findAll('button.max-badge-button');

        // Clica no primeiro item
        await buttons[0].trigger('click');
        expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([['all']]);

        // Atualiza prop simulando v-model
        await wrapper.setProps({ modelValue: ['all'] });

        // Clica no segundo item: deve substituir a seleção
        await buttons[1].trigger('click');
        expect(wrapper.emitted('update:modelValue')?.[1]).toEqual([['pending']]);
    });

    it('permite selecionar múltiplos itens quando onlyOne for false', async () => {
        const wrapper = mountBadgeButtonsGroup({
            items: mockItems,
            onlyOne: false,
            modelValue: ['all']
        });

        const buttons = wrapper.findAll('button.max-badge-button');

        // Clica no segundo item mantendo o primeiro
        await buttons[1].trigger('click');
        expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([['all', 'pending']]);
    });

    it('permite desmarcar item por padrão (allowEmpty: true)', async () => {
        const wrapper = mountBadgeButtonsGroup({
            items: mockItems,
            modelValue: ['pending']
        });

        const buttons = wrapper.findAll('button.max-badge-button');

        // Clica no item já selecionado
        await buttons[1].trigger('click');
        expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([[]]);
    });

    it('impede desmarcar o último item quando allowEmpty for false', async () => {
        const wrapper = mountBadgeButtonsGroup({
            items: mockItems,
            allowEmpty: false,
            modelValue: ['pending']
        });

        const buttons = wrapper.findAll('button.max-badge-button');

        // Clica no item já selecionado
        await buttons[1].trigger('click');

        // Não deve emitir nova desmarcação vazia
        expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    });

    it('retorna objetos completos quando returnObject for true', async () => {
        const wrapper = mountBadgeButtonsGroup({
            items: mockItems,
            returnObject: true,
            modelValue: []
        });

        const buttons = wrapper.findAll('button.max-badge-button');
        await buttons[0].trigger('click');

        const emitted = wrapper.emitted('update:modelValue')?.[0]?.[0];
        expect(emitted).toEqual([mockItems[0]]);
    });

    it('extrai propriedade customizada especificada por returnValue (ex: "id")', async () => {
        const wrapper = mountBadgeButtonsGroup({
            items: mockItems,
            returnValue: 'id',
            modelValue: []
        });

        const buttons = wrapper.findAll('button.max-badge-button');
        await buttons[1].trigger('click');

        expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([[2]]);
    });

    it('inicializa com valor default quando modelValue não for fornecido', () => {
        const wrapper = mountBadgeButtonsGroup({
            items: mockItems,
            default: 'pending'
        });

        expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([['pending']]);
    });

    it('dispara eventos e callbacks OnSelect e OnClick com dados enriquecidos', async () => {
        const onSelect = vi.fn();
        const onClick = vi.fn();

        const wrapper = mountBadgeButtonsGroup({
            items: mockItems,
            modelValue: [],
            onSelect,
            onClick
        });

        const buttons = wrapper.findAll('button.max-badge-button');
        await buttons[1].trigger('click');

        // Evento e callback onClick
        expect(wrapper.emitted('click')?.[0]?.[0]).toEqual(mockItems[1]);
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(onClick.mock.calls[0][0]).toEqual(mockItems[1]);
        expect(onClick.mock.calls[0][1]).toBeInstanceOf(MouseEvent);

        // Evento e callback onSelect
        expect(wrapper.emitted('select')?.[0]?.[0]).toEqual([mockItems[1]]);
        expect(wrapper.emitted('select')?.[0]?.[1]).toEqual(['pending']);
        expect(onSelect).toHaveBeenCalledTimes(1);
        expect(onSelect.mock.calls[0][0]).toEqual([mockItems[1]]);
        expect(onSelect.mock.calls[0][1]).toEqual(['pending']);
    });

    it('não permite cliques quando o grupo estiver disabled', async () => {
        const onClick = vi.fn();
        const wrapper = mountBadgeButtonsGroup({
            items: mockItems,
            disabled: true,
            onClick
        });

        const buttons = wrapper.findAll('button.max-badge-button');
        await buttons[0].trigger('click');

        expect(wrapper.emitted('update:modelValue')).toBeUndefined();
        expect(onClick).not.toHaveBeenCalled();
    });

    it('respeita item individual com disabled: true', async () => {
        const itemsWithDisabled: MaxBadgeButtonsGroupItem[] = [
            { label: 'Item Ativo', value: 'active' },
            { label: 'Item Desabilitado', value: 'disabled', disabled: true }
        ];

        const wrapper = mountBadgeButtonsGroup({
            items: itemsWithDisabled
        });

        const buttons = wrapper.findAll('button.max-badge-button');
        expect(buttons[1].attributes('disabled')).toBeDefined();

        await buttons[1].trigger('click');
        expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    });

    it('atualiza botões ativos quando modelValue é modificado externamente', async () => {
        const wrapper = mountBadgeButtonsGroup({
            items: mockItems,
            modelValue: ['all']
        });

        const buttons = wrapper.findAll('button.max-badge-button');
        expect(buttons[0].classes()).toContain('is-active');
        expect(buttons[1].classes()).not.toContain('is-active');

        await wrapper.setProps({ modelValue: ['completed'] });

        expect(buttons[0].classes()).not.toContain('is-active');
        expect(buttons[2].classes()).toContain('is-active');
    });

    it('suporta atributos kebab-case como only-one e return-object', async () => {
        const wrapper = mountBadgeButtonsGroup({
            items: mockItems,
            'only-one': false,
            'return-object': true
        });

        const buttons = wrapper.findAll('button.max-badge-button');
        await buttons[0].trigger('click');
        await buttons[1].trigger('click');

        expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([[mockItems[0]]]);
        expect(wrapper.emitted('update:modelValue')?.[1]).toEqual([[mockItems[0], mockItems[1]]]);
    });
});

