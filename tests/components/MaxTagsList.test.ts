import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import { watch } from 'vue';
import { contrastColor } from '@maxvue/max-use';

// `watchTrue` (alias de `whenever` do VueUse) é importado por `@maxvue/max-use`, que em teste
// resolve para o pacote irmão `../MaxUse/src` — uma árvore `node_modules` própria, com sua
// PRÓPRIA cópia física de `vue` (ver package.json de MaxUse). Isso cria duas instâncias de Vue
// reativas distintas: um `ref` criado aqui (com a `vue` de MaxComponentsUi) nunca notifica um
// `watch` registrado com a `vue` de dentro de MaxUse, então `watchTrue` nunca dispara em teste
// (bug de ambiente de teste, não do componente — em produção há uma única cópia de `vue`).
// Mockamos para usar o `watch` local e conseguir exercitar o fluxo de adicionar tag.
vi.mock('@maxvue/max-use', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@maxvue/max-use')>();
    return {
        ...actual,
        watchTrue: (source: any, cb: any) => watch(source, (val) => { if (val) cb(val); }, { immediate: false })
    };
});

import MaxTagsList from '../../src/components/MaxTagsList.vue';

const TagSelectStub = {
    name: 'MaxTagSelect',
    template: '<div class="tag-select-stub"><slot name="btn-right" /></div>',
    props: ['modelValue', 'options', 'noDropdown', 'uppercase', 'isButton', 'icon', 'iconSize', 'flex'],
    emits: ['update:modelValue']
};

function mountTagsList(props: Record<string, any> = {}) {
    return mount(MaxTagsList, {
        props,
        global: {
            stubs: {
                MaxTagSelect: TagSelectStub,
                MaxIconButton: true
            }
        }
    });
}

const options = [
    { value: 'a', name: 'Tag A' },
    { value: 'b', name: 'Tag B' },
    { value: 'c', name: 'Tag C' }
];

