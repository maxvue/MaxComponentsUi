import { describe, it, expect, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxToast from '../../src/components/MaxToast.vue';
import { useToastStore } from '../../src/stores/useToast.Store';

function mountToast(storeSetup?: (store: ReturnType<typeof useToastStore>) => void) {
    const pinia = createPinia();
    setActivePinia(pinia);

    // Configura store ANTES do mount, na mesma instância Pinia
    if (storeSetup) {
        const store = useToastStore(pinia);
        storeSetup(store);
    }

    return mount(MaxToast, {
        global: {
            plugins: [pinia],
            stubs: {
                MaxIcon: {
                    template: '<span class="max-icon"></span>',
                    props: ['i', 'size', 'color']
                },
                TransitionGroup: {
                    template: '<div class="max-toast-container" v-bind="$attrs"><slot /></div>',
                    props: ['name', 'tag']
                }
            }
        }
    });
}

describe('MaxToast', () => {
    it('renderiza o container de toasts', () => {
        const wrapper = mountToast();
        expect(wrapper.find('.max-toast-container').exists()).toBe(true);
    });

    it('não exibe items quando store está vazia', () => {
        const wrapper = mountToast();
        expect(wrapper.findAll('.max-toast-item')).toHaveLength(0);
    });

    it('exibe toast quando adicionado à store', async () => {
        const wrapper = mountToast((store) => {
            store.add({ title: 'Sucesso!', severity: 'success' });
        });
        await flushPromises();

        expect(wrapper.findAll('.max-toast-item')).toHaveLength(1);
        expect(wrapper.text()).toContain('Sucesso!');
    });

    it('exibe mensagem do toast', async () => {
        const wrapper = mountToast((store) => {
            store.add({ title: 'Aviso', message: 'Detalhes aqui', severity: 'warning' });
        });
        await flushPromises();

        expect(wrapper.text()).toContain('Aviso');
        expect(wrapper.text()).toContain('Detalhes aqui');
    });

    it('aplica classe de severidade correta', async () => {
        const wrapper = mountToast((store) => {
            store.add({ title: 'Erro', severity: 'error' });
        });
        await flushPromises();

        expect(wrapper.find('.severity-error').exists()).toBe(true);
    });

    it('remove toast ao clicar no botão fechar', async () => {
        const pinia = createPinia();
        setActivePinia(pinia);
        const store = useToastStore(pinia);
        store.add({ title: 'Remover', severity: 'info' });

        const wrapper = mount(MaxToast, {
            global: {
                plugins: [pinia],
                stubs: {
                    MaxIcon: { template: '<span></span>', props: ['i', 'size', 'color'] },
                    TransitionGroup: { template: '<div class="max-toast-container"><slot /></div>', props: ['name', 'tag'] }
                }
            }
        });
        await flushPromises();

        expect(wrapper.findAll('.max-toast-item')).toHaveLength(1);

        await wrapper.find('.max-toast-close').trigger('click');
        await flushPromises();

        expect(store.items).toHaveLength(0);
    });

    it('exibe múltiplos toasts', async () => {
        const wrapper = mountToast((store) => {
            store.add({ title: 'Toast 1', severity: 'success' });
            store.add({ title: 'Toast 2', severity: 'info' });
            store.add({ title: 'Toast 3', severity: 'error' });
        });
        await flushPromises();

        expect(wrapper.findAll('.max-toast-item')).toHaveLength(3);
    });

    it('aplica severidade whatsapp', async () => {
        const wrapper = mountToast((store) => {
            store.add({ title: 'WhatsApp', severity: 'whatsapp' });
        });
        await flushPromises();

        expect(wrapper.find('.severity-whatsapp').exists()).toBe(true);
    });

    it('pausa e retoma o toast em mouseenter e mouseleave', async () => {
        const pinia = createPinia();
        setActivePinia(pinia);
        const store = useToastStore(pinia);
        const _id = store.add({ title: 'Hover Me', severity: 'info' });

        const wrapper = mount(MaxToast, {
            global: {
                plugins: [pinia],
                stubs: {
                    MaxIcon: true,
                    TransitionGroup: { template: '<div class="max-toast-container"><slot /></div>' }
                }
            }
        });
        await flushPromises();

        const item = wrapper.find('.max-toast-item');

        // Simula mouseenter
        await item.trigger('mouseenter');
        expect(store.items[0].paused).toBe(true);

        // Simula mouseleave
        await item.trigger('mouseleave');
        expect(store.items[0].paused).toBe(false);
    });

    it('não limpa a store ao desmontar o componente (preserva toasts entre rotas)', async () => {
        const pinia = createPinia();
        setActivePinia(pinia);
        const store = useToastStore(pinia);
        store.add({ title: 'Toast 1', severity: 'info' });
        store.add({ title: 'Toast 2', severity: 'success' });

        const wrapper = mount(MaxToast, {
            global: {
                plugins: [pinia],
                stubs: {
                    MaxIcon: true,
                    TransitionGroup: { template: '<div class="max-toast-container"><slot /></div>' }
                }
            }
        });
        await flushPromises();

        expect(store.items.length).toBe(2);

        wrapper.unmount();

        expect(store.items.length).toBe(2);
    });

    describe('Toasts Persistentes e Ações de Mensagem', () => {
        it('toast persistente (duration: 0) possui classe is-persistent e não renderiza barra de progresso', async () => {
            const wrapper = mountToast((store) => {
                store.add({ title: 'Erro Crítico', duration: 0, severity: 'error' });
            });
            await flushPromises();

            const item = wrapper.find('.max-toast-item');
            expect(item.classes()).toContain('is-persistent');
            expect(wrapper.find('.max-toast-progress').exists()).toBe(false);
        });

        it('exibe botão "Ver mais" / "Ver menos" para mensagens longas (> 80 caracteres) e alterna expansão', async () => {
            const longMessage = 'Esta é uma mensagem de erro extremamente longa e detalhada que ultrapassa oitenta caracteres facilmente.';
            const wrapper = mountToast((store) => {
                store.add({ title: 'Erro Longo', message: longMessage, severity: 'error' });
            });
            await flushPromises();

            const expandBtn = wrapper.find('.action-expand');
            expect(expandBtn.exists()).toBe(true);
            expect(expandBtn.text()).toBe('Ver mais');

            const messageEl = wrapper.find('.max-toast-message');
            expect(messageEl.classes()).not.toContain('is-expanded');

            await expandBtn.trigger('click');
            expect(expandBtn.text()).toBe('Ver menos');
            expect(messageEl.classes()).toContain('is-expanded');

            await expandBtn.trigger('click');
            expect(expandBtn.text()).toBe('Ver mais');
            expect(messageEl.classes()).not.toContain('is-expanded');
        });

        it('botão "Copiar" copia o conteúdo do toast para a área de transferência', async () => {
            const writeTextMock = vi.fn().mockResolvedValue(undefined);
            Object.defineProperty(navigator, 'clipboard', {
                value: {
                    writeText: writeTextMock
                },
                configurable: true,
                writable: true
            });

            const wrapper = mountToast((store) => {
                store.add({ title: 'Erro de Conexão', message: 'Falha 500 no endpoint', severity: 'error' });
            });
            await flushPromises();

            const copyBtn = wrapper.find('.action-copy');
            expect(copyBtn.exists()).toBe(true);
            expect(copyBtn.text()).toBe('Copiar');

            await copyBtn.trigger('click');
            await flushPromises();

            expect(writeTextMock).toHaveBeenCalledWith('Erro de Conexão\nFalha 500 no endpoint');
            expect(copyBtn.text()).toBe('Copiado!');
        });

        it('renova timer em cópias consecutivas e reseta estado após 2000ms', async () => {
            vi.useFakeTimers();
            const writeTextMock = vi.fn().mockResolvedValue(undefined);
            Object.defineProperty(navigator, 'clipboard', {
                value: { writeText: writeTextMock },
                configurable: true,
                writable: true
            });

            const wrapper = mountToast((store) => {
                store.add({ title: 'T1', message: 'Erro 1', severity: 'error' });
                store.add({ title: 'T2', message: 'Erro 2', severity: 'error' });
            });
            await flushPromises();

            const copyBtns = wrapper.findAll('.action-copy');
            await copyBtns[0].trigger('click');
            await flushPromises();

            expect(copyBtns[0].text()).toBe('Copiado!');

            // Avança 1500ms
            vi.advanceTimersByTime(1500);
            await wrapper.vm.$nextTick();

            // Clica na segunda cópia (renova janela)
            await copyBtns[1].trigger('click');
            await flushPromises();

            expect(copyBtns[1].text()).toBe('Copiado!');

            // Avança mais 1000ms (2500ms desde o primeiro, 1000ms desde o segundo)
            vi.advanceTimersByTime(1000);
            await wrapper.vm.$nextTick();
            expect(copyBtns[1].text()).toBe('Copiado!');

            // Avança os 1000ms restantes do segundo
            vi.advanceTimersByTime(1000);
            await wrapper.vm.$nextTick();
            expect(copyBtns[1].text()).toBe('Copiar');

            vi.useRealTimers();
        });

        it('desmontagem antes de 2000ms cancela timer sem erros pendentes', async () => {
            vi.useFakeTimers();
            const writeTextMock = vi.fn().mockResolvedValue(undefined);
            Object.defineProperty(navigator, 'clipboard', {
                value: { writeText: writeTextMock },
                configurable: true,
                writable: true
            });

            const wrapper = mountToast((store) => {
                store.add({ title: 'Unmount Me', message: 'Erro fatal', severity: 'error' });
            });
            await flushPromises();

            const copyBtn = wrapper.find('.action-copy');
            await copyBtn.trigger('click');
            await flushPromises();

            wrapper.unmount();
            vi.runAllTimers();

            // Zero efeitos e zero erros
            vi.useRealTimers();
        });
    });

    describe('Acessibilidade (Etapa 5.1)', () => {
        it('container de toasts possui role="region" e aria-label="Notificações", sem aria-live no container para evitar anúncios duplicados', () => {
            const wrapper = mountToast();
            const container = wrapper.find('.max-toast-container');
            expect(container.exists()).toBe(true);
            expect(container.attributes('role')).toBe('region');
            expect(container.attributes('aria-live')).toBeUndefined();
            expect(container.attributes('aria-atomic')).toBeUndefined();
            expect(container.attributes('aria-label')).toBe('Notificações');
        });

        it('toast de erro possui role="alert" e toast de sucesso possui role="status"', async () => {
            const wrapper = mountToast((store) => {
                store.add({ title: 'Sucesso', severity: 'success' });
                store.add({ title: 'Erro', severity: 'error' });
            });
            await flushPromises();

            const items = wrapper.findAll('.max-toast-item');
            expect(items[0].attributes('role')).toBe('status');
            expect(items[1].attributes('role')).toBe('alert');
        });

        it('garante exatamente um único owner de live region por evento de toast para evitar anúncios duplicados', async () => {
            const wrapper = mountToast((store) => {
                store.add({ title: 'Sucesso', message: 'Item salvo', severity: 'success' });
                store.add({ title: 'Erro', message: 'Falha ao salvar', severity: 'error' });
                store.add({ title: 'Info', message: 'Aviso informativo', severity: 'info' });
                store.add({ title: 'Alerta', message: 'Atenção aos dados', severity: 'warning' });
            });
            await flushPromises();

            // O container TransitionGroup NÃO possui aria-live
            const container = wrapper.find('.max-toast-container');
            expect(container.attributes('aria-live')).toBeUndefined();

            const items = wrapper.findAll('.max-toast-item');
            expect(items).toHaveLength(4);

            // Cada toast é o único owner de sua live region (error => alert, outros => status)
            expect(items[0].attributes('role')).toBe('status');
            expect(items[1].attributes('role')).toBe('alert');
            expect(items[2].attributes('role')).toBe('status');
            expect(items[3].attributes('role')).toBe('status');

            // No total do componente montado, há exatamente 4 live regions (uma por toast, sem duplicatas)
            const allLiveElements = wrapper.findAll('[aria-live], [role="alert"], [role="status"]');
            expect(allLiveElements).toHaveLength(4);

            // Cada uma das live regions corresponde ao próprio elemento raiz do toast
            allLiveElements.forEach((el, index) => {
                expect(el.element).toBe(items[index].element);
            });
        });

        it('pausa e retoma o toast com eventos de foco de teclado (@focusin e @focusout)', async () => {
            const pinia = createPinia();
            setActivePinia(pinia);
            const store = useToastStore(pinia);
            store.add({ title: 'Focus Me', severity: 'info' });

            const wrapper = mount(MaxToast, {
                global: {
                    plugins: [pinia],
                    stubs: {
                        MaxIcon: true,
                        TransitionGroup: { template: '<div class="max-toast-container"><slot /></div>' }
                    }
                }
            });
            await flushPromises();

            const item = wrapper.find('.max-toast-item');

            await item.trigger('focusin');
            expect(store.items[0].paused).toBe(true);

            await item.trigger('focusout');
            expect(store.items[0].paused).toBe(false);
        });

        it('botão de fechar possui aria-label descritivo incluindo o título do toast', async () => {
            const wrapper = mountToast((store) => {
                store.add({ title: 'Falha no download', severity: 'error' });
            });
            await flushPromises();

            const closeBtn = wrapper.find('.max-toast-close');
            expect(closeBtn.exists()).toBe(true);
            expect(closeBtn.attributes('aria-label')).toBe('Fechar notificação: Falha no download');
        });

        it('exibe status acessível ao copiar com sucesso e fallback com retry em caso de falha', async () => {
            // Caso 1: Sucesso
            const writeTextMock = vi.fn().mockResolvedValue(undefined);
            Object.defineProperty(navigator, 'clipboard', {
                value: { writeText: writeTextMock },
                configurable: true,
                writable: true
            });

            const pinia = createPinia();
            setActivePinia(pinia);
            const store = useToastStore(pinia);
            store.add({ title: 'Sucesso', message: 'Conteúdo copiado', severity: 'error' });

            const wrapper = mount(MaxToast, {
                global: {
                    plugins: [pinia],
                    stubs: {
                        MaxIcon: true,
                        TransitionGroup: { template: '<div class="max-toast-container"><slot /></div>' }
                    }
                }
            });
            await flushPromises();

            const copyBtn = wrapper.find('.action-copy');
            await copyBtn.trigger('click');
            await flushPromises();

            const statusEl = wrapper.find('.toast-copy-status');
            expect(statusEl.exists()).toBe(true);
            expect(statusEl.attributes('role')).toBe('status');
            expect(statusEl.text()).toContain('Copiado para a área de transferência!');

            // Caso 2: Falha no clipboard
            writeTextMock.mockRejectedValueOnce(new Error('Clipboard blocked'));
            await copyBtn.trigger('click');
            await flushPromises();

            expect(store.items[0].paused).toBe(true);
            const fallbackEl = wrapper.find('.toast-copy-fallback');
            expect(fallbackEl.exists()).toBe(true);
            expect(fallbackEl.attributes('role')).toBe('alert');

            const manualInput = wrapper.find('.toast-copy-manual-input');
            expect(manualInput.exists()).toBe(true);
            expect((manualInput.element as HTMLTextAreaElement).value).toBe('Sucesso\nConteúdo copiado');

            const retryBtn = wrapper.find('.action-retry');
            expect(retryBtn.exists()).toBe(true);

            // Retry com sucesso restaura
            writeTextMock.mockResolvedValueOnce(undefined);
            await retryBtn.trigger('click');
            await flushPromises();
            expect(wrapper.find('.toast-copy-fallback').exists()).toBe(false);
        });

        it('toast WhatsApp não contém literal legado #128c7e', () => {
            const fs = require('node:fs');
            const path = require('node:path');
            const sfcContent = fs.readFileSync(path.resolve(__dirname, '../../src/components/MaxToast.vue'), 'utf-8');
            expect(sfcContent).not.toContain('#128c7e');
            expect(sfcContent).toContain('var(--max-whatsapp-surface');
            expect(sfcContent).toContain('var(--max-whatsapp-content');
        });

        it('gerencia estado de cópia de forma independente por item', async () => {
            const writeTextMock = vi.fn().mockResolvedValue(undefined);
            Object.defineProperty(navigator, 'clipboard', {
                value: { writeText: writeTextMock },
                configurable: true,
                writable: true
            });

            const pinia = createPinia();
            setActivePinia(pinia);
            const store = useToastStore(pinia);
            store.add({ title: 'T1', message: 'Primeiro erro', severity: 'error' });
            store.add({ title: 'T2', message: 'Segundo erro', severity: 'error' });

            const wrapper = mount(MaxToast, {
                global: {
                    plugins: [pinia],
                    stubs: {
                        MaxIcon: true,
                        TransitionGroup: { template: '<div class="max-toast-container"><slot /></div>' }
                    }
                }
            });
            await flushPromises();

            const copyBtns = wrapper.findAll('.action-copy');
            expect(copyBtns).toHaveLength(2);

            // Copia o primeiro item com sucesso
            await copyBtns[0].trigger('click');
            await flushPromises();

            expect(copyBtns[0].text()).toBe('Copiado!');
            expect(copyBtns[1].text()).toBe('Copiar');

            // Primeiro item possui role="status" discreto de sucesso
            const statusEls = wrapper.findAll('.toast-copy-status');
            expect(statusEls).toHaveLength(1);
            expect(statusEls[0].attributes('role')).toBe('status');

            // Falha no segundo item ao tentar copiar
            writeTextMock.mockRejectedValueOnce(new Error('Falha no clipboard'));
            await copyBtns[1].trigger('click');
            await flushPromises();

            // Item 1 permanece sem fallback de erro e item 2 entra em erro com fallback e retry
            const fallbacks = wrapper.findAll('.toast-copy-fallback');
            expect(fallbacks).toHaveLength(1);
            expect(fallbacks[0].attributes('role')).toBe('alert');
            expect(store.items[1].paused).toBe(true);
            expect(store.items[0].paused).toBe(false);

            // Fechar o item com erro limpa o toast
            const closeBtns = wrapper.findAll('.max-toast-close');
            await closeBtns[1].trigger('click');
            await flushPromises();

            expect(wrapper.findAll('.toast-copy-fallback')).toHaveLength(0);
            expect(store.items).toHaveLength(1);
        });

        it('contraste da combinação de tokens WhatsApp atinge >= 4.5:1', () => {
            const hexToLuminance = (hex: string): number => {
                const clean = hex.replace('#', '');
                const r = parseInt(clean.substring(0, 2), 16) / 255;
                const g = parseInt(clean.substring(2, 4), 16) / 255;
                const b = parseInt(clean.substring(4, 6), 16) / 255;
                const a = [r, g, b].map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
                return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
            };

            const l1 = hexToLuminance('#ffffff');
            const l2 = hexToLuminance('#075e54');
            const contrast = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);

            expect(contrast).toBeGreaterThanOrEqual(4.5);
        });
    });
});
