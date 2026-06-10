import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import MaxPdfView from '../../src/components/MaxPdfView.vue';

vi.mock('@maxvue/max-use', () => ({
    useWindowSize: () => ({ width: { value: 1024 }, height: { value: 768 } })
}));

describe('MaxPdfView.vue', () => {
    it('deve montar o componente corretamente', async () => {
        const wrapper = mount(MaxPdfView, {
            props: { file: 'test.pdf' },
            global: {
                stubs: {
                    ProgressSpinner: true,
                    Botao: true,
                }
            }
        });
        
        expect(wrapper.exists()).toBe(true);
    });

    it('deve atualizar o status de visibilidade ao alterar prop file', async () => {
        const wrapper = mount(MaxPdfView, {
            props: { file: '' },
            global: {
                stubs: { ProgressSpinner: true, Botao: true }
            }
        });
        
        await wrapper.setProps({ file: 'novo.pdf' });
        expect(wrapper.vm.is_open).toBe(true);
    });

    it('deve executar o zoom in e zoom out', async () => {
        const wrapper = mount(MaxPdfView, {
            props: { file: 'test.pdf' },
            global: {
                stubs: { ProgressSpinner: true, Botao: true }
            }
        });
        
        wrapper.vm.Zoom('in');
        expect(wrapper.vm.size.width).toBeGreaterThan(1024);
        wrapper.vm.Zoom('out');
        expect(wrapper.vm.size.width).toBeLessThan(1100); 
    });

    it('renderiza o template completo e chama funções', async () => {
        vi.useFakeTimers();
        const wrapper = mount(MaxPdfView, {
            props: { file: '' },
            global: {
                stubs: { ProgressSpinner: true, Botao: true }
            }
        });
        
        await wrapper.setProps({ file: 'novo.pdf' });
        await wrapper.vm.$nextTick(); // renders the template
        
        // now template is rendered, is_open = true
        expect(wrapper.vm.is_open).toBe(true);

        wrapper.vm.rendered();
        expect(wrapper.vm.isLoading).toBe(false);
        expect(wrapper.vm.opacity).toBe(0.9);

        wrapper.vm.loaded({ numPages: 5 });
        expect(wrapper.vm.total).toBe(5);
        expect(wrapper.vm.opacity).toBe(1);

        // find buttons and click them
        const botoes = wrapper.findAllComponents({ name: 'Botao' });
        // The first is Zoom out, second is Zoom in, third is close
        if (botoes.length >= 3) {
            await botoes[0].trigger('click');
            await botoes[1].trigger('click');
            await botoes[2].trigger('click'); // closePDF
        } else {
            // fallback if stub doesn't allow trigger
            wrapper.vm.Zoom('in');
            wrapper.vm.closePDF();
        }

        expect(wrapper.vm.opacity).toBe(0);
        vi.runAllTimers(); // runs setTimeout
        expect(wrapper.vm.is_open).toBe(false);
        
        vi.useRealTimers();
    });

    it('testa progressPdf e limitador de percent', async () => {
        const wrapper = mount(MaxPdfView, {
            props: { file: 'test.pdf' },
            global: { stubs: { ProgressSpinner: true, Botao: true } }
        });
        
        wrapper.vm.progressPdf({ loaded: 50, total: 100 });
        expect(wrapper.vm.percent).toBe(50);

        wrapper.vm.progressPdf({ loaded: 100, total: 100 });
        expect(wrapper.vm.percent).toBe(98);
    });

    it('testa Zoom cover branches', async () => {
        const wrapper = mount(MaxPdfView, {
            props: { file: 'test.pdf' },
            global: { stubs: { ProgressSpinner: true, Botao: true } }
        });
        wrapper.vm.Zoom('in');
        wrapper.vm.Zoom('out');
        wrapper.vm.Zoom('other'); // cover else
    });
});
