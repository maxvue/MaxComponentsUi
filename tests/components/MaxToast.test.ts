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
            // Sem live region aninhada: o .max-toast-item pai é o único live owner
            expect(statusEl.attributes('role')).toBeUndefined();
            expect(statusEl.attributes('aria-live')).toBeUndefined();
            expect(statusEl.text()).toContain('Copiado para a área de transferência!');

            // Garante que mesmo com cópia bem-sucedida, há exatamente 1 live region no total
            const liveElsAfterSuccess = wrapper.findAll('[aria-live], [role="alert"], [role="status"]');
            expect(liveElsAfterSuccess).toHaveLength(1);
            expect(liveElsAfterSuccess[0].element).toBe(wrapper.find('.max-toast-item').element);

            // Caso 2: Falha no clipboard
            writeTextMock.mockRejectedValueOnce(new Error('Clipboard blocked'));
            await copyBtn.trigger('click');
            await flushPromises();

            expect(store.items[0].paused).toBe(true);
            const fallbackEl = wrapper.find('.toast-copy-fallback');
            expect(fallbackEl.exists()).toBe(true);
            // Sem live region aninhada: o .max-toast-item pai é o único live owner
            expect(fallbackEl.attributes('role')).toBeUndefined();
            expect(fallbackEl.attributes('aria-live')).toBeUndefined();

            // Garante que mesmo com erro de cópia / fallback, há exatamente 1 live region no total
            const liveElsAfterError = wrapper.findAll('[aria-live], [role="alert"], [role="status"]');
            expect(liveElsAfterError).toHaveLength(1);
            expect(liveElsAfterError[0].element).toBe(wrapper.find('.max-toast-item').element);

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

        it('gerencia estado de cópia de forma independente por item sem aninhar live regions', async () => {
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

            // Primeiro item possui span de cópia, mas sem role live aninhado
            const statusEls = wrapper.findAll('.toast-copy-status');
            expect(statusEls).toHaveLength(1);
            expect(statusEls[0].attributes('role')).toBeUndefined();

            // Falha no segundo item ao tentar copiar
            writeTextMock.mockRejectedValueOnce(new Error('Falha no clipboard'));
            await copyBtns[1].trigger('click');
            await flushPromises();

            // Item 1 permanece sem fallback de erro e item 2 entra em erro com fallback e retry
            const fallbacks = wrapper.findAll('.toast-copy-fallback');
            expect(fallbacks).toHaveLength(1);
            expect(fallbacks[0].attributes('role')).toBeUndefined();
            expect(store.items[1].paused).toBe(true);
            expect(store.items[0].paused).toBe(false);

            // Continua havendo exatamente 2 live regions no componente (exatamente uma por item)
            const liveEls = wrapper.findAll('[aria-live], [role="alert"], [role="status"]');
            expect(liveEls).toHaveLength(2);
            const items = wrapper.findAll('.max-toast-item');
            expect(liveEls[0].element).toBe(items[0].element);
            expect(liveEls[1].element).toBe(items[1].element);

            // Fechar o item com erro limpa o toast
            const closeBtns = wrapper.findAll('.max-toast-close');
            await closeBtns[1].trigger('click');
            await flushPromises();

            expect(wrapper.findAll('.toast-copy-fallback')).toHaveLength(0);
            expect(store.items).toHaveLength(1);
            expect(wrapper.findAll('[aria-live], [role="alert"], [role="status"]')).toHaveLength(1);
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

    describe('Contrato de viewport móvel e safe-area (ui-design/toast-recortado-em-viewport-movel)', () => {
        it('renderiza conteúdo longo, ações e botão fechar com acessibilidade preservada', async () => {
            const longToken = 'https://example.com/api/v1/auth/verify?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyNDI2MjJ9';
            const wrapper = mountToast((store) => {
                store.add({
                    title: 'Falha de conexão com token muito longo',
                    message: `Ocorreu um erro no endpoint com parâmetro longo: ${longToken}`,
                    severity: 'error',
                    duration: 0
                });
            });
            await flushPromises();

            expect(wrapper.find('.max-toast-title').text()).toContain('Falha de conexão');
            expect(wrapper.find('.max-toast-message').text()).toContain(longToken);

            const expandBtn = wrapper.find('.action-expand');
            expect(expandBtn.exists()).toBe(true);

            const copyBtn = wrapper.find('.action-copy');
            expect(copyBtn.exists()).toBe(true);

            const closeBtn = wrapper.find('.max-toast-close');
            expect(closeBtn.exists()).toBe(true);
            expect(closeBtn.attributes('aria-label')).toContain('Fechar notificação');
        });

        it('valida o contrato de regras CSS no SFC (border-box, safe-area, minmax, overflow-wrap, breakpoint 480px)', async () => {
            const fs = await import('node:fs');
            const path = await import('node:path');
            const sfc = fs.readFileSync(path.resolve(__dirname, '../../src/components/MaxToast.vue'), 'utf-8');

            // Custom properties privadas para insets e offsets
            expect(sfc).toContain('--max-toast-viewport-gutter: 16px');
            expect(sfc).toContain('--max-toast-top-offset: 74px');
            expect(sfc).toMatch(/--max-toast-safe-top:\s*env\(safe-area-inset-top,\s*0px\)/);
            expect(sfc).toMatch(/--max-toast-safe-right:\s*env\(safe-area-inset-right,\s*0px\)/);
            expect(sfc).toMatch(/--max-toast-safe-bottom:\s*env\(safe-area-inset-bottom,\s*0px\)/);
            expect(sfc).toMatch(/--max-toast-safe-left:\s*env\(safe-area-inset-left,\s*0px\)/);

            // Container com box-sizing: border-box, clipping horizontal e scroll vertical
            expect(sfc).toMatch(/\.max-toast-container\s*\{[^}]*box-sizing:\s*border-box/);
            expect(sfc).toMatch(/\.max-toast-container\s*\{[^}]*overflow-x:\s*clip/);
            expect(sfc).toMatch(/\.max-toast-container\s*\{[^}]*overflow-y:\s*auto/);
            expect(sfc).toMatch(/\.max-toast-container\s*\{[^}]*overscroll-behavior:\s*contain/);

            // Item com border-box e trilha minmax(0, 1fr)
            expect(sfc).toMatch(/\.max-toast-item\s*\{[^}]*box-sizing:\s*border-box/);
            expect(sfc).toMatch(/\.max-toast-item\s*\{[^}]*grid-template-columns:\s*auto\s+minmax\(0,\s*1fr\)\s+auto/);

            // Quebra de texto anywhere e wrap de ações
            expect(sfc).toMatch(/\.max-toast-title\s*\{[^}]*overflow-wrap:\s*anywhere/);
            expect(sfc).toMatch(/\.max-toast-message\s*\{[^}]*overflow-wrap:\s*anywhere/);
            expect(sfc).toMatch(/\.max-toast-actions\s*\{[^}]*flex-wrap:\s*wrap/);

            // Breakpoint móvel <= 480px
            expect(sfc).toMatch(/@media\s*\(max-width:\s*480px\)\s*\{/);
        });
    });

    describe('Requisitos R14 / F21 - Live Regions e Concorrência', () => {
        it('mantém apenas um aria-live por toast e renderiza duas instâncias simultâneas', async () => {
            const wrapper = mountToast((store) => {
                store.add({ title: 'Notificação 1', severity: 'info', duration: 0 });
                store.add({ title: 'Notificação 2', severity: 'error', duration: 0 });
            });
            await flushPromises();

            const items = wrapper.findAll('.max-toast-item');
            expect(items).toHaveLength(2);

            const item1 = items[0];
            expect(item1.attributes('role')).toBe('status');
            expect(item1.findAll('[role="status"]')).toHaveLength(0);
            expect(item1.findAll('[role="alert"]')).toHaveLength(0);

            const item2 = items[1];
            expect(item2.attributes('role')).toBe('alert');
            expect(item2.findAll('[role="status"]')).toHaveLength(0);
            expect(item2.findAll('[role="alert"]')).toHaveLength(0);

            // Total de live regions no componente é exatamente 2 (uma por toast)
            const allLive = wrapper.findAll('[aria-live], [role="alert"], [role="status"]');
            expect(allLive).toHaveLength(2);
        });

        it('atualiza a mensagem do toast preservando o dono live único sem criar regiões aninhadas', async () => {
            let toastStoreInstance: any = null;
            let toastId: string = '';
            const wrapper = mountToast((store) => {
                toastStoreInstance = store;
                toastId = store.add({ title: 'Título', message: 'Mensagem inicial', severity: 'info', duration: 0 });
            });
            await flushPromises();

            let item = wrapper.find('.max-toast-item');
            expect(item.text()).toContain('Mensagem inicial');

            const index = toastStoreInstance.items.findIndex((t: any) => t.id === toastId);
            if (index !== -1) {
                const updatedToast = {
                    ...toastStoreInstance.items[index],
                    message: 'Mensagem atualizada'
                };
                toastStoreInstance.items.splice(index, 1, updatedToast);
            }

            await flushPromises();

            item = wrapper.find('.max-toast-item');
            expect(item.text()).toContain('Mensagem atualizada');
            expect(item.attributes('role')).toBe('status');
            expect(item.findAll('[role="status"]')).toHaveLength(0);
            expect(item.findAll('[role="alert"]')).toHaveLength(0);

            // Exatamente 1 live region no total
            expect(wrapper.findAll('[aria-live], [role="alert"], [role="status"]')).toHaveLength(1);
        });

        it('garante que duas instâncias concorrentes sob atualização não disparam anúncios redundantes nem colidem', async () => {
            let toastStoreInstance: any = null;
            let id1 = '';
            let id2 = '';

            const wrapper = mountToast((store) => {
                toastStoreInstance = store;
                id1 = store.add({ title: 'T1', message: 'Msg 1', severity: 'info', duration: 0 });
                id2 = store.add({ title: 'T2', message: 'Msg 2', severity: 'error', duration: 0 });
            });
            await flushPromises();

            // 2 live regions iniciais
            expect(wrapper.findAll('[aria-live], [role="alert"], [role="status"]')).toHaveLength(2);

            // Atualiza T1
            const idx1 = toastStoreInstance.items.findIndex((t: any) => t.id === id1);
            toastStoreInstance.items.splice(idx1, 1, {
                ...toastStoreInstance.items[idx1],
                message: 'Msg 1 Atualizada'
            });
            await flushPromises();

            // Permanece com exatamente 2 live regions
            expect(wrapper.findAll('[aria-live], [role="alert"], [role="status"]')).toHaveLength(2);

            // Atualiza T2
            const idx2 = toastStoreInstance.items.findIndex((t: any) => t.id === id2);
            toastStoreInstance.items.splice(idx2, 1, {
                ...toastStoreInstance.items[idx2],
                message: 'Msg 2 Erro Crítico'
            });
            await flushPromises();

            // Permanece com exatamente 2 live regions, sem filhos aninhados
            const items = wrapper.findAll('.max-toast-item');
            expect(items).toHaveLength(2);
            expect(items[0].attributes('role')).toBe('status');
            expect(items[0].findAll('[role="status"], [role="alert"]')).toHaveLength(0);
            expect(items[1].attributes('role')).toBe('alert');
            expect(items[1].findAll('[role="status"], [role="alert"]')).toHaveLength(0);
            expect(wrapper.findAll('[aria-live], [role="alert"], [role="status"]')).toHaveLength(2);
        });

        it('elimina live regions aninhadas mesmo após cópia bem-sucedida e erro de cópia simultâneos', async () => {
            const writeTextMock = vi.fn().mockImplementation((text: string) => {
                if (text.includes('Erro')) return Promise.reject(new Error('Falha'));
                return Promise.resolve();
            });
            Object.defineProperty(navigator, 'clipboard', {
                value: { writeText: writeTextMock },
                configurable: true,
                writable: true
            });

            const pinia = createPinia();
            setActivePinia(pinia);
            const store = useToastStore(pinia);
            store.add({ title: 'Sucesso', message: 'Operação concluída com sucesso com uma mensagem detalhada e informativa longa o suficiente para exibir ações', severity: 'info', duration: 0 });
            store.add({ title: 'Falha', message: 'Erro aqui', severity: 'error', duration: 0 });

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
            // Clica em copiar em ambos
            await copyBtns[0].trigger('click');
            await copyBtns[1].trigger('click');
            await flushPromises();

            // Toast 1 exibiu span de cópia e Toast 2 exibiu fallback com textarea
            expect(wrapper.find('.toast-copy-status').exists()).toBe(true);
            expect(wrapper.find('.toast-copy-fallback').exists()).toBe(true);

            // NENHUM nó filho tem role="status" ou role="alert"
            const items = wrapper.findAll('.max-toast-item');
            expect(items[0].findAll('[role="status"], [role="alert"]')).toHaveLength(0);
            expect(items[1].findAll('[role="status"], [role="alert"]')).toHaveLength(0);

            // Exatamente 2 live regions no componente inteiro
            const allLive = wrapper.findAll('[aria-live], [role="alert"], [role="status"]');
            expect(allLive).toHaveLength(2);
            expect(allLive[0].element).toBe(items[0].element);
            expect(allLive[1].element).toBe(items[1].element);
        });
    });
});
