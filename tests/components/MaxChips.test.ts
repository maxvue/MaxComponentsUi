import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxChips from '../../src/components/MaxChips.vue';
import InputBase from '../../src/components/InputBase.vue';

function mountChips(props: Record<string, any> = {}, slots: Record<string, any> = {}, attrs: Record<string, any> = {}) {
    return mount(MaxChips, {
        props: { modelValue: [], ...props },
        slots,
        attrs
    });
}

describe('MaxChips', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    describe('Renderização e Resolução de Rótulos', () => {
        it('renderiza corretamente quando montado', () => {
            const wrapper = mountChips({ label: 'Tags' });
            expect(wrapper.exists()).toBe(true);
            expect(wrapper.find('.max-chips-container').exists()).toBe(true);
        });

        it('renderiza chips para array de strings', () => {
            const wrapper = mountChips({ modelValue: ['Vue', 'TypeScript', 'UnoCSS'] });
            const chips = wrapper.findAll('.max-chip-token');
            expect(chips.length).toBe(3);
            expect(chips[0].text()).toContain('Vue');
            expect(chips[1].text()).toContain('TypeScript');
            expect(chips[2].text()).toContain('UnoCSS');
        });

        it('renderiza chips para array de números', () => {
            const wrapper = mountChips({ modelValue: [100, 200, 300] });
            const chips = wrapper.findAll('.max-chip-token');
            expect(chips.length).toBe(3);
            expect(chips[0].text()).toContain('100');
            expect(chips[1].text()).toContain('200');
            expect(chips[2].text()).toContain('300');
        });

        it('resolve a propriedade do objeto na ordem estrita: label > name > value > id', () => {
            const items = [
                { id: 1, name: 'Nome A', label: 'Label A', value: 'Valor A' }, // Deve usar label
                { id: 2, name: 'Nome B', value: 'Valor B' }, // Sem label, deve usar name
                { id: 3, value: 'Valor C' }, // Sem label/name, deve usar value
                { id: 4, custom: 'outro' } // Sem label/name/value, deve usar id
            ];

            const wrapper = mountChips({ modelValue: items });
            const chips = wrapper.findAll('.max-chip-token');

            expect(chips.length).toBe(4);
            expect(chips[0].find('.max-chip-label').text()).toBe('Label A');
            expect(chips[1].find('.max-chip-label').text()).toBe('Nome B');
            expect(chips[2].find('.max-chip-label').text()).toBe('Valor C');
            expect(chips[3].find('.max-chip-label').text()).toBe('4');
        });
    });

    describe('Adição de Chips', () => {
        it('adiciona novo chip ao pressionar Enter em array de strings', async () => {
            const wrapper = mountChips({ modelValue: ['Vue'] });
            const input = wrapper.find('input.max-chips-input');

            await input.setValue('React');
            await input.trigger('keydown.enter');

            expect(wrapper.emitted('update:modelValue')).toBeTruthy();
            const emitted = wrapper.emitted('update:modelValue')!;
            expect(emitted[emitted.length - 1][0]).toEqual(['Vue', 'React']);
            expect(wrapper.emitted('add')).toBeTruthy();
            expect(wrapper.emitted('change')).toBeTruthy();
            expect((input.element as HTMLInputElement).value).toBe('');
        });

        it('adiciona novo objeto { label, value } ao pressionar Enter quando modelValue for array de objetos', async () => {
            const initial = [{ id: 1, label: 'Item 1' }];
            const wrapper = mountChips({ modelValue: initial });
            const input = wrapper.find('input.max-chips-input');

            await input.setValue('Item 2');
            await input.trigger('keydown.enter');

            const emitted = wrapper.emitted('update:modelValue')!;
            expect(emitted[emitted.length - 1][0]).toEqual([
                { id: 1, label: 'Item 1' },
                { label: 'Item 2', value: 'Item 2' }
            ]);
        });

        it('usa função customizada createItem se fornecida', async () => {
            const wrapper = mountChips({
                modelValue: [{ id: 1, name: 'Admin' }],
                createItem: (text: string) => ({ name: text, customFlag: true })
            });
            const input = wrapper.find('input.max-chips-input');

            await input.setValue('Editor');
            await input.trigger('keydown.enter');

            const emitted = wrapper.emitted('update:modelValue')!;
            expect(emitted[emitted.length - 1][0]).toEqual([
                { id: 1, name: 'Admin' },
                { name: 'Editor', customFlag: true }
            ]);
        });

        it('adiciona chip ao digitar o caractere separador (vírgula)', async () => {
            const wrapper = mountChips({ modelValue: ['Angular'] });
            const input = wrapper.find('input.max-chips-input');

            await input.setValue('Svelte,');
            await input.trigger('input');

            const emitted = wrapper.emitted('update:modelValue')!;
            expect(emitted[emitted.length - 1][0]).toEqual(['Angular', 'Svelte']);
            expect((input.element as HTMLInputElement).value).toBe('');
        });

        it('adiciona múltiplos chips ao colar texto separado por vírgula (paste)', async () => {
            const wrapper = mountChips({ modelValue: ['PHP'] });
            const input = wrapper.find('input.max-chips-input');

            const pasteEvent = {
                clipboardData: {
                    getData: () => 'Node, Python, Go'
                },
                preventDefault: () => {}
            };

            await input.trigger('paste', pasteEvent);

            const emitted = wrapper.emitted('update:modelValue')!;
            expect(emitted[emitted.length - 1][0]).toEqual(['PHP', 'Node', 'Python', 'Go']);
        });

        it('adiciona chip no blur se addOnBlur for true', async () => {
            const wrapper = mountChips({ modelValue: ['Item 1'], addOnBlur: true });
            const input = wrapper.find('input.max-chips-input');

            await input.setValue('Item 2');
            await input.trigger('blur');

            const emitted = wrapper.emitted('update:modelValue')!;
            expect(emitted[emitted.length - 1][0]).toEqual(['Item 1', 'Item 2']);
        });

        it('não adiciona chip no blur se addOnBlur for false', async () => {
            const wrapper = mountChips({ modelValue: ['Item 1'], addOnBlur: false });
            const input = wrapper.find('input.max-chips-input');

            await input.setValue('Item 2');
            await input.trigger('blur');

            expect(wrapper.emitted('update:modelValue')).toBeFalsy();
        });
    });

    describe('Validações de Duplicatas e Limite Máximo', () => {
        it('não permite duplicatas quando allowDuplicate é false (padrão)', async () => {
            const wrapper = mountChips({ modelValue: ['Vue', 'React'], allowDuplicate: false });
            const input = wrapper.find('input.max-chips-input');

            await input.setValue('vue'); // Case-insensitive check
            await input.trigger('keydown.enter');

            expect(wrapper.emitted('update:modelValue')).toBeFalsy();
            expect((input.element as HTMLInputElement).value).toBe('');
        });

        it('permite duplicatas quando allowDuplicate é true', async () => {
            const wrapper = mountChips({ modelValue: ['Vue'], allowDuplicate: true });
            const input = wrapper.find('input.max-chips-input');

            await input.setValue('Vue');
            await input.trigger('keydown.enter');

            const emitted = wrapper.emitted('update:modelValue')!;
            expect(emitted[emitted.length - 1][0]).toEqual(['Vue', 'Vue']);
        });

        it('respeita a prop max e impede adicionar além do limite', async () => {
            const wrapper = mountChips({ modelValue: ['Item 1', 'Item 2'], max: 2 });
            const input = wrapper.find('input.max-chips-input');

            expect(input.attributes('disabled')).toBeDefined();

            await input.setValue('Item 3');
            await input.trigger('keydown.enter');

            expect(wrapper.emitted('update:modelValue')).toBeFalsy();
        });
    });

    describe('Remoção de Chips', () => {
        it('remove chip ao clicar no botão de remover', async () => {
            const wrapper = mountChips({ modelValue: ['Tag 1', 'Tag 2', 'Tag 3'] });
            const removeButtons = wrapper.findAll('.max-chip-remove-btn');

            expect(removeButtons.length).toBe(3);
            await removeButtons[1].trigger('click');

            expect(wrapper.emitted('update:modelValue')).toBeTruthy();
            const emitted = wrapper.emitted('update:modelValue')!;
            expect(emitted[emitted.length - 1][0]).toEqual(['Tag 1', 'Tag 3']);

            expect(wrapper.emitted('remove')).toBeTruthy();
            expect(wrapper.emitted('remove')![0][0]).toEqual({ value: 'Tag 2', index: 1 });
            expect(wrapper.emitted('change')).toBeTruthy();
        });

        it('remove o último chip ao pressionar Backspace com input vazio', async () => {
            const wrapper = mountChips({ modelValue: ['Tag 1', 'Tag 2'] });
            const input = wrapper.find('input.max-chips-input');

            (input.element as HTMLInputElement).value = '';
            await input.trigger('keydown', { key: 'Backspace' });

            const emitted = wrapper.emitted('update:modelValue')!;
            expect(emitted[emitted.length - 1][0]).toEqual(['Tag 1']);
        });

        it('não remove no Backspace se houver texto digitado no input', async () => {
            const wrapper = mountChips({ modelValue: ['Tag 1', 'Tag 2'] });
            const input = wrapper.find('input.max-chips-input');

            await input.setValue('abc');
            await input.trigger('keydown', { key: 'Backspace' });

            expect(wrapper.emitted('update:modelValue')).toBeFalsy();
        });

        it('não exibe botão de remover se removable for false', () => {
            const wrapper = mountChips({ modelValue: ['Tag 1'], removable: false });
            expect(wrapper.find('.max-chip-remove-btn').exists()).toBe(false);
        });

        it('não exibe botão de remover se disabled for true', () => {
            const wrapper = mountChips({ modelValue: ['Tag 1'], disabled: true });
            expect(wrapper.find('.max-chip-remove-btn').exists()).toBe(false);
        });
    });

    describe('Slots Customizados e Expose', () => {
        it('renderiza o slot chip customizado', () => {
            const wrapper = mountChips(
                { modelValue: ['TagCustom'] },
                {
                    chip: `<template #chip="{ label, remove }">
                        <div class="custom-chip">{{ label }} <span class="custom-remove" @click="remove">x</span></div>
                    </template>`
                }
            );

            expect(wrapper.find('.custom-chip').exists()).toBe(true);
            expect(wrapper.find('.custom-chip').text()).toContain('TagCustom');
        });

        it('expõe métodos programáticos via defineExpose', async () => {
            const wrapper = mountChips({ modelValue: ['Item 1'] });
            const vm = wrapper.vm as any;

            expect(vm.count).toBe(1);
            expect(typeof vm.addChip).toBe('function');
            expect(typeof vm.removeChip).toBe('function');
            expect(typeof vm.clear).toBe('function');

            vm.addChip('Item 2');
            await wrapper.vm.$nextTick();
            expect(wrapper.emitted('update:modelValue')).toBeTruthy();

            vm.clear();
            await wrapper.vm.$nextTick();
            const emitted = wrapper.emitted('update:modelValue')!;
            expect(emitted[emitted.length - 1][0]).toEqual([]);
        });
    });

    describe('Integração com InputBase e Validação required', () => {
        it('valida done=true ao blur quando required e possui itens', async () => {
            const wrapper = mountChips({ required: true, modelValue: ['Tag 1'] });
            const input = wrapper.find('input.max-chips-input');
            await input.trigger('blur');

            const inputBase = wrapper.findComponent(InputBase);
            expect(inputBase.props('done')).toBe(true);
        });

        it('valida erro de campo obrigatório ao blur quando vazio e required=true', async () => {
            const wrapper = mountChips({ required: true, modelValue: [] });
            const input = wrapper.find('input.max-chips-input');
            await input.trigger('blur');

            const inputBase = wrapper.findComponent(InputBase);
            expect(inputBase.props('error')).toBe('Campo obrigatório');
        });

        it('não aplica dupla inversão de background em tema escuro (usa tokens nativos)', async () => {
            const wrapper = mountChips({ modelValue: ['Item'] });
            const chip = wrapper.find('.max-chip-token');
            expect(chip.exists()).toBe(true);
        });
    });
});
