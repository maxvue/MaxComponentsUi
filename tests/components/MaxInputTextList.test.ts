import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxInputTextList from '../../src/components/MaxInputTextList.vue';

function mountTextList(props: Record<string, any> = {}) {
    return mount(MaxInputTextList, {
        props: { modelValue: '', ...props }
    });
}

describe('MaxInputTextList', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('renderiza o textarea com o número de linhas correspondente ao conteúdo', () => {
        const wrapper = mountTextList({ modelValue: 'linha1\nlinha2\nlinha3' });

        const lineNumbers = wrapper.findAll('.line-number');
        expect(lineNumbers).toHaveLength(3);
    });

    it('exibe uma única linha quando o valor é vazio', () => {
        const wrapper = mountTextList();

        expect(wrapper.findAll('.line-number')).toHaveLength(1);
    });

    it('emite update:modelValue ao digitar no textarea', async () => {
        const wrapper = mountTextList();
        const textarea = wrapper.find('textarea');

        await textarea.setValue('novo conteúdo');

        expect(wrapper.emitted('update:modelValue')).toBeTruthy();
        const emitted = wrapper.emitted('update:modelValue')!;
        expect(emitted[emitted.length - 1]).toEqual(['novo conteúdo']);
    });

    it('atualiza o valor interno quando modelValue muda externamente', async () => {
        const wrapper = mountTextList({ modelValue: 'inicial' });
        const textarea = wrapper.find('textarea');
        expect((textarea.element as HTMLTextAreaElement).value).toBe('inicial');

        await wrapper.setProps({ modelValue: 'atualizado' });
        expect((textarea.element as HTMLTextAreaElement).value).toBe('atualizado');
    });

    it('insere 4 espaços ao pressionar Tab sem seleção', async () => {
        const wrapper = mountTextList({ modelValue: 'abc' });
        const textarea = wrapper.find('textarea');
        const el = textarea.element as HTMLTextAreaElement;
        el.selectionStart = 3;
        el.selectionEnd = 3;

        await textarea.trigger('keydown', { key: 'Tab' });

        const emitted = wrapper.emitted('update:modelValue')!;
        expect(emitted[emitted.length - 1][0]).toBe('abc    ');
    });

    it('mantém a indentação da linha anterior ao pressionar Enter', async () => {
        const wrapper = mountTextList({ modelValue: '    abc' });
        const textarea = wrapper.find('textarea');
        const el = textarea.element as HTMLTextAreaElement;
        el.selectionStart = 7;
        el.selectionEnd = 7;

        await textarea.trigger('keydown', { key: 'Enter' });

        const emitted = wrapper.emitted('update:modelValue')!;
        expect(emitted[emitted.length - 1][0]).toBe('    abc\n    ');
    });
});
