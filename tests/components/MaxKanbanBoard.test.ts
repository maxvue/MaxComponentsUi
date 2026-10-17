import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import MaxKanbanBoard from '../../src/components/MaxKanbanBoard.vue';

describe('MaxKanbanBoard', () => {
    it('mantém coluna vazia visível e emite intenção de recolhimento', async () => {
        const wrapper = mount(MaxKanbanBoard, { props: { columns: [{ id: 'todo', title: 'A fazer', items: [] }] }, global: { stubs: { MaxIconButton: { inheritAttrs: false, emits: ['click'], template: '<button @click="$emit(\'click\', $event)"><slot /></button>' }, MaxCard: { inheritAttrs: false, props: ['disabled'], emits: ['click'], template: '<article :aria-disabled="disabled" @click="$emit(\'click\', $event)"><slot name="body" /></article>' } } } });
        expect(wrapper.text()).toContain('Coluna vazia');
        await wrapper.find('button').trigger('click');
        expect(wrapper.emitted('toggle-column')).toEqual([['todo']]);
    });
});
