import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import * as sass from 'sass';
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
                    props: ['h1', 'h2', 'title', 'subtitle', 'subTitle']
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

    it('abre e fecha o modal chamando toggle() sem trava artificial de 400ms', async () => {
        const wrapper = mountModal();
        const vm = wrapper.vm as any;
        const store = useModalStore();

        expect(store.show_id).toBe(null);

        // Chamada de toggle para ABRIR o modal
        vm.toggle();
        expect(store.show_id).toBe(vm.id);
        expect(vm.is_show).toBe(true);

        // Chamada de toggle imediata para FECHAR o modal responde fluentemente
        vm.toggle();
        expect(store.show_id).toBe(null);
        expect(vm.is_show).toBe(false);
    });

    it('renderiza o conteúdo do modal quando aberto', async () => {
        vi.useFakeTimers();
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
        vi.advanceTimersByTime(350);
        expect(store.show_id).toBe(null);
        vi.useRealTimers();
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

    it('close() fecha imediatamente atualizando a store e é idempotente', () => {
        const wrapper = mountModal();
        const vm = wrapper.vm as any;
        const store = useModalStore();

        vm.open();
        expect(store.show_id).toBe(vm.id);

        vm.close();
        expect(store.show_id).toBe(null);
        expect(vm.is_show).toBe(false);

        // Idempotente: chamar close() de novo não faz nada
        vm.close();
        expect(store.show_id).toBe(null);
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
            while (mountedWrappers.length > 0) {
                const w = mountedWrappers.pop();
                try { w.unmount(); } catch {}
            }
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
            const wrapper = mountModal({ icon: 'mdi:cog' });
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

            const wrapper = mountModal(
                { icon: 'mdi:cog', noHeader: true },
                { content: '<button id="interno">Interno</button>' },
                { attachTo: document.body }
            );
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

    describe('Layout e Padding (Mobile e Desktop)', () => {
        it('não injeta padding inline quando a prop padding não for informada', async () => {
            const wrapper = mountModal();
            const vm = wrapper.vm as any;
            vm.open();
            await wrapper.vm.$nextTick();

            const modalEl = wrapper.find('.max-modal');
            expect(modalEl.exists()).toBe(true);
            const style = modalEl.attributes('style') ?? '';
            expect(style).not.toMatch(/padding:/);
        });

        it('aplica padding inline quando a prop padding for informada como string ou número', async () => {
            const wrapperString = mountModal({ padding: '30px' });
            (wrapperString.vm as any).open();
            await wrapperString.vm.$nextTick();

            const modalString = wrapperString.find('.max-modal');
            expect(modalString.attributes('style')).toContain('padding: 30px');

            const wrapperNumber = mountModal({ padding: 16 });
            (wrapperNumber.vm as any).open();
            await wrapperNumber.vm.$nextTick();

            const modalNumber = wrapperNumber.find('.max-modal');
            expect(modalNumber.attributes('style')).toContain('padding: 16px');
        });
    });

    describe('Barras de rolagem invisíveis (0px de largura)', () => {
        it('declara regras CSS para barras de rolagem internas invisíveis (0px de largura e altura) no MaxModal e descendentes', () => {
            const sfc = readFileSync(resolve(__dirname, '../../src/components/MaxModal.vue'), 'utf-8');
            const styleMatch = /<style[^>]*>([\s\S]*?)<\/style>/.exec(sfc);
            expect(styleMatch).not.toBeNull();

            const compiledCss = sass.compileString(styleMatch![1]).css;

            // Valida no container raiz do modal .max-modal
            expect(compiledCss).toMatch(/\.max-modal\s*\{[^}]*scrollbar-width:\s*none/);
            expect(compiledCss).toMatch(/\.max-modal\s*\{[^}]*-ms-overflow-style:\s*none/);
            expect(compiledCss).toMatch(/\.max-modal::-webkit-scrollbar\s*\{[^}]*width:\s*0/);
            expect(compiledCss).toMatch(/\.max-modal::-webkit-scrollbar\s*\{[^}]*height:\s*0/);

            // Valida nos elementos internos descendentes .max-modal *
            expect(compiledCss).toMatch(/\.max-modal\s+\*\s*\{[^}]*scrollbar-width:\s*none/);
            expect(compiledCss).toMatch(/\.max-modal\s+\*\s*\{[^}]*-ms-overflow-style:\s*none/);
            expect(compiledCss).toMatch(/\.max-modal\s+\*::-webkit-scrollbar\s*\{[^}]*width:\s*0/);
            expect(compiledCss).toMatch(/\.max-modal\s+\*::-webkit-scrollbar\s*\{[^}]*height:\s*0/);
        });
    });

    describe('Proteção contra fechamento acidental e retenção (Etapa 09)', () => {
        it('com dismissable: false, clicar no backdrop não fecha o modal e aciona a classe is-shaking por 400ms', async () => {
            vi.useFakeTimers();
            const wrapper = mountModal({ dismissable: false });
            const vm = wrapper.vm as any;
            const store = useModalStore();

            vm.open();
            await wrapper.vm.$nextTick();
            expect(store.show_id).toBe(vm.id);

            const bg = wrapper.find('.background-modal');
            await bg.trigger('click');

            // Não deve fechar o modal
            expect(store.show_id).toBe(vm.id);
            expect(wrapper.find('.max-modal').classes()).toContain('is-shaking');

            // Após 400ms a classe is-shaking é removida
            vi.advanceTimersByTime(400);
            await wrapper.vm.$nextTick();
            expect(wrapper.find('.max-modal').classes()).not.toContain('is-shaking');
            expect(store.show_id).toBe(vm.id);

            vi.useRealTimers();
        });

        it('com dismissable: true (padrão), clicar no backdrop fecha o modal', async () => {
            vi.useFakeTimers();
            const wrapper = mountModal();
            const vm = wrapper.vm as any;
            const store = useModalStore();

            vm.open();
            await wrapper.vm.$nextTick();
            expect(store.show_id).toBe(vm.id);

            const bg = wrapper.find('.background-modal');
            await bg.trigger('click');
            vi.advanceTimersByTime(350);

            expect(store.show_id).toBe(null);
            vi.useRealTimers();
        });

        it('intercepta fechamento preventivo via prop beforeClose', async () => {
            vi.useFakeTimers();
            let doneCallback: (() => void) | null = null;
            const beforeClose = vi.fn((done: () => void) => {
                doneCallback = done;
            });

            const wrapper = mountModal({ beforeClose });
            const vm = wrapper.vm as any;
            const store = useModalStore();

            vm.open();
            await wrapper.vm.$nextTick();
            expect(store.show_id).toBe(vm.id);

            // Clica no backdrop
            const bg = wrapper.find('.background-modal');
            await bg.trigger('click');

            expect(beforeClose).toHaveBeenCalledTimes(1);
            expect(doneCallback).toBeTruthy();
            // Modal continua aberto aguardando confirmação
            expect(store.show_id).toBe(vm.id);

            // Invoca done() para confirmar o encerramento
            doneCallback!();
            vi.advanceTimersByTime(350);
            expect(store.show_id).toBe(null);

            vi.useRealTimers();
        });

        it('fechamento preventivo via callback síncrono é estritamente idempotente', async () => {
            const beforeClose = vi.fn((done: () => void) => {
                done();
            });

            const wrapper = mountModal({ beforeClose, modelValue: true });
            const vm = wrapper.vm as any;
            const store = useModalStore();

            expect(store.show_id).toBe(vm.id);

            vm.requestClose('button');
            await wrapper.vm.$nextTick();

            expect(beforeClose).toHaveBeenCalledTimes(1);
            expect(wrapper.emitted('hide')?.length).toBe(1);
            expect(wrapper.emitted('update:modelValue')?.length).toBe(1);
            expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false]);
            expect(store.isOpen(vm.id)).toBe(false);
        });

        it('fechamento com done() chamado duas vezes é estritamente idempotente (1 hide, 1 update, 1 pop)', async () => {
            const beforeClose = vi.fn((done: () => void) => {
                done();
                done();
            });

            const wrapper = mountModal({ beforeClose, modelValue: true });
            const vm = wrapper.vm as any;
            const store = useModalStore();
            const popSpy = vi.spyOn(store, 'pop');

            expect(store.show_id).toBe(vm.id);

            vm.requestClose('button');
            await wrapper.vm.$nextTick();

            expect(beforeClose).toHaveBeenCalledTimes(1);
            expect(wrapper.emitted('hide')?.length).toBe(1);
            expect(wrapper.emitted('update:modelValue')?.length).toBe(1);
            expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false]);
            expect(popSpy).toHaveBeenCalledTimes(1);
            expect(store.isOpen(vm.id)).toBe(false);

            popSpy.mockRestore();
        });

        it('fechamento com Promises concorrentes que chamam done() é estritamente idempotente', async () => {
            let doneFn: (() => void) | null = null;
            const beforeClose = vi.fn((done: () => void) => {
                doneFn = done;
            });

            const wrapper = mountModal({ beforeClose, modelValue: true });
            const vm = wrapper.vm as any;
            const store = useModalStore();
            const popSpy = vi.spyOn(store, 'pop');

            vm.requestClose('api');
            await wrapper.vm.$nextTick();

            expect(doneFn).toBeTruthy();

            // Simula resolução concorrente de múltiplas promises chamando done
            await Promise.all([
                Promise.resolve().then(() => doneFn!()),
                Promise.resolve().then(() => doneFn!()),
                Promise.resolve().then(() => doneFn!())
            ]);
            await wrapper.vm.$nextTick();

            expect(wrapper.emitted('hide')?.length).toBe(1);
            expect(wrapper.emitted('update:modelValue')?.length).toBe(1);
            expect(popSpy).toHaveBeenCalledTimes(1);
            expect(store.isOpen(vm.id)).toBe(false);

            popSpy.mockRestore();
        });

        it('reabrir o modal antes do término de fechamento descarta chamada tardia de done (geração coerente)', async () => {
            let doneFn: (() => void) | null = null;
            const beforeClose = vi.fn((done: () => void) => {
                doneFn = done;
            });

            const wrapper = mountModal({ beforeClose });
            const vm = wrapper.vm as any;
            const store = useModalStore();

            vm.open();
            await wrapper.vm.$nextTick();
            expect(store.isOpen(vm.id)).toBe(true);

            // Inicia fechamento
            vm.requestClose('api');
            await wrapper.vm.$nextTick();
            expect(vm.isClosing).toBe(true);

            // Reabre o modal antes de done() ser chamado
            vm.open();
            await wrapper.vm.$nextTick();
            expect(vm.isClosing).toBe(false);
            expect(store.isOpen(vm.id)).toBe(true);

            // Agora o done() antigo é invocado tardiamente
            doneFn!();
            await wrapper.vm.$nextTick();

            // O modal deve permanecer aberto porque a geração mudou
            expect(store.isOpen(vm.id)).toBe(true);
            expect(wrapper.emitted('hide')).toBeFalsy();
        });

        it('emite evento before-close ao fechar quando beforeClose não é fornecido', async () => {
            vi.useFakeTimers();
            const wrapper = mountModal();
            const vm = wrapper.vm as any;
            const store = useModalStore();

            vm.open();
            await wrapper.vm.$nextTick();
            expect(store.show_id).toBe(vm.id);

            const bg = wrapper.find('.background-modal');
            await bg.trigger('click');

            expect(wrapper.emitted('before-close')).toBeTruthy();
            vi.advanceTimersByTime(350);
            expect(store.show_id).toBe(null);

            vi.useRealTimers();
        });

        it('bloqueia rolagem do body por padrão (blockScroll: true)', async () => {
            document.body.style.overflow = '';
            const wrapper = mountModal();
            const vm = wrapper.vm as any;

            vm.open();
            await wrapper.vm.$nextTick();
            expect(document.body.style.overflow).toBe('hidden');

            wrapper.unmount();
            expect(document.body.style.overflow).toBe('');
        });
    });

    describe('Modal Stack e v-model:visible (Etapa 12)', () => {
        it('opera em modo controlado com v-model:visible', async () => {
            const wrapper = mountModal({ visible: false });
            const vm = wrapper.vm as any;
            const store = useModalStore();

            expect(vm.is_show).toBe(false);
            expect(wrapper.find('.background-modal').exists()).toBe(false);

            await wrapper.setProps({ visible: true });
            await wrapper.vm.$nextTick();
            expect(vm.is_show).toBe(true);
            expect(wrapper.find('.background-modal').exists()).toBe(true);
            expect(store.isOpen(vm.id)).toBe(true);

            // Ao chamar close() no componente, emite update:visible = false
            vm.close();
            await wrapper.vm.$nextTick();
            expect(wrapper.emitted('update:visible')).toBeTruthy();
            expect(wrapper.emitted('update:visible')![0]).toEqual([false]);
        });

        it('mantém múltiplos modais montados simultaneamente quando empilhados', async () => {
            const wrapper1 = mountModal({ id: 'modal-1', title: 'Modal 1' });
            const wrapper2 = mountModal({ id: 'modal-2', title: 'Modal 2' });
            const vm1 = wrapper1.vm as any;
            const vm2 = wrapper2.vm as any;
            const store = useModalStore();

            vm1.open();
            await wrapper1.vm.$nextTick();
            expect(store.stack).toEqual(['modal-1']);
            expect(vm1.is_show).toBe(true);

            vm2.open();
            await wrapper2.vm.$nextTick();
            expect(store.stack).toEqual(['modal-1', 'modal-2']);
            expect(vm1.is_show).toBe(true);
            expect(vm2.is_show).toBe(true);

            // O modal 1 continua montado no DOM
            expect(wrapper1.find('.background-modal').exists()).toBe(true);
            expect(wrapper2.find('.background-modal').exists()).toBe(true);

            // Fechar modal 2 mantém modal 1 aberto
            vm2.close();
            await wrapper2.vm.$nextTick();
            expect(store.stack).toEqual(['modal-1']);
            expect(vm1.is_show).toBe(true);
            expect(wrapper1.find('.background-modal').exists()).toBe(true);
        });

        it('fecha somente o modal do topo ao pressionar Escape', async () => {
            const wrapper1 = mountModal({ id: 'modal-1', title: 'Modal 1' }, {}, { attachTo: document.body });
            const wrapper2 = mountModal({ id: 'modal-2', title: 'Modal 2' }, {}, { attachTo: document.body });
            const vm1 = wrapper1.vm as any;
            const vm2 = wrapper2.vm as any;
            const store = useModalStore();

            vm1.open();
            await wrapper1.vm.$nextTick();

            vm2.open();
            await wrapper2.vm.$nextTick();

            expect(store.stack).toEqual(['modal-1', 'modal-2']);
            expect(store.isTop('modal-2')).toBe(true);
            expect(store.isTop('modal-1')).toBe(false);

            // Pressiona Escape: apenas modal 2 deve fechar
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
            await wrapper2.vm.$nextTick();

            expect(store.stack).toEqual(['modal-1']);
            expect(vm1.is_show).toBe(true);
            expect(vm2.is_show).toBe(false);
        });

        it('calcula z-index progressivo para modais aninhados', async () => {
            const wrapper1 = mountModal({ id: 'modal-1', title: 'Modal 1' });
            const wrapper2 = mountModal({ id: 'modal-2', title: 'Modal 2' });
            const vm1 = wrapper1.vm as any;
            const vm2 = wrapper2.vm as any;

            vm1.open();
            await wrapper1.vm.$nextTick();

            vm2.open();
            await wrapper2.vm.$nextTick();

            const bg1 = wrapper1.find('.background-modal');
            const bg2 = wrapper2.find('.background-modal');

            // z-index semântico de modal backdrop com incremento por profundidade
            expect(bg1.attributes('style')).toContain('var(--max-layer-modal-backdrop, 1300)');
            expect(bg2.attributes('style')).toContain('calc(var(--max-layer-modal-backdrop, 1300) + 20)');
        });

        it('marca camadas inferiores com aria-hidden e inert mantendo apenas o topo acessível', async () => {
            const wrapper1 = mountModal({ id: 'modal-1', title: 'Modal 1' });
            const wrapper2 = mountModal({ id: 'modal-2', title: 'Modal 2' });
            const vm1 = wrapper1.vm as any;
            const vm2 = wrapper2.vm as any;

            vm1.open();
            await wrapper1.vm.$nextTick();

            const modal1 = wrapper1.find('.max-modal');
            expect(modal1.attributes('aria-modal')).toBe('true');
            expect(modal1.attributes('aria-hidden')).toBeUndefined();
            expect(modal1.attributes('inert')).toBeUndefined();

            vm2.open();
            await wrapper2.vm.$nextTick();

            const modal2 = wrapper2.find('.max-modal');
            expect(modal2.attributes('aria-modal')).toBe('true');
            expect(modal2.attributes('aria-hidden')).toBeUndefined();

            // Modal 1 agora é camada inferior
            expect(modal1.attributes('aria-hidden')).toBe('true');
            expect(modal1.attributes('inert')).toBeDefined();

            // Ao fechar modal 2, modal 1 volta a ser o topo
            vm2.close();
            await wrapper1.vm.$nextTick();

            expect(modal1.attributes('aria-modal')).toBe('true');
            expect(modal1.attributes('aria-hidden')).toBeUndefined();
            expect(modal1.attributes('inert')).toBeUndefined();
        });

        it('fornece nome acessível padrão quando noHeader é true ou via ariaLabel', async () => {
            const wrapperNoHeader = mountModal({ noHeader: true });
            const vmNoHeader = wrapperNoHeader.vm as any;
            vmNoHeader.open();
            await wrapperNoHeader.vm.$nextTick();

            const modalNoHeader = wrapperNoHeader.find('.max-modal');
            expect(modalNoHeader.attributes('aria-label')).toBe('Diálogo');

            const wrapperCustomAria = mountModal({ noHeader: true, ariaLabel: 'Detalhes da Fatura' });
            const vmCustomAria = wrapperCustomAria.vm as any;
            vmCustomAria.open();
            await wrapperCustomAria.vm.$nextTick();

            const modalCustomAria = wrapperCustomAria.find('.max-modal');
            expect(modalCustomAria.attributes('aria-label')).toBe('Detalhes da Fatura');
        });

        it('unifica encerramento via método exposto requestClose', async () => {
            const wrapper = mountModal();
            const vm = wrapper.vm as any;
            const store = useModalStore();

            vm.open();
            await wrapper.vm.$nextTick();
            expect(store.show_id).toBe(vm.id);

            vm.requestClose('api');
            await wrapper.vm.$nextTick();
            expect(store.show_id).toBeNull();
        });
    });

    describe('Accessible Name efetivo e Fallbacks (R08)', () => {
        function computeAccessibleName(el: Element): string {
            const labelledby = el.getAttribute('aria-labelledby');
            if (labelledby) {
                const text = labelledby
                    .split(/\s+/)
                    .map((id) => {
                        const target = document.getElementById(id);
                        if (!target) return '';
                        if (target.hidden || target.getAttribute('aria-hidden') === 'true') return '';
                        if (target.style?.display === 'none' || target.style?.visibility === 'hidden') return '';
                        return (target.innerText || target.textContent || '').trim();
                    })
                    .filter(Boolean)
                    .join(' ');
                if (text) return text;
            }
            const label = el.getAttribute('aria-label');
            if (label && label.trim()) return label.trim();

            return '';
        }

        it('fornece fallback de accessible name "Diálogo" quando slot header é vazio', async () => {
            const wrapper = mountModal({}, {
                header: '   '
            }, { attachTo: document.body });
            const vm = wrapper.vm as any;

            vm.open();
            await wrapper.vm.$nextTick();

            const modalEl = wrapper.find('.max-modal').element;
            expect(modalEl.getAttribute('aria-labelledby')).toBeNull();
            expect(modalEl.getAttribute('aria-label')).toBe('Diálogo');
            expect(computeAccessibleName(modalEl)).toBe('Diálogo');
            wrapper.unmount();
        });

        it('fornece fallback de accessible name quando title é vazio ou apenas whitespace', async () => {
            const wrapper = mountModal({ title: '   ' }, {}, { attachTo: document.body });
            const vm = wrapper.vm as any;

            vm.open();
            await wrapper.vm.$nextTick();

            const modalEl = wrapper.find('.max-modal').element;
            expect(modalEl.getAttribute('aria-label')).toBe('Diálogo');
            expect(computeAccessibleName(modalEl)).toBe('Diálogo');
            wrapper.unmount();
        });

        it('ignora ariaLabelledby que aponta para ID inexistente no DOM e usa fallback estável', async () => {
            const wrapper = mountModal({ ariaLabelledby: 'id-inexistente-123' }, {}, { attachTo: document.body });
            const vm = wrapper.vm as any;

            vm.open();
            await wrapper.vm.$nextTick();

            const modalEl = wrapper.find('.max-modal').element;
            expect(modalEl.getAttribute('aria-labelledby')).toBeNull();
            expect(modalEl.getAttribute('aria-label')).toBe('Diálogo');
            expect(computeAccessibleName(modalEl)).toBe('Diálogo');
            wrapper.unmount();
        });

        it('ignora ariaLabelledby que aponta para elemento oculto ou com texto vazio', async () => {
            const hiddenEl = document.createElement('div');
            hiddenEl.id = 'elemento-oculto-modal';
            hiddenEl.hidden = true;
            hiddenEl.textContent = 'Texto Oculto';
            document.body.appendChild(hiddenEl);

            const wrapper = mountModal({ ariaLabelledby: 'elemento-oculto-modal' }, {}, { attachTo: document.body });
            const vm = wrapper.vm as any;

            vm.open();
            await wrapper.vm.$nextTick();

            const modalEl = wrapper.find('.max-modal').element;
            expect(modalEl.getAttribute('aria-labelledby')).toBeNull();
            expect(modalEl.getAttribute('aria-label')).toBe('Diálogo');
            expect(computeAccessibleName(modalEl)).toBe('Diálogo');

            wrapper.unmount();
            hiddenEl.remove();
        });

        it('utiliza ariaLabelledby quando referenciar elemento externo existente e visível com texto', async () => {
            const titleEl = document.createElement('h2');
            titleEl.id = 'titulo-externo-valido-modal';
            titleEl.textContent = 'Título Externo do Diálogo';
            document.body.appendChild(titleEl);

            const wrapper = mountModal({ ariaLabelledby: 'titulo-externo-valido-modal' }, {}, { attachTo: document.body });
            const vm = wrapper.vm as any;

            vm.open();
            await wrapper.vm.$nextTick();

            const modalEl = wrapper.find('.max-modal').element;
            expect(modalEl.getAttribute('aria-labelledby')).toBe('titulo-externo-valido-modal');
            expect(modalEl.getAttribute('aria-label')).toBeNull();
            expect(computeAccessibleName(modalEl)).toBe('Título Externo do Diálogo');

            wrapper.unmount();
            titleEl.remove();
        });
    });
});
