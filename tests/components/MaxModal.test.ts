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

            // z-index: token backdrop (1300) + depth * 20
            expect(bg1.attributes('style')).toContain('z-index: var(--max-layer-modal-backdrop, 1300)');
            expect(bg2.attributes('style')).toContain('z-index: calc(var(--max-layer-modal-backdrop, 1300) + 20)');
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

    describe('Contrato unificado de fechamento requestClose e before-close (F08)', () => {
        it('cancela fechamento via evento @before-close com event.preventDefault() para todas as razões', async () => {
            let lastReason: string | null = null;
            let shouldPrevent = true;

            const onBeforeClose = vi.fn((e: any) => {
                lastReason = e.reason;
                if (shouldPrevent) e.preventDefault();
            });

            const wrapper = mountModal({}, {}, {
                attrs: {
                    onBeforeClose
                }
            });
            const vm = wrapper.vm as any;
            const store = useModalStore();

            vm.open();
            await wrapper.vm.$nextTick();
            expect(store.show_id).toBe(vm.id);

            // 1. Razão 'button' (clique no botão fechar)
            const closeBtn = wrapper.find('.close-btn');
            await closeBtn.trigger('click');
            expect(lastReason).toBe('button');
            expect(store.show_id).toBe(vm.id); // Cancelado!

            // 2. Razão 'escape' (tecla Escape)
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
            expect(lastReason).toBe('escape');
            expect(store.show_id).toBe(vm.id); // Cancelado!

            // 3. Razão 'backdrop' (clique no fundo)
            const bg = wrapper.find('.background-modal');
            await bg.trigger('click');
            expect(lastReason).toBe('backdrop');
            expect(store.show_id).toBe(vm.id); // Cancelado!

            // 4. Razão 'api' (chamada imperativa vm.close())
            vm.close();
            expect(lastReason).toBe('api');
            expect(store.show_id).toBe(vm.id); // Cancelado!

            // 5. Agora autoriza (shouldPrevent = false) e fecha via close()
            shouldPrevent = false;
            vm.close();
            await wrapper.vm.$nextTick();
            expect(store.show_id).toBeNull();
        });

        it('cancela fechamento via evento @before-close e confirma assincronamente com done()', async () => {
            let capturedDone: (() => void) | null = null;
            const onBeforeClose = vi.fn((e: any) => {
                e.preventDefault();
                capturedDone = e.done;
            });

            const wrapper = mountModal({}, {}, {
                attrs: {
                    onBeforeClose
                }
            });
            const vm = wrapper.vm as any;
            const store = useModalStore();

            vm.open();
            await wrapper.vm.$nextTick();
            expect(store.show_id).toBe(vm.id);

            vm.close();
            await wrapper.vm.$nextTick();
            expect(onBeforeClose).toHaveBeenCalledTimes(1);
            // Modal continua aberto aguardando invocação de done
            expect(store.show_id).toBe(vm.id);

            // Quando done() é invocado, o modal fecha
            capturedDone!();
            await wrapper.vm.$nextTick();
            expect(store.show_id).toBeNull();
        });

        it('cancela fechamento via prop :beforeClose retornando false e autoriza com true', async () => {
            let allow = false;
            const beforeClose = vi.fn(() => allow);

            const wrapper = mountModal({ beforeClose });
            const vm = wrapper.vm as any;
            const store = useModalStore();

            vm.open();
            await wrapper.vm.$nextTick();
            expect(store.show_id).toBe(vm.id);

            // Tentativa de fechar: rejeitada
            vm.close();
            await wrapper.vm.$nextTick();
            expect(beforeClose).toHaveBeenCalledTimes(1);
            expect(store.show_id).toBe(vm.id);

            // Agora autoriza
            allow = true;
            vm.close();
            await wrapper.vm.$nextTick();
            expect(beforeClose).toHaveBeenCalledTimes(2);
            expect(store.show_id).toBeNull();
        });

        it('adia fechamento com waitUntil e fecha quando promise resolve em true', async () => {
            let resolvePromise!: (val: boolean) => void;
            const asyncPromise = new Promise<boolean>((resolve) => {
                resolvePromise = resolve;
            });

            const onBeforeClose = vi.fn((e: any) => {
                e.waitUntil(asyncPromise);
            });

            const wrapper = mountModal({}, {}, {
                attrs: {
                    onBeforeClose
                }
            });
            const vm = wrapper.vm as any;
            const store = useModalStore();

            vm.open();
            await wrapper.vm.$nextTick();
            expect(store.show_id).toBe(vm.id);

            const closePromise = vm.requestClose('button');
            await wrapper.vm.$nextTick();
            // Enquanto a promise não resolve, modal permanece aberto
            expect(store.show_id).toBe(vm.id);

            // Resolve em true
            resolvePromise(true);
            const result = await closePromise;
            expect(result).toBe(true);
            await wrapper.vm.$nextTick();
            expect(store.show_id).toBeNull();
        });

        it('adia fechamento com waitUntil e mantém aberto quando promise resolve em false', async () => {
            let resolvePromise!: (val: boolean) => void;
            const asyncPromise = new Promise<boolean>((resolve) => {
                resolvePromise = resolve;
            });

            const onBeforeClose = vi.fn((e: any) => {
                e.waitUntil(asyncPromise);
            });

            const wrapper = mountModal({}, {}, {
                attrs: {
                    onBeforeClose
                }
            });
            const vm = wrapper.vm as any;
            const store = useModalStore();

            vm.open();
            await wrapper.vm.$nextTick();
            expect(store.show_id).toBe(vm.id);

            const closePromise = vm.requestClose('button');
            await wrapper.vm.$nextTick();
            expect(store.show_id).toBe(vm.id);

            // Resolve em false (cancelamento)
            resolvePromise(false);
            const result = await closePromise;
            expect(result).toBe(false);
            await wrapper.vm.$nextTick();
            expect(store.show_id).toBe(vm.id);
        });

        it('reabrir o modal durante espera de fechamento anula fechamento tardio (proteção de geração)', async () => {
            let pendingDone!: () => void;
            const onBeforeClose = vi.fn((e: any) => {
                e.preventDefault();
                pendingDone = e.done;
            });

            const wrapper = mountModal({}, {}, {
                attrs: {
                    onBeforeClose
                }
            });
            const vm = wrapper.vm as any;
            const store = useModalStore();

            vm.open();
            await wrapper.vm.$nextTick();
            expect(store.show_id).toBe(vm.id);

            // Dispara solicitação de fechamento
            vm.close();
            await wrapper.vm.$nextTick();
            expect(store.show_id).toBe(vm.id);

            // Usuário reabre o modal antes de resolver a confirmação
            vm.open();
            await wrapper.vm.$nextTick();
            expect(store.show_id).toBe(vm.id);

            // Agora o callback obsoleto de done() é disparado tardiamente
            pendingDone();
            await wrapper.vm.$nextTick();

            // O modal DEVE PERMANECER ABERTO graças à proteção de geração!
            expect(store.show_id).toBe(vm.id);
            expect(vm.is_show).toBe(true);
        });

        it('sincroniza modelValue emitindo true quando fechamento via model é cancelado', async () => {
            const onBeforeClose = vi.fn((e: any) => {
                expect(e.reason).toBe('model');
                e.preventDefault();
            });

            const wrapper = mountModal({ modelValue: true }, {}, {
                attrs: {
                    onBeforeClose
                }
            });
            const vm = wrapper.vm as any;
            const store = useModalStore();

            await wrapper.vm.$nextTick();
            expect(store.show_id).toBe(vm.id);

            // O pai tenta fechar mudando modelValue para false
            await wrapper.setProps({ modelValue: false });
            await wrapper.vm.$nextTick();

            expect(onBeforeClose).toHaveBeenCalledTimes(1);
            // Modal continua aberto
            expect(store.show_id).toBe(vm.id);
            // Emite update:modelValue com true para reverter a prop do pai
            expect(wrapper.emitted('update:modelValue')).toBeTruthy();
            const lastEmit = wrapper.emitted('update:modelValue')!.slice(-1)[0];
            expect(lastEmit).toEqual([true]);
        });
    });
});
