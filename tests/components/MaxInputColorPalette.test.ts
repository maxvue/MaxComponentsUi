import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxInputColorPalette from '../../src/components/MaxInputColorPalette.vue';
import MaxButton from '../../src/components/MaxButton.vue';
import MaxIconButton from '../../src/components/MaxIconButton.vue';
import type { ColorPaletteItem } from '../../src/types/specializedInputs';

function mountColorPalette(props: Record<string, any> = {}, attrs: Record<string, any> = {}) {
    return mount(MaxInputColorPalette, {
        props: { modelValue: [], ...props },
        attrs
    });
}

describe('MaxInputColorPalette (I14)', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('renderiza com lista vazia e rótulo padrão', () => {
        const wrapper = mountColorPalette();
        expect(wrapper.exists()).toBe(true);
        expect(wrapper.text()).toContain('Paleta de cores');
        expect(wrapper.findAll('.palette-item-row').length).toBe(0);
    });

    it('adiciona nova cor imutavelmente ao clicar no botão Adicionar cor', async () => {
        const initialList: ColorPaletteItem[] = Object.freeze([
            Object.freeze({ color: '#FF0000', details: 'Vermelho de destaque' })
        ]) as any;

        const wrapper = mountColorPalette({ modelValue: initialList });
        const addBtn = wrapper.findComponent(MaxButton);

        await addBtn.trigger('click');

        const emitted = wrapper.emitted('update:modelValue')!;
        expect(emitted).toBeDefined();
        const nextList = emitted[0][0] as ColorPaletteItem[];
        expect(nextList.length).toBe(2);
        expect(nextList[1]).toEqual({ color: '#000000', details: '' });
        // Garante que o array original não foi mutado
        expect(initialList.length).toBe(1);
    });

    it('remove cor imutavelmente ao clicar no botão de remoção', async () => {
        const initialList: ColorPaletteItem[] = Object.freeze([
            Object.freeze({ color: '#FF0000', details: 'Primeira' }),
            Object.freeze({ color: '#00FF00', details: 'Segunda' })
        ]) as any;

        const wrapper = mountColorPalette({ modelValue: initialList });
        const removeButtons = wrapper.findAllComponents(MaxIconButton);
        expect(removeButtons.length).toBe(2);

        await removeButtons[0].trigger('click');

        const emitted = wrapper.emitted('update:modelValue')!;
        expect(emitted).toBeDefined();
        const nextList = emitted[0][0] as ColorPaletteItem[];
        expect(nextList.length).toBe(1);
        expect(nextList[0].color).toBe('#00FF00');
    });

    it('sinaliza erro de validação quando hexadecimal é inválido', () => {
        const wrapper = mountColorPalette({
            modelValue: [{ color: 'invalido', details: 'Cor quebrada' }]
        });

        expect(wrapper.text()).toContain('formato hexadecimal inválido');
    });

    it('exige pelo menos uma cor quando required=true e lista está vazia', () => {
        const wrapper = mountColorPalette({ required: true, modelValue: [] });
        expect(wrapper.text()).toContain('Pelo menos uma cor é obrigatória');
    });

    it('duas instâncias funcionam de forma independente sem compartilhar estado', async () => {
        const wrapper1 = mountColorPalette({ modelValue: [{ color: '#111111', details: 'Tema 1' }] });
        const wrapper2 = mountColorPalette({ modelValue: [{ color: '#222222', details: 'Tema 2' }] });

        expect(wrapper1.findAll('.palette-item-row').length).toBe(1);
        expect(wrapper2.findAll('.palette-item-row').length).toBe(1);

        const addBtn1 = wrapper1.findComponent(MaxButton);
        await addBtn1.trigger('click');

        expect(wrapper1.emitted('update:modelValue')).toBeDefined();
        expect(wrapper2.emitted('update:modelValue')).toBeUndefined();
    });
});
