import { describe, it, expect } from 'vitest';
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

    it('desmontar MaxToast executa toastStore.clear() limpando items e timers da store', async () => {
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

        expect(store.items.length).toBe(0);
    });

    describe('Acessibilidade (Etapa 5.1)', () => {
        it('container de toasts possui role="region", aria-live="polite", aria-atomic="false" e aria-label="Notificações"', () => {
            const wrapper = mountToast();
            const container = wrapper.find('.max-toast-container');
            expect(container.exists()).toBe(true);
            expect(container.attributes('role')).toBe('region');
            expect(container.attributes('aria-live')).toBe('polite');
            expect(container.attributes('aria-atomic')).toBe('false');
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
    });
});