describe('MaxTagsList', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('renderiza corretamente', () => {
        const wrapper = mountTagsList({ modelValue: [options[0]], options });
        expect(wrapper.exists()).toBe(true);
    });

    it('renderiza um MaxTagSelect por item do model, mais um extra para adicionar', () => {
        const wrapper = mountTagsList({ modelValue: [options[0], options[1]], options });
        const tagSelects = wrapper.findAllComponents(TagSelectStub);
        // 2 itens + 1 "adicionar"
        expect(tagSelects.length).toBe(3);
    });

    it('com model vazio, renderiza apenas o MaxTagSelect de adicionar', () => {
        const wrapper = mountTagsList({ modelValue: [], options });
        const tagSelects = wrapper.findAllComponents(TagSelectStub);
        expect(tagSelects.length).toBe(1);
    });

    it('adicionar um item selecionando no "tag select de adicionar" atualiza o model e emite change', async () => {
        const wrapper = mountTagsList({ modelValue: [options[0]], options });

        const tagSelects = wrapper.findAllComponents(TagSelectStub);
        const addSelect = tagSelects[tagSelects.length - 1];
        await addSelect.vm.$emit('update:modelValue', options[1]);
        await wrapper.vm.$nextTick();

        const vm = wrapper.vm as any;
        expect(vm.model).toEqual([options[0], options[1]]);
        expect(wrapper.emitted('change')).toBeTruthy();
        expect(wrapper.emitted('change')?.pop()).toEqual([[options[0], options[1]]]);
        // add_tag é resetado após o processamento
        expect(vm.add_tag).toBe(null);
    });

    it('não adiciona um item já existente na lista (evita duplicata)', async () => {
        const wrapper = mountTagsList({ modelValue: [options[0]], options });

        const tagSelects = wrapper.findAllComponents(TagSelectStub);
        const addSelect = tagSelects[tagSelects.length - 1];
        await addSelect.vm.$emit('update:modelValue', options[0]);
        await wrapper.vm.$nextTick();

        const vm = wrapper.vm as any;
        expect(vm.model).toEqual([options[0]]);
        expect(wrapper.emitted('change')).toBeFalsy();
    });

    it('remover um item (removeItem) atualiza o model e emite change, sem afetar outros itens', async () => {
        const wrapper = mountTagsList({ modelValue: [options[0], options[1], options[2]], options });
        const vm = wrapper.vm as any;

        // Usa o item tal como existe no estado reativo do componente (Vue envolve
        // arrays/objetos de props em proxies reativos, então a referência não é
        // igual ao objeto bruto original de `options`).
        vm.removeItem(vm.items_array[1]);
        await wrapper.vm.$nextTick();

        expect(vm.model).toEqual([options[0], options[2]]);
        expect(wrapper.emitted('change')?.pop()).toEqual([[options[0], options[2]]]);
    });

    it('clicar no botão de remover (.max-tag-remove-action) remove o item correspondente', async () => {
        const wrapper = mountTagsList({ modelValue: [options[0], options[1]], options });
        const removeButtons = wrapper.findAll('.max-tag-remove-action');
        expect(removeButtons.length).toBe(2);

        await removeButtons[0].trigger('click');
        await wrapper.vm.$nextTick();

        const vm = wrapper.vm as any;
        expect(vm.model).toEqual([options[1]]);
        expect(wrapper.emitted('change')?.pop()).toEqual([[options[1]]]);
    });

    it('renderiza o botão de remoção com o ícone e dimensionamento adequados', () => {
        const wrapper = mountTagsList({ modelValue: [options[0]], options });
        const removeButton = wrapper.find('.max-tag-remove-action');
        expect(removeButton.exists()).toBe(true);

        const iconButton = wrapper.findComponent({ name: 'MaxIconButton' });
        expect(iconButton.exists()).toBe(true);
        expect(iconButton.props('i')).toBe('material-symbols:close-rounded');
        expect(iconButton.props('size')).toBe('1.2');
        expect(iconButton.props('color')).toBeDefined();
    });

    it('botão de remoção recebe a cor de contraste calculada da tag', () => {
        const customOption = { value: 'custom-tag', name: 'Custom Tag', background_color: '#3b82f6' };
        const wrapper = mountTagsList({ modelValue: [customOption], options: [customOption] });
        const iconButton = wrapper.findComponent({ name: 'MaxIconButton' });

        expect(iconButton.exists()).toBe(true);
        expect(iconButton.props('color')).toBe(contrastColor('#3b82f6'));
    });

    it('substituir um item (replaceItem) troca o item na posição correta sem duplicar', async () => {
        const wrapper = mountTagsList({ modelValue: [options[0], options[1]], options });
        const vm = wrapper.vm as any;

        vm.replaceItem(vm.items_array[0], options[2].value);
        await wrapper.vm.$nextTick();

        expect(vm.model).toEqual([options[2], options[1]]);
        expect(vm.model.length).toBe(2);
        expect(wrapper.emitted('change')?.pop()).toEqual([[options[2], options[1]]]);
    });

    it('replaceItem não faz nada se o valor de destino já existir em outra posição (evita duplicata)', async () => {
        const wrapper = mountTagsList({ modelValue: [options[0], options[1]], options });
        const vm = wrapper.vm as any;

        vm.replaceItem(vm.items_array[0], options[1].value);
        await wrapper.vm.$nextTick();

        expect(vm.model).toEqual([options[0], options[1]]);
        expect(wrapper.emitted('change')).toBeFalsy();
    });

    it('model aceita um array como formato de entrada', () => {
        const wrapper = mountTagsList({ modelValue: [options[0], options[1]], options });
        const vm = wrapper.vm as any;
        expect(vm.items_array).toEqual([options[0], options[1]]);
    });

    it('model aceita um objeto (Record<string, any>) como formato de entrada', () => {
        const modelObj = { first: options[0], second: options[1] };
        const wrapper = mountTagsList({ modelValue: modelObj, options });
        const vm = wrapper.vm as any;
        expect(vm.items_array).toEqual([options[0], options[1]]);
    });

    it('options aceita tanto array quanto objeto (options_array normaliza ambos)', () => {
        const optionsObj = { first: options[0], second: options[1] };
        const wrapper = mountTagsList({ modelValue: [], options: optionsObj });
        const vm = wrapper.vm as any;
        expect(vm.options_array).toEqual([options[0], options[1]]);
    });

    it('count exposto via defineExpose reflete o tamanho correto do array de itens', () => {
        const wrapper = mountTagsList({ modelValue: [options[0], options[1], options[2]], options });
        expect((wrapper.vm as any).count).toBe(3);
    });

    it('count reflete 0 quando o model está vazio', () => {
        const wrapper = mountTagsList({ modelValue: [], options });
        expect((wrapper.vm as any).count).toBe(0);
    });
});
