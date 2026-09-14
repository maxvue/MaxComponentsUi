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
});
