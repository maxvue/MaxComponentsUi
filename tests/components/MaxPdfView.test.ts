import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import MaxPdfView from '../../src/components/MaxPdfView.vue';

vi.mock('@maxvue/max-use', () => ({
    useWindowSize: () => ({ width: { value: 1024 }, height: { value: 768 } })
}));

function mountPdf(props: Record<string, any> = {}) {
    return mount(MaxPdfView, {
        props: { file: '', ...props },
        global: { stubs: { ProgressSpinner: true, VuePdfEmbed: true, MaxButton: true } }
    });
}

describe('MaxPdfView.vue', () => {
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
});
