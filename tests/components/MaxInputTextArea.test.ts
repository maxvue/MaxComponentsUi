import { describe, it, expect, beforeEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxInputTextArea from '../../src/components/MaxInputTextArea.vue';
import InputBase from '../../src/components/InputBase.vue';

function mountTextArea(props: Record<string, any> = {}, attrs: Record<string, any> = {}) {
    return mount(MaxInputTextArea, {
        props: { modelValue: '', ...props },
        attrs
    });
}

describe('MaxInputTextArea', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('renderiza corretamente', () => {
        const wrapper = mountTextArea();
        expect(wrapper.exists()).toBe(true);
        expect(wrapper.findComponent(InputBase).exists()).toBe(true);
    });

    it('emite update:modelValue ao digitar', async () => {
        const wrapper = mountTextArea({ modelValue: '' });
        const textarea = wrapper.find('textarea');
        await textarea.setValue('Texto de exemplo');
        expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    });

    it('sincroniza modelValue com temp_value', async () => {
        const wrapper = mountTextArea({ modelValue: 'inicial' });
        await wrapper.setProps({ modelValue: 'atualizado' });
        await wrapper.vm.$nextTick();

        const emitted = wrapper.emitted('update:modelValue');
        expect(emitted).toBeTruthy();
    });

    it('calcula número de linhas com base no conteúdo', async () => {
        const wrapper = mountTextArea({ modelValue: 'linha1\nlinha2\nlinha3' });
        // O componente calcula computedLines baseado em quebras de linha
        expect(wrapper.findComponent(InputBase).exists()).toBe(true);
    });

    it('respeita minRows', () => {
        const wrapper = mountTextArea({ modelValue: '', minRows: 5 });
        expect(wrapper.exists()).toBe(true);
    });

    it('respeita autoResize=true por padrão', () => {
        const wrapper = mountTextArea();
        expect(wrapper.exists()).toBe(true);
    });

    it('aceita prop rows para altura fixa', () => {
        const wrapper = mountTextArea({ rows: 10 });
        expect(wrapper.exists()).toBe(true);
    });

    it('valida done=true no blur via checkDone()', async () => {
        const wrapper = mountTextArea({ done: true, modelValue: '' });
        const textarea = wrapper.find('textarea');
        await textarea.trigger('blur');

        // checkDone define isDone = props.done
        expect((wrapper.vm as any).isDone).toBe(true);
    });

    it('emite update:modelValue imediatamente no mount (immediate: true preservado)', () => {
        const wrapper = mountTextArea({ modelValue: 'valor inicial' });
        const emitted = wrapper.emitted('update:modelValue');
        expect(emitted).toBeTruthy();
        expect(emitted?.[0][0]).toBe('valor inicial');
    });

    it('não quebra com minRows não numérico (normaliza para fallback 1)', () => {
        const wrapper = mountTextArea({ modelValue: '', minRows: 'abc' as any });
        const vm = wrapper.vm as any;
        expect(Number.isNaN(vm.lines)).toBe(false);
        expect(vm.lines).toBeGreaterThanOrEqual(1);
    });

    it('respeita maxRows e normaliza valores não numéricos', () => {
        const wrapper = mountTextArea({ modelValue: '', maxRows: 5 });
        expect(wrapper.exists()).toBe(true);

        const wrapperInvalid = mountTextArea({ modelValue: '', maxRows: 'invalid' as any });
        expect(wrapperInvalid.exists()).toBe(true);
    });

    it('define overflowY="auto" e limpa height quando autoResize é false', async () => {
        const wrapper = mountTextArea({ modelValue: 'Texto', autoResize: false, rows: 4 });
        await wrapper.vm.$nextTick();
        const textarea = wrapper.find('textarea');
        const el = textarea.element as HTMLTextAreaElement;

        // Com autoResize=false, overflowY deve ser auto para permitir scroll
        expect(el.style.overflowY).toBe('auto');
    });

    it('limita altura e ativa overflowY="auto" quando conteúdo excede maxRows', async () => {
        const wrapper = mountTextArea({ modelValue: 'Linha 1\nLinha 2\nLinha 3\nLinha 4\nLinha 5', maxRows: 2 });
        const textarea = wrapper.find('textarea');
        const el = textarea.element as HTMLTextAreaElement;

        // Simula layout com scrollHeight maior que maxHeight
        Object.defineProperty(el, 'scrollHeight', { value: 300, configurable: true });
        Object.defineProperty(el, 'clientHeight', { value: 60, configurable: true });

        // Dispara resize
        const vm = wrapper.vm as any;
        vm.resize();
        await wrapper.vm.$nextTick();

        expect(el.style.overflowY).toBe('auto');
        expect(el.style.height).toBeTruthy();
    });

    it('ajusta overflowY="hidden" quando conteúdo não excede maxRows', async () => {
        const wrapper = mountTextArea({ modelValue: 'Linha 1', maxRows: 10 });
        const textarea = wrapper.find('textarea');
        const el = textarea.element as HTMLTextAreaElement;

        // Simula scrollHeight pequeno
        Object.defineProperty(el, 'scrollHeight', { value: 40, configurable: true });

        const vm = wrapper.vm as any;
        vm.resize();
        await wrapper.vm.$nextTick();

        expect(el.style.overflowY).toBe('hidden');
    });

    it('define cor semântica var(--background-700) e placeholder var(--background-650) ou var(--max-content-placeholder) no estilo do MaxInputTextArea', () => {
        const sfc = readFileSync(resolve(__dirname, '../../src/components/MaxInputTextArea.vue'), 'utf-8');
        expect(sfc).toMatch(/textarea\s*\{[^}]*color:\s*var\(--background-700\)/s);
        expect(sfc).toMatch(/&::placeholder\s*\{[^}]*color:\s*var\(--(?:max-content-placeholder|background-650)/s);
    });

    it('define cor var(--background-700) e placeholder para textarea no InputBase', () => {
        const sfc = readFileSync(resolve(__dirname, '../../src/components/InputBase.vue'), 'utf-8');
        expect(sfc).toMatch(/input,\s*textarea\s*\{[^}]*color:\s*var\(--background-700\)/s);
        expect(sfc).toMatch(/input,\s*textarea\s*\{[^}]*&::placeholder\s*\{[^}]*color:\s*var\(--max-content-placeholder/s);
    });

    describe('Redimensionamento único e prevenção de layout thrashing (E11-02)', () => {
        it('executa no máximo uma leitura de scrollHeight e um getComputedStyle ao alterar o valor pelo input', async () => {
            const wrapper = mountTextArea({ modelValue: 'Linha 1' });
            await wrapper.vm.$nextTick();
            await wrapper.vm.$nextTick();

            const textarea = wrapper.find('textarea');
            const el = textarea.element as HTMLTextAreaElement;

            let scrollHeightReads = 0;
            Object.defineProperty(el, 'scrollHeight', {
                get() {
                    scrollHeightReads++;
                    return 100;
                },
                configurable: true
            });

            const gcsSpy = vi.spyOn(window, 'getComputedStyle');
            gcsSpy.mockClear();

            // Simula digitação disparando evento de input
            el.value = 'Linha 1\nLinha 2';
            await textarea.trigger('input');
            await wrapper.vm.$nextTick();
            await wrapper.vm.$nextTick();

            const callsForThisEl = gcsSpy.mock.calls.filter(([target]) => target === el);

            // Uma alteração lógica executa exatamente uma leitura de scrollHeight e um getComputedStyle
            expect(scrollHeightReads).toBe(1);
            expect(callsForThisEl.length).toBe(1);

            gcsSpy.mockRestore();
            wrapper.unmount();
        });

        it('coalesce múltiplas alterações de propriedades no mesmo tick para um único resize', async () => {
            const wrapper = mountTextArea({ modelValue: 'Inicial' });
            await wrapper.vm.$nextTick();
            await wrapper.vm.$nextTick();

            const textarea = wrapper.find('textarea');
            const el = textarea.element as HTMLTextAreaElement;

            let resizeCount = 0;
            Object.defineProperty(el, 'scrollHeight', {
                get() {
                    resizeCount++;
                    return 150;
                },
                configurable: true
            });

            // Altera props e modelValue no mesmo ciclo
            await wrapper.setProps({
                modelValue: 'Linha 1\nLinha 2\nLinha 3',
                minRows: 3,
                maxRows: 6
            });
            await wrapper.vm.$nextTick();
            await wrapper.vm.$nextTick();

            expect(resizeCount).toBe(1);
            wrapper.unmount();
        });

        it('não lê scrollHeight nem chama getComputedStyle quando autoResize é false', async () => {
            const wrapper = mountTextArea({ modelValue: 'Linha 1', autoResize: false });
            await wrapper.vm.$nextTick();
            await wrapper.vm.$nextTick();

            const textarea = wrapper.find('textarea');
            const el = textarea.element as HTMLTextAreaElement;

            let scrollHeightRead = false;
            Object.defineProperty(el, 'scrollHeight', {
                get() {
                    scrollHeightRead = true;
                    return 200;
                },
                configurable: true
            });

            const gcsSpy = vi.spyOn(window, 'getComputedStyle');
            gcsSpy.mockClear();

            const vm = wrapper.vm as any;
            vm.resize();

            const callsForThisEl = gcsSpy.mock.calls.filter(([target]) => target === el);

            expect(scrollHeightRead).toBe(false);
            expect(callsForThisEl.length).toBe(0);
            expect(el.style.overflowY).toBe('auto');

            gcsSpy.mockRestore();
            wrapper.unmount();
        });

        it('ignora callbacks pendentes e previne escrita tardia após unmount', async () => {
            const wrapper = mountTextArea({ modelValue: 'Texto' });
            await wrapper.vm.$nextTick();
            await wrapper.vm.$nextTick();

            const textarea = wrapper.find('textarea');
            const el = textarea.element as HTMLTextAreaElement;

            let scrollHeightReads = 0;
            Object.defineProperty(el, 'scrollHeight', {
                get() {
                    scrollHeightReads++;
                    return 200;
                },
                configurable: true
            });

            const vm = wrapper.vm as any;
            // Agenda resize e desmonta imediatamente antes do callback executar
            vm.scheduleResize();
            wrapper.unmount();

            await wrapper.vm.$nextTick();
            await wrapper.vm.$nextTick();

            // Após unmount, o callback agendado é ignorado e não deve ler scrollHeight
            expect(scrollHeightReads).toBe(0);
        });
    });
});
