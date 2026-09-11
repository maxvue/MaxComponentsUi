import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxChips from '../../src/components/MaxChips.vue';
import fs from 'node:fs';
import path from 'node:path';

function mountChips(props: Record<string, any> = {}) {
    return mount(MaxChips, {
        props: { modelValue: ['Primeiro', 'Segundo', 'Terceiro'], ...props },
        global: {
            stubs: {
                MaxIcon: {
                    template: '<span class="max-icon-stub"></span>',
                    props: ['icon', 'size']
                }
            }
        }
    });
}

describe('MaxChips - Acessibilidade e Teclado', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('botão de remoção possui tabindex="0" para permitir foco via teclado', () => {
        const wrapper = mountChips();
        const removeBtns = wrapper.findAll('.max-chip-remove-btn');
        expect(removeBtns.length).toBe(3);
        removeBtns.forEach((btn) => {
            expect(btn.attributes('tabindex')).toBe('0');
        });
    });

    it('remove chip ao acionar keydown.enter no botão de remoção', async () => {
        const wrapper = mountChips();
        const removeBtns = wrapper.findAll('.max-chip-remove-btn');
        await removeBtns[1].trigger('keydown.enter');

        const emitted = wrapper.emitted('update:modelValue');
        expect(emitted).toBeTruthy();
        expect(emitted![emitted!.length - 1][0]).toEqual(['Primeiro', 'Terceiro']);
    });

    it('remove chip ao acionar keydown.space no botão de remoção', async () => {
        const wrapper = mountChips();
        const removeBtns = wrapper.findAll('.max-chip-remove-btn');
        await removeBtns[0].trigger('keydown.space');

        const emitted = wrapper.emitted('update:modelValue');
        expect(emitted).toBeTruthy();
        expect(emitted![emitted!.length - 1][0]).toEqual(['Segundo', 'Terceiro']);
    });

    it('botão de remoção possui aria-label contextual com o nome do chip', () => {
        const wrapper = mountChips();
        const removeBtns = wrapper.findAll('.max-chip-remove-btn');
        expect(removeBtns[0].attributes('aria-label')).toBe('Remover Primeiro');
        expect(removeBtns[1].attributes('aria-label')).toBe('Remover Segundo');
        expect(removeBtns[2].attributes('aria-label')).toBe('Remover Terceiro');
    });

    it('utiliza classe max-input-native e não inclui classes residuais do PrimeVue', () => {
        const wrapper = mountChips();
        const container = wrapper.find('.max-chips-container');
        expect(container.classes()).toContain('max-input-native');
        expect(container.classes()).not.toContain('p-inputtext');
        expect(container.classes()).not.toContain('p-component');
    });

    it('contém regra de estilo :focus-visible no SCSS scoped para o botão de remoção', () => {
        const filePath = path.resolve(__dirname, '../../src/components/MaxChips.vue');
        const content = fs.readFileSync(filePath, 'utf-8');
        expect(content).toContain('.max-chip-remove-btn');
        expect(content).toContain(':focus-visible');
    });
});
