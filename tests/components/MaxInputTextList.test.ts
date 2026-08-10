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

    it('indenta cada linha de um bloco selecionado ao pressionar Tab', async () => {
        const wrapper = mountTextList({ modelValue: 'linha1\nlinha2' });
        const textarea = wrapper.find('textarea');
        const el = textarea.element as HTMLTextAreaElement;
        // Seleciona da linha 1 até o fim da linha 2 (bloco completo)
        el.selectionStart = 0;
        el.selectionEnd = el.value.length;

        await textarea.trigger('keydown', { key: 'Tab' });

        const emitted = wrapper.emitted('update:modelValue')!;
        expect(emitted[emitted.length - 1][0]).toBe('    linha1\n    linha2');
    });

    it('sincroniza o scroll do textarea com a coluna de números de linha', async () => {
        const wrapper = mountTextList({ modelValue: 'l1\nl2\nl3\nl4\nl5\nl6\nl7\nl8\nl9\nl10' });
        const textarea = wrapper.find('textarea');
        const el = textarea.element as HTMLTextAreaElement;
        const lineNumbers = wrapper.find('.line-numbers').element as HTMLDivElement;

        Object.defineProperty(el, 'scrollTop', { value: 42, writable: true });
        await textarea.trigger('scroll');

        expect(lineNumbers.scrollTop).toBe(42);
    });

    it('repassa label, error e required ao InputBase', () => {
        const wrapper = mountTextList({ label: 'Meu Label', error: 'Erro aqui', required: true });

        const inputBase = wrapper.findComponent({ name: 'InputBase' });
        expect(inputBase.exists()).toBe(true);
        expect(inputBase.props('label')).toBe('Meu Label');
        expect(inputBase.props('error')).toBe('Erro aqui');
        expect(inputBase.props('required')).toBe(true);
    });
});
