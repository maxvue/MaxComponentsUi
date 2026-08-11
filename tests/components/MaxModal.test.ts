import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxModal from '../../src/components/MaxModal.vue';
import { useModalStore } from '../../src/stores/useModal.Store';

const mountedWrappers: any[] = [];

function mountModal(props: Record<string, any> = {}, slots: Record<string, any> = {}, options: Record<string, any> = {}) {
    const wrapper = mount(MaxModal, {
        props: { icon: 'mdi:cog', ...props },
        slots,
        global: {
            stubs: {
                MaxButton: {
                    template: '<button class="max-button"><slot /></button>',
                    props: ['icon', 'i', 'label', 'size']
                },
                MaxIconButton: {
                    template: '<button class="icon-button"></button>',
                    props: ['icon', 'i', 'size']
                },
                MaxTitle1: {
                    template: '<div class="title"></div>',
                    props: ['h1', 'h2']
                },
                MaxGrid: {
                    template: '<div class="grid"><slot /></div>',
                    props: ['label']
                },
                Teleport: true
            }
        },
        ...options
    });
    mountedWrappers.push(wrapper);
    return wrapper;
}

describe('MaxModal', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        useModalStore().hide();
        document.body.style.overflow = '';
    });

    afterEach(() => {
        while (mountedWrappers.length > 0) {
            const w = mountedWrappers.pop();
            try { w.unmount(); } catch {}
        }
        useModalStore().hide();
        document.body.innerHTML = '';
        document.body.style.overflow = '';
    });

    it('renderiza corretamente', () => {
        const wrapper = mountModal();
        expect(wrapper.find('.max-modal-item').exists()).toBe(true);
    });

    it('expõe método toggle via defineExpose', () => {
        const wrapper = mountModal();
        const vm = wrapper.vm as any;
        expect(typeof vm.toggle).toBe('function');
    });

    it('integra com useModalStore', () => {
        const store = useModalStore();
        expect(store.show_id).toBe(null);
    });

    it('aceita título e subtítulo', () => {
        const wrapper = mountModal({
            title: 'Configurações',
            subTitle: 'Ajuste suas preferências'
        });
        expect(wrapper.exists()).toBe(true);
    });

    it('aceita slot de conteúdo', () => {
        const wrapper = mountModal({}, {
            content: '<p>Conteúdo do modal</p>'
        });
        expect(wrapper.exists()).toBe(true);
    });

    it('aceita slot de botão customizado', () => {
        const wrapper = mountModal({}, {
            button: '<button class="custom-btn">Abrir</button>'
        });
        expect(wrapper.find('.custom-btn').exists()).toBe(true);
    });

    it('abre o modal chamando toggle() e aciona timers', async () => {
        vi.useFakeTimers();
        const wrapper = mountModal();
        const vm = wrapper.vm as any;
        const store = useModalStore();

        expect(store.show_id).toBe(null);

        // Chamada de toggle para ABRIR o modal
        vm.toggle();
        expect(store.show_id).toBe(vm.id);

        // Avança o timer do setTimeout(..., 1)
        vi.advanceTimersByTime(2);

        // Tentar chamar de novo logo em seguida não deve fazer nada devido ao is_changing
        vm.toggle();
        expect(store.show_id).toBe(vm.id); // ainda o mesmo

        // Avança 500ms para passar com folga do refAutoReset(400) do is_changing
        vi.advanceTimersByTime(500);
        vm.is_changing = false; // Força para false caso refAutoReset não tenha disparado no fake timer

        // Agora chama toggle para FECHAR o modal
        vm.toggle();

        // Timeout 1
        vi.advanceTimersByTime(10);
        // Timeout 2 (300ms)
        vi.advanceTimersByTime(350);

        expect(store.show_id).toBe(null); // deve ter removido da store

        vi.useRealTimers();
    });

    it('renderiza o conteúdo do modal quando aberto', async () => {
        const wrapper = mountModal({
            title: 'Test Title',
            subTitle: 'Test Subtitle'
        });
        const vm = wrapper.vm as any;
        const store = useModalStore();

        vm.toggle();
        await wrapper.vm.$nextTick();

        expect(store.show_id).toBe(vm.id);
        const bg = wrapper.find('.background-modal');
        expect(bg.exists()).toBe(true);
        expect(wrapper.find('.max-modal-header').exists()).toBe(true);

        // Testa o click.stop vazio
        const maxModal = wrapper.find('.max-modal');
        await maxModal.trigger('click');

        // Testa fechamento via botão X e background
        await bg.trigger('click');
        expect(store.show_id).toBe(null);
    });

    it('show() (sem argumento) abre o modal chamando open() internamente', () => {
        vi.useFakeTimers();
        const wrapper = mountModal();
        const vm = wrapper.vm as any;
        const store = useModalStore();

        expect(store.show_id).toBe(null);

        // Chamada sem argumento, como um consumidor externo faria via template ref
        vm.show();

        expect(store.show_id).toBe(vm.id);

        vi.useRealTimers();
    });

    it('hide() (sem argumento) fecha o modal chamando close() internamente', () => {
        vi.useFakeTimers();
        const wrapper = mountModal();
        const vm = wrapper.vm as any;
        const store = useModalStore();

        vm.open();
        expect(store.show_id).toBe(vm.id);

        vm.hide();
        vi.advanceTimersByTime(400);

        expect(store.show_id).toBe(null);

        vi.useRealTimers();
    });

    it('expõe open() e close() via defineExpose', () => {
        const wrapper = mountModal();
        const vm = wrapper.vm as any;
        expect(typeof vm.open).toBe('function');
        expect(typeof vm.close).toBe('function');
    });

    it('open() abre e é idempotente (chamadas repetidas não alteram nada)', () => {
        const wrapper = mountModal();
        const vm = wrapper.vm as any;
        const store = useModalStore();

        vm.open();
        expect(store.show_id).toBe(vm.id);

        // Chamar novamente não deve fazer nada (idempotente)
        vm.open();
        expect(store.show_id).toBe(vm.id);
    });

    it('close() fecha preservando a animação de saída (opacity -> 0, depois remove após 300ms)', () => {
        vi.useFakeTimers();
        const wrapper = mountModal();
        const vm = wrapper.vm as any;
        const store = useModalStore();

        vm.open();
        expect(store.show_id).toBe(vm.id);

        vm.close();

        // Ainda não removido: aguardando a animação de saída
        expect(store.show_id).toBe(vm.id);

        // Timeout 1 (1ms) zera opacity
        vi.advanceTimersByTime(2);
        expect(vm.style.opacity).toBe(0);
        expect(store.show_id).toBe(vm.id); // ainda presente durante a transição CSS

        // Timeout 2 (300ms) remove de fato
        vi.advanceTimersByTime(350);
        expect(store.show_id).toBe(null);

        // Idempotente: chamar close() de novo não faz nada
        vm.close();
        expect(store.show_id).toBe(null);

        vi.useRealTimers();
    });

    it('open() -> close() -> open() em sequência rápida NÃO é descartado pelo guard de 400ms', () => {
        vi.useFakeTimers();
        const wrapper = mountModal();
        const vm = wrapper.vm as any;
        const store = useModalStore();

        // Abre
        vm.open();
        expect(store.show_id).toBe(vm.id);
        vi.advanceTimersByTime(2);

        // Fecha imediatamente (bem antes dos 400ms do guard de toggle())
        vm.close();
        vi.advanceTimersByTime(2); // dispara o setTimeout(1) que zera opacity

        // Reabre ANTES dos 300ms de saída completarem e ANTES dos 400ms do guard
        vm.open();

        // open() reafirma imediatamente o show_id (sem esperar timers)
        expect(store.show_id).toBe(vm.id);

        vi.advanceTimersByTime(500);

        // Resultado final determinístico: modal aberto
        expect(store.show_id).toBe(vm.id);
        expect(vm.style.opacity).toBe(1);

        vi.useRealTimers();
    });

    it('desmontar MaxModal enquanto aberto limpa show_id da store global', () => {
        const wrapper = mountModal();
        const vm = wrapper.vm as any;
        const store = useModalStore();

        vm.open();
        expect(store.show_id).toBe(vm.id);

        wrapper.unmount();
        expect(store.show_id).toBe(null);
    });

    it('fechar e desmontar MaxModal imediatamente nao deixa timers mutarem a store', () => {
        vi.useFakeTimers();
        const wrapper = mountModal();
        const vm = wrapper.vm as any;
        const store = useModalStore();

        vm.open();
        vm.close();

        wrapper.unmount();

        const spyHide = vi.spyOn(store, 'hide');

        vi.advanceTimersByTime(500);

        expect(store.show_id).toBe(null);
        expect(spyHide).not.toHaveBeenCalled();

        spyHide.mockRestore();
        vi.useRealTimers();
    });

    describe('Acessibilidade (Etapa 5.1)', () => {
        afterEach(() => {
            const store = useModalStore();
            store.hide();
            document.body.innerHTML = '';
            document.body.style.overflow = '';
            setActivePinia(createPinia());
        });

        it('aplica role="dialog" e aria-modal="true" no painel do modal', async () => {
            const wrapper = mountModal({ title: 'Título Teste' });
            const vm = wrapper.vm as any;
            vm.open();
            await wrapper.vm.$nextTick();

            const modalEl = wrapper.find('.max-modal');
            expect(modalEl.exists()).toBe(true);
            expect(modalEl.attributes('role')).toBe('dialog');
            expect(modalEl.attributes('aria-modal')).toBe('true');
        });

        it('vincula aria-labelledby ao título do modal ou aplica aria-label', async () => {
            const wrapper = mountModal({ title: 'Título Teste' });
            const vm = wrapper.vm as any;
            vm.open();
            await wrapper.vm.$nextTick();

            const modalEl = wrapper.find('.max-modal');
            const labelledBy = modalEl.attributes('aria-labelledby');
            expect(labelledBy).toBeTruthy();
            expect(wrapper.find(`#${labelledBy}`).exists()).toBe(true);
        });

        it('aplica aria-label="Fechar" no botão de fechar', async () => {
            const wrapper = mount(MaxModal, {
                props: { icon: 'mdi:cog' },
                global: {
                    stubs: { Teleport: true }
                }
            });
            const vm = wrapper.vm as any;
            vm.open();
            await wrapper.vm.$nextTick();

            const closeBtn = wrapper.find('.close-btn');
            expect(closeBtn.exists()).toBe(true);
            expect(closeBtn.attributes('aria-label')).toBe('Fechar');
        });

        it('fecha o modal com a tecla Escape por padrão', async () => {
            vi.useFakeTimers();
            const wrapper = mountModal({}, {}, { attachTo: document.body });
            const vm = wrapper.vm as any;
            const store = useModalStore();

            vm.open();
            await wrapper.vm.$nextTick();
            expect(store.show_id).toBe(vm.id);

            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
            vi.advanceTimersByTime(350);

            expect(store.show_id).toBe(null);
            vi.useRealTimers();
        });

        it('respeita closeOnEscape false', async () => {
            vi.useFakeTimers();
            const wrapper = mountModal({ closeOnEscape: false });
            const vm = wrapper.vm as any;
            const store = useModalStore();

            vm.open();
            await wrapper.vm.$nextTick();
            expect(store.show_id).toBe(vm.id);

            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
            vi.advanceTimersByTime(350);

            expect(store.show_id).toBe(vm.id);
            vi.useRealTimers();
        });

        it('trava o scroll do body com blockScroll', async () => {
            vi.useFakeTimers();
            document.body.style.overflow = '';
            const wrapper = mountModal({ blockScroll: true });
            const vm = wrapper.vm as any;

            vm.open();
            await wrapper.vm.$nextTick();
            expect(document.body.style.overflow).toBe('hidden');

            vm.close();
            vi.advanceTimersByTime(10);
            vi.advanceTimersByTime(350);
            await wrapper.vm.$nextTick();
            expect(document.body.style.overflow).toBe('');
            wrapper.unmount();
            vi.useRealTimers();
        });

        it('restaura o scroll do body ao desmontar aberto', async () => {
            document.body.style.overflow = '';
            const wrapper = mountModal({ blockScroll: true });
            const vm = wrapper.vm as any;

            vm.open();
            await wrapper.vm.$nextTick();
            expect(document.body.style.overflow).toBe('hidden');

            wrapper.unmount();
            expect(document.body.style.overflow).toBe('');
        });

        it('ativa focus trap e restaura foco ao fechar', async () => {
            const botaoOrigem = document.createElement('button');
            botaoOrigem.id = 'origem';
            document.body.appendChild(botaoOrigem);
            botaoOrigem.focus();

            const wrapper = mount(MaxModal, {
                props: { icon: 'mdi:cog' },
                slots: {
                    content: '<button id="interno">Interno</button>'
                },
                attachTo: document.body
            });
            const vm = wrapper.vm as any;
            const store = useModalStore();

            vm.open();
            await wrapper.vm.$nextTick();
            await wrapper.vm.$nextTick();

            expect(document.activeElement?.id).toBe('interno');

            store.hide();
            await wrapper.vm.$nextTick();

            expect(document.activeElement).toBe(botaoOrigem);
            document.body.removeChild(botaoOrigem);
        });
    });
});
