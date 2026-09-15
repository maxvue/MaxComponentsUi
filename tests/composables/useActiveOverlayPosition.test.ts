import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ref, nextTick } from 'vue';
import { useActiveOverlayPosition } from '../../src/composables/useActiveOverlayPosition';

describe('useActiveOverlayPosition', () => {
    let addEventListenerSpy: any;
    let removeEventListenerSpy: any;

    beforeEach(() => {
        addEventListenerSpy = vi.spyOn(window, 'addEventListener');
        removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('não anexa ouvintes nem calcula posição quando inativo', () => {
        const active = ref(false);
        const target = ref<HTMLElement | null>(null);
        const overlay = ref<HTMLElement | null>(null);

        const { position, isPositioned } = useActiveOverlayPosition({
            target,
            overlay,
            active
        });

        expect(addEventListenerSpy).not.toHaveBeenCalledWith('scroll', expect.any(Function), expect.anything());
        expect(addEventListenerSpy).not.toHaveBeenCalledWith('resize', expect.any(Function), expect.anything());
        expect(isPositioned.value).toBe(false);
        expect(position.value).toEqual({ top: 0, left: 0 });
    });

    it('anexa ouvintes e posiciona elemento quando ativo torna-se true', async () => {
        const active = ref(false);
        const targetEl = document.createElement('div');
        const overlayEl = document.createElement('div');

        vi.spyOn(targetEl, 'getBoundingClientRect').mockReturnValue({
            x: 50,
            y: 100,
            top: 100,
            bottom: 140,
            left: 50,
            right: 250,
            width: 200,
            height: 40,
            toJSON: () => {}
        } as DOMRect);

        vi.spyOn(overlayEl, 'getBoundingClientRect').mockReturnValue({
            x: 50,
            y: 144,
            top: 144,
            bottom: 344,
            left: 50,
            right: 250,
            width: 200,
            height: 200,
            toJSON: () => {}
        } as DOMRect);

        const target = ref<HTMLElement | null>(targetEl);
        const overlay = ref<HTMLElement | null>(overlayEl);

        const { position, isPositioned } = useActiveOverlayPosition({
            target,
            overlay,
            active,
            offset: 4
        });

        active.value = true;
        await nextTick();

        expect(addEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function), { capture: true, passive: true });
        expect(addEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function), { passive: true });
        expect(isPositioned.value).toBe(true);
        expect(position.value.top).toBe(144);
        expect(position.value.left).toBe(50);
        expect(position.value.placement).toBe('bottom');
    });

    it('abre para cima se o espaço inferior for insuficiente', async () => {
        const active = ref(true);
        const targetEl = document.createElement('div');
        const overlayEl = document.createElement('div');

        // Target perto do rodapé (window.innerHeight padrão no jsdom/happy-dom é 768)
        vi.spyOn(targetEl, 'getBoundingClientRect').mockReturnValue({
            x: 50,
            y: 650,
            top: 650,
            bottom: 690,
            left: 50,
            right: 250,
            width: 200,
            height: 40,
            toJSON: () => {}
        } as DOMRect);

        vi.spyOn(overlayEl, 'getBoundingClientRect').mockReturnValue({
            x: 50,
            y: 440,
            top: 440,
            bottom: 640,
            left: 50,
            right: 250,
            width: 200,
            height: 200,
            toJSON: () => {}
        } as DOMRect);

        const { position } = useActiveOverlayPosition({
            target: targetEl,
            overlay: overlayEl,
            active,
            offset: 10
        });

        await nextTick();

        expect(position.value.placement).toBe('top');
        expect(position.value.top).toBe(650 - 200 - 10);
    });

    it('desanexa ouvintes ao desativar e cancela recursos', async () => {
        const active = ref(true);
        const targetEl = document.createElement('div');

        const { isPositioned } = useActiveOverlayPosition({
            target: targetEl,
            overlay: null,
            active
        });

        await nextTick();
        expect(addEventListenerSpy).toHaveBeenCalled();

        active.value = false;
        await nextTick();

        expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function), { capture: true });
        expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
        expect(isPositioned.value).toBe(false);
    });

    it('suporta função de cálculo customizada (compute)', async () => {
        const active = ref(true);
        const targetEl = document.createElement('div');

        vi.spyOn(targetEl, 'getBoundingClientRect').mockReturnValue({
            x: 100,
            y: 200,
            top: 200,
            bottom: 250,
            left: 100,
            right: 300,
            width: 200,
            height: 50,
            toJSON: () => {}
        } as DOMRect);

        const customCompute = vi.fn((ctx) => ({
            top: ctx.targetRect.bottom + 12,
            left: ctx.targetRect.left,
            customData: 'ok'
        }));

        const { position } = useActiveOverlayPosition({
            target: targetEl,
            overlay: null,
            active,
            compute: customCompute
        });

        await nextTick();

        expect(customCompute).toHaveBeenCalled();
        expect(position.value).toEqual({
            top: 262,
            left: 100,
            customData: 'ok'
        });
    });

    it('observa visualViewport quando disponível e aplica clamp com safe-area', async () => {
        const active = ref(true);
        const targetEl = document.createElement('div');
        const overlayEl = document.createElement('div');

        vi.spyOn(targetEl, 'getBoundingClientRect').mockReturnValue({
            x: 0,
            y: 10,
            top: 10,
            bottom: 40,
            left: 0,
            right: 200,
            width: 200,
            height: 30,
            toJSON: () => {}
        } as DOMRect);

        vi.spyOn(overlayEl, 'getBoundingClientRect').mockReturnValue({
            x: 0,
            y: 44,
            top: 44,
            bottom: 244,
            left: 0,
            right: 200,
            width: 200,
            height: 200,
            toJSON: () => {}
        } as DOMRect);

        const mockVisualViewport = {
            width: 320,
            height: 480,
            offsetLeft: 0,
            offsetTop: 0,
            scale: 1,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn()
        };

        const originalVV = window.visualViewport;
        Object.defineProperty(window, 'visualViewport', {
            value: mockVisualViewport,
            writable: true,
            configurable: true
        });

        vi.spyOn(window, 'getComputedStyle').mockReturnValue({
            getPropertyValue: (prop: string) => {
                if (prop === '--safe-area-left') return '16px';
                if (prop === '--safe-area-top') return '20px';
                return '0px';
            }
        } as any);

        const { position } = useActiveOverlayPosition({
            target: targetEl,
            overlay: overlayEl,
            active
        });

        await nextTick();

        expect(mockVisualViewport.addEventListener).toHaveBeenCalledWith('resize', expect.any(Function), { passive: true });
        expect(mockVisualViewport.addEventListener).toHaveBeenCalledWith('scroll', expect.any(Function), { passive: true });
        expect(position.value.left).toBe(24);

        active.value = false;
        await nextTick();

        expect(mockVisualViewport.removeEventListener).toHaveBeenCalledWith('resize', expect.any(Function));
        expect(mockVisualViewport.removeEventListener).toHaveBeenCalledWith('scroll', expect.any(Function));

        Object.defineProperty(window, 'visualViewport', {
            value: originalVV,
            writable: true,
            configurable: true
        });
    });

    it('considera offset da visualViewport em zoom, safe-area e viewport estreita para manter o painel atingível', async () => {
        const active = ref(true);
        const targetEl = document.createElement('button');
        const overlayEl = document.createElement('div');
        vi.spyOn(targetEl, 'getBoundingClientRect').mockReturnValue({
            top: 402, bottom: 422, left: 276, right: 316, width: 40, height: 20, x: 276, y: 402, toJSON: () => {}
        } as DOMRect);
        vi.spyOn(overlayEl, 'getBoundingClientRect').mockReturnValue({
            top: 0, bottom: 180, left: 0, right: 180, width: 180, height: 180, x: 0, y: 0, toJSON: () => {}
        } as DOMRect);

        const originalVV = window.visualViewport;
        const mockVisualViewport = {
            width: 280, height: 200, offsetLeft: 40, offsetTop: 300, scale: 2,
            addEventListener: vi.fn(), removeEventListener: vi.fn()
        };
        Object.defineProperty(window, 'visualViewport', { value: mockVisualViewport, configurable: true });
        vi.spyOn(window, 'getComputedStyle').mockReturnValue({
            getPropertyValue: (prop: string) => ({ '--safe-area-top': '10px', '--safe-area-right': '12px', '--safe-area-bottom': '16px', '--safe-area-left': '8px' }[prop] ?? '0px')
        } as any);

        const { position } = useActiveOverlayPosition({ target: targetEl, overlay: overlayEl, active, offset: 4 });
        await nextTick();

        // limites: x=[56, 300], y=[318, 476]; o painel fica inteiramente na área visível em zoom 200%.
        expect(position.value.left).toBe(120);
        expect(position.value.top).toBe(318);
        expect(position.value.left).toBeGreaterThanOrEqual(56);
        expect(position.value.left + 180).toBeLessThanOrEqual(300);
        expect(position.value.top + 158).toBeLessThanOrEqual(476);

        active.value = false;
        await nextTick();
        Object.defineProperty(window, 'visualViewport', { value: originalVV, configurable: true });
    });
});
