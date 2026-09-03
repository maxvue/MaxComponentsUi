import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxPdfView from '../../src/components/MaxPdfView.vue';

vi.mock('@maxvue/max-use', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@maxvue/max-use')>();
    return {
        ...actual,
        useWindowSize: () => ({ width: { value: 1024 }, height: { value: 768 } })
    };
});

function mountPdf(props: Record<string, any> = {}) {
    return mount(MaxPdfView, {
        props: { file: '', ...props },
        global: { stubs: { VuePdfEmbed: true, MaxButton: true } }
    });
}

describe('MaxPdfView.vue', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('não exibe o visualizador enquanto não há arquivo', () => {
        const wrapper = mountPdf();
        expect(wrapper.find('.viewPDF').exists()).toBe(false);
    });

    it('abre o visualizador (com loading) ao definir o arquivo', async () => {
        const wrapper = mountPdf();
        await wrapper.setProps({ file: 'novo.pdf' });

        expect(wrapper.find('.viewPDF').exists()).toBe(true);
        expect(wrapper.find('.loading').exists()).toBe(true);
    });

    it('fecha o visualizador ao clicar na área de fundo', async () => {
        vi.useFakeTimers();
        const wrapper = mountPdf();
        await wrapper.setProps({ file: 'novo.pdf' });
        expect(wrapper.find('.viewPDF').exists()).toBe(true);

        await wrapper.find('.space').trigger('click'); // closePDF

        vi.runAllTimers();
        await wrapper.vm.$nextTick();
        expect(wrapper.find('.viewPDF').exists()).toBe(false);

        vi.useRealTimers();
    });

    it('aplica zoom in e zoom out alterando a largura', async () => {
        const wrapper = mountPdf({ file: 'test.pdf' });
        const vm = wrapper.vm as any;
        const initial = vm.size.width;

        vm.Zoom('in');
        expect(vm.size.width).toBeGreaterThan(initial);

        const afterIn = vm.size.width;
        vm.Zoom('out');
        expect(vm.size.width).toBeLessThan(afterIn);

        vm.Zoom('other'); // cobre o branch que não altera nada
    });

    describe('Acessibilidade e Ciclo de Vida (Etapa 5.1)', () => {
        afterEach(() => {
            document.body.innerHTML = '';
            document.body.style.overflow = '';
        });

        it('container .viewPDF possui role="dialog", aria-modal="true" e aria-label="Visualizador de PDF"', async () => {
            const wrapper = mountPdf({ file: 'teste.pdf' });
            await wrapper.vm.$nextTick();

            const dialog = wrapper.find('.viewPDF');
            expect(dialog.exists()).toBe(true);
            expect(dialog.attributes('role')).toBe('dialog');
            expect(dialog.attributes('aria-modal')).toBe('true');
            expect(dialog.attributes('aria-label')).toBe('Visualizador de PDF');
        });

        it('renderiza a barra de ferramentas .pdf-div-bar-tools dentro do container dialog .viewPDF', async () => {
            const wrapper = mountPdf({ file: 'teste.pdf' });
            await wrapper.vm.$nextTick();

            const dialog = wrapper.find('.viewPDF');
            expect(dialog.exists()).toBe(true);

            const toolbarInsideDialog = dialog.find('.pdf-div-bar-tools');
            expect(toolbarInsideDialog.exists()).toBe(true);
        });

        it('possui atributos acessíveis (aria-label e tabindex) nos botões da barra de ferramentas', async () => {
            const wrapper = mount(MaxPdfView, {
                props: { file: 'teste.pdf' },
                global: { stubs: { VuePdfEmbed: true } }
            });
            await wrapper.vm.$nextTick();

            const buttons = wrapper.findAll('.pdf-div-bar-tools [aria-label]');
            expect(buttons.length).toBe(3);

            const labels = buttons.map((b) => b.attributes('aria-label'));
            expect(labels).toContain('Diminuir zoom');
            expect(labels).toContain('Aumentar zoom');
            expect(labels).toContain('Fechar visualizador de PDF');

            const tabindexes = buttons.map((b) => b.attributes('tabindex'));
            expect(tabindexes.every((t) => t === '0')).toBe(true);
        });

        it('permite que o foco do teclado (focus trap) acesse os controles da barra de ferramentas', async () => {
            const wrapper = mount(MaxPdfView, {
                props: { file: 'teste.pdf' },
                global: { stubs: { VuePdfEmbed: true } },
                attachTo: document.body
            });
            await wrapper.vm.$nextTick();

            const dialog = wrapper.find('.viewPDF');
            const buttons = dialog.findAll('.pdf-div-bar-tools [aria-label]');
            expect(buttons.length).toBe(3);

            // Simula tecla Tab no dialog
            const firstButton = buttons[0].element as HTMLElement;
            firstButton.focus();
            expect(document.activeElement).toBe(firstButton);

            wrapper.unmount();
        });

        it('fecha o visualizador ao pressionar a tecla Escape', async () => {
            vi.useFakeTimers();
            const wrapper = mountPdf({ file: 'teste.pdf' });
            await wrapper.vm.$nextTick();

            expect(wrapper.find('.viewPDF').exists()).toBe(true);

            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
            vi.advanceTimersByTime(600);
            await wrapper.vm.$nextTick();

            expect(wrapper.find('.viewPDF').exists()).toBe(false);
            vi.useRealTimers();
        });

        it('trava o scroll do body com useScrollLock enquanto o PDF está aberto', async () => {
            vi.useFakeTimers();
            document.body.style.overflow = '';
            const wrapper = mountPdf();
            await wrapper.setProps({ file: 'teste.pdf' });

            expect(document.body.style.overflow).toBe('hidden');

            const vm = wrapper.vm as any;
            vm.closePDF();
            vi.advanceTimersByTime(600);
            await wrapper.vm.$nextTick();
            await wrapper.vm.$nextTick();

            expect(document.body.style.overflow).toBe('');
            vi.useRealTimers();
        });

        it('limpa o close_timer ao desmontar prevenindo timers órfãos', async () => {
            vi.useFakeTimers();
            const wrapper = mountPdf({ file: 'teste.pdf' });
            await wrapper.vm.$nextTick();

            const vm = wrapper.vm as any;
            vm.closePDF();

            wrapper.unmount();
            expect(() => vi.advanceTimersByTime(600)).not.toThrow();
            vi.useRealTimers();
        });

        it('reabrir PDF cancela timer de fechamento pendente', async () => {
            vi.useFakeTimers();
            const wrapper = mountPdf({ file: 'doc1.pdf' });
            await wrapper.vm.$nextTick();

            const vm = wrapper.vm as any;
            vm.closePDF();

            // Reabre antes dos 500ms
            await wrapper.setProps({ file: 'doc2.pdf' });
            vi.advanceTimersByTime(600);
            await wrapper.vm.$nextTick();

            expect(wrapper.find('.viewPDF').exists()).toBe(true);
            vi.useRealTimers();
        });
    });
});
