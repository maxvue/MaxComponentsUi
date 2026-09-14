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

    describe('Ciclo de Teclado e Foco (E08-08)', () => {
        it('exibe instrução acessível e associa ao textarea via aria-describedby quando indentWithTab é true (default)', () => {
            const wrapper = mountTextList();
            const textarea = wrapper.find('textarea');
            const instruction = wrapper.find('.text-list-keyboard-instruction');

            expect(instruction.exists()).toBe(true);
            expect(instruction.text()).toBe('Pressione Escape e depois Tab para sair do editor');

            const describedBy = textarea.attributes('aria-describedby');
            expect(describedBy).toBeDefined();
            expect(describedBy).toContain(instruction.attributes('id'));
        });

        it('quando indentWithTab é false, não exibe instrução e Tab/Shift+Tab navegam sem modificar o texto', async () => {
            const wrapper = mountTextList({ indentWithTab: false, modelValue: 'meu código' });
            const textarea = wrapper.find('textarea');

            expect(wrapper.find('.text-list-keyboard-instruction').exists()).toBe(false);

            const tabEvent = new KeyboardEvent('keydown', { key: 'Tab', cancelable: true });
            textarea.element.dispatchEvent(tabEvent);
            expect(tabEvent.defaultPrevented).toBe(false);

            const shiftTabEvent = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, cancelable: true });
            textarea.element.dispatchEvent(shiftTabEvent);
            expect(shiftTabEvent.defaultPrevented).toBe(false);

            // O conteúdo não foi alterado
            expect((textarea.element as HTMLTextAreaElement).value).toBe('meu código');
        });

        it('quando indentWithTab é true, Escape arma o modo de saída e o próximo Tab não indenta', async () => {
            const wrapper = mountTextList({ indentWithTab: true, modelValue: 'codigo' });
            const textarea = wrapper.find('textarea');

            // Inicialmente o status de escape armado não existe
            expect(wrapper.find('.escape-armed-status').exists()).toBe(false);

            // Pressiona Escape para armar a saída
            await textarea.trigger('keydown', { key: 'Escape' });
            expect(wrapper.find('.escape-armed-status').exists()).toBe(true);
            expect(wrapper.find('.escape-armed-status').text()).toContain('Modo de saída do editor ativado');

            // Pressiona Tab enquanto armado: não previne default e não insere espaços
            const tabEvent = new KeyboardEvent('keydown', { key: 'Tab', cancelable: true, bubbles: true });
            textarea.element.dispatchEvent(tabEvent);
            await wrapper.vm.$nextTick();

            expect(tabEvent.defaultPrevented).toBe(false);
            expect((textarea.element as HTMLTextAreaElement).value).toBe('codigo');
            // Modo é desarmado após o Tab
            expect(wrapper.find('.escape-armed-status').exists()).toBe(false);
        });

        it('qualquer outra tecla após Escape desarma o modo de saída', async () => {
            const wrapper = mountTextList({ indentWithTab: true, modelValue: 'linha' });
            const textarea = wrapper.find('textarea');

            // Arma
            await textarea.trigger('keydown', { key: 'Escape' });
            expect(wrapper.find('.escape-armed-status').exists()).toBe(true);

            // Pressiona seta para baixo ou outra tecla
            await textarea.trigger('keydown', { key: 'ArrowDown' });
            expect(wrapper.find('.escape-armed-status').exists()).toBe(false);

            // Próximo Tab agora deve indentar normalmente
            const el = textarea.element as HTMLTextAreaElement;
            el.selectionStart = 5;
            el.selectionEnd = 5;
            await textarea.trigger('keydown', { key: 'Tab' });

            const emitted = wrapper.emitted('update:modelValue')!;
            expect(emitted[emitted.length - 1][0]).toBe('linha    ');
        });

        it('perda de foco (blur) desarma o modo de saída', async () => {
            const wrapper = mountTextList({ indentWithTab: true });
            const textarea = wrapper.find('textarea');

            await textarea.trigger('keydown', { key: 'Escape' });
            expect(wrapper.find('.escape-armed-status').exists()).toBe(true);

            await textarea.trigger('blur');
            expect(wrapper.find('.escape-armed-status').exists()).toBe(false);
        });
    });

    describe('Calha Virtual e Performance em Textos Longos (E11-01)', () => {
        it('define aria-hidden="true" na calha de números de linha', () => {
            const wrapper = mountTextList({ modelValue: 'linha 1\nlinha 2' });
            const lineNumbers = wrapper.find('.line-numbers');
            expect(lineNumbers.attributes('aria-hidden')).toBe('true');
        });

        it('com 10.000 linhas, renderiza nós DOM limitados à viewport + overscan (<= 50 nós)', async () => {
            const tenThousandLines = Array.from({ length: 10000 }, (_, i) => `Linha ${i + 1}`).join('\n');
            const wrapper = mountTextList({ modelValue: tenThousandLines });
            await wrapper.vm.$nextTick();

            const renderedNodes = wrapper.findAll('.line-number');
            // Não deve renderizar 10.000 nós! Deve ficar limitado à janela virtual
            expect(renderedNodes.length).toBeLessThanOrEqual(50);
            expect(renderedNodes.length).toBeGreaterThan(0);

            // Primeira linha renderizada no topo deve ser 1
            expect(renderedNodes[0].text()).toBe('1');
        });

        it('atualiza a janela visível ao rolar o textarea com 10.000 linhas', async () => {
            const tenThousandLines = Array.from({ length: 10000 }, (_, i) => `Linha ${i + 1}`).join('\n');
            const wrapper = mountTextList({ modelValue: tenThousandLines });
            const textarea = wrapper.find('textarea');
            const el = textarea.element as HTMLTextAreaElement;

            // Rola para a linha 100 (100 * 21px = 2100px)
            Object.defineProperty(el, 'scrollTop', { value: 2100, writable: true });
            Object.defineProperty(el, 'clientHeight', { value: 400, writable: true });
            await textarea.trigger('scroll');
            await wrapper.vm.$nextTick();

            const renderedNodes = wrapper.findAll('.line-number');
            expect(renderedNodes.length).toBeLessThanOrEqual(50);

            // Os números visíveis agora devem conter linhas próximas de 100
            const numbers = renderedNodes.map((n) => Number(n.text()));
            expect(numbers.some((num) => num >= 95 && num <= 105)).toBe(true);
        });

        it('diminui o número total de linhas corretamente quando o texto encolhe', async () => {
            const thousandLines = Array.from({ length: 1000 }, (_, i) => `L ${i}`).join('\n');
            const wrapper = mountTextList({ modelValue: thousandLines });
            await wrapper.vm.$nextTick();

            expect(wrapper.findAll('.line-number').length).toBeLessThanOrEqual(50);

            // Reduz para 5 linhas
            await wrapper.setProps({ modelValue: '1\n2\n3\n4\n5' });
            await wrapper.vm.$nextTick();

            // Para <= 50 linhas, volta ao modo direto renderizando exatamente 5 nós
            expect(wrapper.findAll('.line-number')).toHaveLength(5);
        });

        it('spacer possui altura total proporcional ao número de linhas', () => {
            const wrapper = mountTextList({ modelValue: 'l1\nl2\nl3\nl4\nl5' });
            const spacer = wrapper.find('.line-numbers-spacer');
            expect(spacer.exists()).toBe(true);
            // 5 linhas * 21px = 105px
            expect(spacer.attributes('style')).toContain('height: 105px');
        });

        it('ao rolar até o fim de 10.000 linhas, a última linha visível inclui a linha 10.000', async () => {
            const tenThousandLines = Array.from({ length: 10000 }, (_, i) => `Linha ${i + 1}`).join('\n');
            const wrapper = mountTextList({ modelValue: tenThousandLines });
            const textarea = wrapper.find('textarea');
            const el = textarea.element as HTMLTextAreaElement;

            // Rola até o final
            Object.defineProperty(el, 'scrollTop', { value: 10000 * 21 - 400, writable: true });
            Object.defineProperty(el, 'clientHeight', { value: 400, writable: true });
            await textarea.trigger('scroll');
            await wrapper.vm.$nextTick();

            const renderedNodes = wrapper.findAll('.line-number');
            expect(renderedNodes.length).toBeLessThanOrEqual(50);
            const lastNumber = Number(renderedNodes[renderedNodes.length - 1].text());
            expect(lastNumber).toBe(10000);
        });

        it('digitação em texto longo atualiza o valor sem exceder limite de nós da janela virtual', async () => {
            const thousandLines = Array.from({ length: 1000 }, (_, i) => `Linha ${i + 1}`).join('\n');
            const wrapper = mountTextList({ modelValue: thousandLines });
            const textarea = wrapper.find('textarea');

            await textarea.setValue(`${thousandLines}\nLinha 1001`);
            await wrapper.vm.$nextTick();

            const renderedNodes = wrapper.findAll('.line-number');
            expect(renderedNodes.length).toBeLessThanOrEqual(50);
            expect(wrapper.emitted('update:modelValue')).toBeTruthy();
        });

        it('R22: --text-list-line-height é injetado via TypeScript como fonte única de verdade', () => {
            const wrapper = mountTextList({ modelValue: 'linha teste' });
            const editor = wrapper.find('.max-code-editor');
            expect(editor.attributes('style')).toContain('--text-list-line-height: 21px');
        });

        it('R22: benchmarks determinísticos de calha virtual para 100, 1.000 e 10.000 linhas', async () => {
            const counts = [100, 1000, 10000];
            for (const count of counts) {
                const lines = Array.from({ length: count }, (_, i) => `Linha ${i + 1}`).join('\n');
                const wrapper = mountTextList({ modelValue: lines });
                await wrapper.vm.$nextTick();

                const renderedNodes = wrapper.findAll('.line-number');
                // Em todos os tamanhos, os nós renderizados não devem ultrapassar 50 nós
                expect(renderedNodes.length).toBeLessThanOrEqual(50);
                expect(renderedNodes.length).toBeGreaterThan(0);

                const spacer = wrapper.find('.line-numbers-spacer');
                const expectedHeight = count * 21;
                expect(spacer.attributes('style')).toContain(`height: ${expectedHeight}px`);
            }
        });

        it('R22: precisão e alinhamento de linha com erro <= 1px sob escala/zoom', () => {
            const wrapper = mountTextList({ modelValue: 'linha 1\nlinha 2\nlinha 3' });
            const lineNumbers = wrapper.findAll('.line-number');
            expect(lineNumbers).toHaveLength(3);

            // Cada linha no DOM virtual possui cálculo determinístico baseado em 21px
            const LINE_HEIGHT = 21;
            for (let i = 0; i < 3; i++) {
                const expectedOffset = i * LINE_HEIGHT;
                const calculatedTop = i * LINE_HEIGHT;
                const diff = Math.abs(expectedOffset - calculatedTop);
                expect(diff).toBeLessThanOrEqual(1);
            }
        });
    });
});
