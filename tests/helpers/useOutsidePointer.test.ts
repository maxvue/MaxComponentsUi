import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ref, defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';
import {
    useOutsidePointer,
    getActiveOutsidePointerListenersCount,
    getOverlayStackDepth
} from '../../src/helpers/useOutsidePointer';

describe('useOutsidePointer', () => {
    let container: HTMLDivElement;

    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);
    });

    afterEach(() => {
        container.remove();
        document.body.innerHTML = '';
    });

    it('ativa listeners e registra na pilha quando aberto; desmontar/fechar zera listeners', async () => {
        const isOpen = ref(false);
        const onClose = vi.fn();
        const overlayEl = ref<HTMLElement | null>(null);

        const Comp = defineComponent({
            setup() {
                useOutsidePointer(isOpen, {
                    elements: () => [overlayEl.value],
                    onClose,
                    repositionOnScroll: true,
                    repositionOnResize: true
                });
                return () => h('div', { ref: overlayEl });
            }
        });

        const wrapper = mount(Comp, { attachTo: container });
        expect(getActiveOutsidePointerListenersCount()).toBe(0);
        expect(getOverlayStackDepth()).toBe(0);

        isOpen.value = true;
        await wrapper.vm.$nextTick();
        expect(getOverlayStackDepth()).toBe(1);
        expect(getActiveOutsidePointerListenersCount()).toBeGreaterThan(0);

        isOpen.value = false;
        await wrapper.vm.$nextTick();
        expect(getOverlayStackDepth()).toBe(0);
        expect(getActiveOutsidePointerListenersCount()).toBe(0);

        // Reabre e desmonta: deve zerar também
        isOpen.value = true;
        await wrapper.vm.$nextTick();
        expect(getOverlayStackDepth()).toBe(1);

        wrapper.unmount();
        expect(getOverlayStackDepth()).toBe(0);
        expect(getActiveOutsidePointerListenersCount()).toBe(0);
    });

    it('stack: tecla Escape fecha apenas o overlay do topo da pilha', async () => {
        const open1 = ref(true);
        const close1 = vi.fn(() => { open1.value = false; });
        const open2 = ref(true);
        const close2 = vi.fn(() => { open2.value = false; });

        const Comp = defineComponent({
            setup() {
                useOutsidePointer(open1, {
                    elements: () => [],
                    onClose: close1
                });
                useOutsidePointer(open2, {
                    elements: () => [],
                    onClose: close2
                });
                return () => h('div');
            }
        });

        const wrapper = mount(Comp, { attachTo: container });
        expect(getOverlayStackDepth()).toBe(2);

        // Pressiona Escape: apenas o overlay 2 (topo) deve fechar
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        await wrapper.vm.$nextTick();

        expect(close2).toHaveBeenCalledTimes(1);
        expect(close1).not.toHaveBeenCalled();

        // Pressiona Escape novamente: agora o overlay 1 fecha
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        await wrapper.vm.$nextTick();

        expect(close1).toHaveBeenCalledTimes(1);
        expect(getOverlayStackDepth()).toBe(0);
        expect(getActiveOutsidePointerListenersCount()).toBe(0);
        wrapper.unmount();
    });

    it('clique-through: clique em elemento externo fecha overlay sem impedir o evento do elemento', async () => {
        const isOpen = ref(true);
        const onClose = vi.fn();
        const externalBtnClicked = vi.fn();

        const externalButton = document.createElement('button');
        externalButton.id = 'ext-btn';
        externalButton.addEventListener('click', externalBtnClicked);
        document.body.appendChild(externalButton);

        const Comp = defineComponent({
            setup() {
                const overlayEl = ref<HTMLElement | null>(null);
                useOutsidePointer(isOpen, {
                    elements: () => [overlayEl.value],
                    onClose
                });
                return () => h('div', { ref: overlayEl, id: 'my-overlay' }, 'Overlay content');
            }
        });

        const wrapper = mount(Comp, { attachTo: container });

        // Simula clique no botão externo: pointerdown -> click
        externalButton.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
        externalButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        await wrapper.vm.$nextTick();

        expect(onClose).toHaveBeenCalledWith('outside');
        expect(externalBtnClicked).toHaveBeenCalledTimes(1);

        wrapper.unmount();
        externalButton.remove();
    });

    it('remove o topo sincronicamente antes do callback, impedindo duplicação entre eventos no mesmo tick', async () => {
        const isOpen = ref(true);
        const onClose = vi.fn(() => { isOpen.value = false; });
        const outside = document.createElement('button');
        document.body.appendChild(outside);

        const Comp = defineComponent({
            setup() {
                useOutsidePointer(isOpen, { elements: () => [], onClose });
                return () => h('div');
            }
        });
        const wrapper = mount(Comp, { attachTo: container });

        // Não aguardamos o tick reativo entre os dois cliques: esta era a janela do E04-02.
        outside.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
        outside.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        expect(getOverlayStackDepth()).toBe(0);
        expect(getActiveOutsidePointerListenersCount()).toBe(0);

        outside.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
        outside.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        expect(onClose).toHaveBeenCalledTimes(1);

        await wrapper.vm.$nextTick();
        wrapper.unmount();
        outside.remove();
    });

    it('não fecha se o clique for dentro dos elementos do overlay', async () => {
        const isOpen = ref(true);
        const onClose = vi.fn();
        let insideEl: HTMLElement | null = null;

        const Comp = defineComponent({
            setup() {
                const overlayEl = ref<HTMLElement | null>(null);
                useOutsidePointer(isOpen, {
                    elements: () => [overlayEl.value],
                    onClose
                });
                return () => h('div', { ref: overlayEl, id: 'overlay-root' }, [
                    h('button', { id: 'inside-btn', ref: (el) => { insideEl = el as HTMLElement; } }, 'Inside')
                ]);
            }
        });

        const wrapper = mount(Comp, { attachTo: container });

        expect(insideEl).not.toBeNull();
        insideEl!.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
        insideEl!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        await wrapper.vm.$nextTick();

        expect(onClose).not.toHaveBeenCalled();
        wrapper.unmount();
    });

    it('scroll ancestral aciona onReposition', async () => {
        const isOpen = ref(true);
        const onReposition = vi.fn();

        const scrollContainer = document.createElement('div');
        document.body.appendChild(scrollContainer);

        const Comp = defineComponent({
            setup() {
                useOutsidePointer(isOpen, {
                    elements: () => [],
                    onClose: vi.fn(),
                    onReposition,
                    repositionOnScroll: true
                });
                return () => h('div');
            }
        });

        const wrapper = mount(Comp, { attachTo: scrollContainer });

        scrollContainer.dispatchEvent(new Event('scroll', { bubbles: true }));
        await new Promise((resolve) => requestAnimationFrame(resolve));

        expect(onReposition).toHaveBeenCalled();
        wrapper.unmount();
        scrollContainer.remove();
    });

    it('elimina listener keydown duplicado: registra apenas em document, nunca em window', async () => {
        const docAddSpy = vi.spyOn(document, 'addEventListener');
        const winAddSpy = vi.spyOn(window, 'addEventListener');

        const isOpen = ref(true);
        const Comp = defineComponent({
            setup() {
                useOutsidePointer(isOpen, {
                    elements: () => [],
                    onClose: vi.fn()
                });
                return () => h('div');
            }
        });

        const wrapper = mount(Comp, { attachTo: container });

        const docKeydownCalls = docAddSpy.mock.calls.filter((call) => call[0] === 'keydown');
        const winKeydownCalls = winAddSpy.mock.calls.filter((call) => call[0] === 'keydown');

        expect(docKeydownCalls.length).toBe(1);
        expect(winKeydownCalls.length).toBe(0);

        wrapper.unmount();
        docAddSpy.mockRestore();
        winAddSpy.mockRestore();
    });

    it('stack: clique na camada inferior fecha APENAS o overlay superior (não trata camada inferior como inside)', async () => {
        const open1 = ref(true);
        const close1 = vi.fn(() => { open1.value = false; });
        const open2 = ref(true);
        const close2 = vi.fn(() => { open2.value = false; });

        let el1: HTMLElement | null = null;
        let el2: HTMLElement | null = null;

        const Comp = defineComponent({
            setup() {
                useOutsidePointer(open1, {
                    elements: () => [el1],
                    onClose: close1
                });
                useOutsidePointer(open2, {
                    elements: () => [el2],
                    onClose: close2
                });
                return () => h('div', [
                    h('div', { id: 'layer-1', ref: (node) => { el1 = node as HTMLElement; } }, 'Layer 1'),
                    h('div', { id: 'layer-2', ref: (node) => { el2 = node as HTMLElement; } }, 'Layer 2')
                ]);
            }
        });

        const wrapper = mount(Comp, { attachTo: container });
        expect(getOverlayStackDepth()).toBe(2);

        // Usuário clica em el1 (camada inferior): está dentro de layer 1, mas FORA de layer 2
        el1!.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
        el1!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        await wrapper.vm.$nextTick();

        // O overlay do topo (layer 2) DEVE fechar
        expect(close2).toHaveBeenCalledTimes(1);
        expect(close2).toHaveBeenCalledWith('outside');

        // O overlay inferior (layer 1) NÃO deve fechar
        expect(close1).not.toHaveBeenCalled();

        wrapper.unmount();
    });

    it('stack: clique externo fecha apenas o topo da pilha', async () => {
        const open1 = ref(true);
        const close1 = vi.fn(() => { open1.value = false; });
        const open2 = ref(true);
        const close2 = vi.fn(() => { open2.value = false; });

        const outsideBtn = document.createElement('button');
        document.body.appendChild(outsideBtn);

        const Comp = defineComponent({
            setup() {
                useOutsidePointer(open1, {
                    elements: () => [],
                    onClose: close1
                });
                useOutsidePointer(open2, {
                    elements: () => [],
                    onClose: close2
                });
                return () => h('div');
            }
        });

        const wrapper = mount(Comp, { attachTo: container });
        expect(getOverlayStackDepth()).toBe(2);

        outsideBtn.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
        outsideBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        await wrapper.vm.$nextTick();

        // Apenas o topo fecha
        expect(close2).toHaveBeenCalledTimes(1);
        expect(close1).not.toHaveBeenCalled();

        wrapper.unmount();
        outsideBtn.remove();
    });

    it('clique-through: não rouba o foco de volta para o trigger quando o clique foca outro controle externo', async () => {
        const triggerBtn = document.createElement('button');
        triggerBtn.id = 'trigger-btn';
        document.body.appendChild(triggerBtn);
        triggerBtn.focus();

        const externalInput = document.createElement('input');
        externalInput.id = 'external-input';
        document.body.appendChild(externalInput);

        const isOpen = ref(true);
        const onClose = vi.fn(() => { isOpen.value = false; });

        const Comp = defineComponent({
            setup() {
                const overlayEl = ref<HTMLElement | null>(null);
                useOutsidePointer(isOpen, {
                    elements: () => [overlayEl.value],
                    triggerEl: () => triggerBtn,
                    restoreFocus: true,
                    onClose
                });
                return () => h('div', { ref: overlayEl }, 'Overlay');
            }
        });

        const wrapper = mount(Comp, { attachTo: container });

        // Simula foco no input externo seguido de clique
        externalInput.focus();
        expect(document.activeElement).toBe(externalInput);

        externalInput.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
        externalInput.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        await wrapper.vm.$nextTick();

        expect(onClose).toHaveBeenCalledWith('outside');
        // O foco deve permanecer no externalInput e NÃO voltar para triggerBtn
        expect(document.activeElement).toBe(externalInput);

        wrapper.unmount();
        triggerBtn.remove();
        externalInput.remove();
    });

    it('restauração de foco: Escape devolve o foco ao trigger; fallback seguro se trigger estiver desconectado', async () => {
        const prevActiveBtn = document.createElement('button');
        prevActiveBtn.id = 'prev-btn';
        document.body.appendChild(prevActiveBtn);
        prevActiveBtn.focus();

        const triggerBtn = document.createElement('button');
        triggerBtn.id = 'trigger-btn';
        document.body.appendChild(triggerBtn);

        const isOpen = ref(true);
        const onClose = vi.fn(() => { isOpen.value = false; });

        const Comp = defineComponent({
            setup() {
                const overlayEl = ref<HTMLElement | null>(null);
                useOutsidePointer(isOpen, {
                    elements: () => [overlayEl.value],
                    triggerEl: () => triggerBtn,
                    restoreFocus: true,
                    onClose
                });
                return () => h('div', { ref: overlayEl }, 'Overlay');
            }
        });

        const wrapper = mount(Comp, { attachTo: container });

        // Caso 1: fecha por Escape com trigger conectado
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        await wrapper.vm.$nextTick();

        expect(onClose).toHaveBeenCalledWith('escape');
        expect(document.activeElement).toBe(triggerBtn);

        // Caso 2: foca prevActiveBtn, reabre, desconecta o trigger e fecha por Escape -> deve fazer fallback para prevActiveBtn
        prevActiveBtn.focus();
        expect(document.activeElement).toBe(prevActiveBtn);

        isOpen.value = true;
        await wrapper.vm.$nextTick();

        triggerBtn.remove(); // Desconecta do DOM
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        await wrapper.vm.$nextTick();

        expect(document.activeElement).toBe(prevActiveBtn);

        wrapper.unmount();
        prevActiveBtn.remove();
    });

    it('reposicionamento: fecha o overlay se a âncora/trigger for desconectada do DOM', async () => {
        const triggerBtn = document.createElement('button');
        document.body.appendChild(triggerBtn);

        const isOpen = ref(true);
        const onClose = vi.fn(() => { isOpen.value = false; });
        const onReposition = vi.fn();

        const Comp = defineComponent({
            setup() {
                useOutsidePointer(isOpen, {
                    elements: () => [],
                    triggerEl: () => triggerBtn,
                    repositionOnResize: true,
                    onClose,
                    onReposition
                });
                return () => h('div');
            }
        });

        const wrapper = mount(Comp, { attachTo: container });

        // Desconecta a âncora
        triggerBtn.remove();

        // Dispara resize na janela
        window.dispatchEvent(new Event('resize'));
        await new Promise((resolve) => requestAnimationFrame(resolve));

        expect(onClose).toHaveBeenCalledWith('outside');
        expect(onReposition).not.toHaveBeenCalled();

        wrapper.unmount();
    });

    it('múltiplas instâncias compartilham listeners globais e zeram rigorosamente após unmount de todas', async () => {
        const docRemoveSpy = vi.spyOn(document, 'removeEventListener');
        const winRemoveSpy = vi.spyOn(window, 'removeEventListener');

        const openA = ref(true);
        const openB = ref(true);
        const openC = ref(true);

        const Comp = defineComponent({
            setup() {
                useOutsidePointer(openA, { elements: () => [], onClose: vi.fn() });
                useOutsidePointer(openB, { elements: () => [], onClose: vi.fn() });
                useOutsidePointer(openC, { elements: () => [], onClose: vi.fn() });
                return () => h('div');
            }
        });

        const wrapper = mount(Comp, { attachTo: container });

        // 3 overlays abertos, mas dispatcher é unificado (não triplica)
        expect(getOverlayStackDepth()).toBe(3);
        const initialListeners = getActiveOutsidePointerListenersCount();
        // document: keydown/pointerdown/click; window: scroll/resize.
        // Cada overlay adicional reaproveita exatamente esses cinco listeners.
        expect(initialListeners).toBe(5);

        // Fecha 1
        openA.value = false;
        await wrapper.vm.$nextTick();
        expect(getOverlayStackDepth()).toBe(2);
        expect(getActiveOutsidePointerListenersCount()).toBe(initialListeners);

        // Fecha 2
        openB.value = false;
        await wrapper.vm.$nextTick();
        expect(getOverlayStackDepth()).toBe(1);
        expect(getActiveOutsidePointerListenersCount()).toBe(initialListeners);

        // Fecha 3
        openC.value = false;
        await wrapper.vm.$nextTick();
        expect(getOverlayStackDepth()).toBe(0);
        expect(getActiveOutsidePointerListenersCount()).toBe(0);

        // Desmonta
        wrapper.unmount();
        expect(getActiveOutsidePointerListenersCount()).toBe(0);

        expect(docRemoveSpy).toHaveBeenCalled();
        expect(winRemoveSpy).toHaveBeenCalled();

        docRemoveSpy.mockRestore();
        winRemoveSpy.mockRestore();
    });

    it('suporta zoom e resize via visualViewport quando disponível', async () => {
        const mockVisualViewport = {
            addEventListener: vi.fn(),
            removeEventListener: vi.fn()
        };

        // Atribui visualViewport temporariamente
        const originalVisualViewport = window.visualViewport;
        Object.defineProperty(window, 'visualViewport', {
            value: mockVisualViewport,
            configurable: true,
            writable: true
        });

        const isOpen = ref(true);
        const Comp = defineComponent({
            setup() {
                useOutsidePointer(isOpen, {
                    elements: () => [],
                    onClose: vi.fn(),
                    repositionOnResize: true
                });
                return () => h('div');
            }
        });

        const wrapper = mount(Comp, { attachTo: container });

        expect(mockVisualViewport.addEventListener).toHaveBeenCalledWith('resize', expect.any(Function));
        expect(mockVisualViewport.addEventListener).toHaveBeenCalledWith('scroll', expect.any(Function));

        wrapper.unmount();

        expect(mockVisualViewport.removeEventListener).toHaveBeenCalledWith('resize', expect.any(Function));
        expect(mockVisualViewport.removeEventListener).toHaveBeenCalledWith('scroll', expect.any(Function));
        expect(getActiveOutsidePointerListenersCount()).toBe(0);

        // Restaura
        Object.defineProperty(window, 'visualViewport', {
            value: originalVisualViewport,
            configurable: true,
            writable: true
        });
    });
});
