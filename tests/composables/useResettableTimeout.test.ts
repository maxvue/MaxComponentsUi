import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';
import { useResettableTimeout } from '../../src/composables/useResettableTimeout';

describe('useResettableTimeout', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('executa callback após o tempo padrão', () => {
        const callback = vi.fn();
        let timeoutHandle: ReturnType<typeof useResettableTimeout>;

        const TestComponent = defineComponent({
            setup() {
                timeoutHandle = useResettableTimeout(2000);
                return () => h('div');
            }
        });

        mount(TestComponent);

        timeoutHandle!.start(callback);
        expect(timeoutHandle!.isActive).toBe(true);
        expect(callback).not.toHaveBeenCalled();

        vi.advanceTimersByTime(1999);
        expect(callback).not.toHaveBeenCalled();

        vi.advanceTimersByTime(1);
        expect(callback).toHaveBeenCalledTimes(1);
        expect(timeoutHandle!.isActive).toBe(false);
    });

    it('renova a janela completa quando chamado novamente antes do disparo', () => {
        const callback1 = vi.fn();
        const callback2 = vi.fn();
        let timeoutHandle: ReturnType<typeof useResettableTimeout>;

        const TestComponent = defineComponent({
            setup() {
                timeoutHandle = useResettableTimeout(2000);
                return () => h('div');
            }
        });

        mount(TestComponent);

        timeoutHandle!.start(callback1);
        vi.advanceTimersByTime(1500);

        // Renova antes de expirar
        timeoutHandle!.start(callback2);
        expect(timeoutHandle!.isActive).toBe(true);

        vi.advanceTimersByTime(1000); // 2500ms total desde o primeiro
        expect(callback1).not.toHaveBeenCalled();
        expect(callback2).not.toHaveBeenCalled();

        vi.advanceTimersByTime(1000); // 2000ms desde o segundo
        expect(callback1).not.toHaveBeenCalled();
        expect(callback2).toHaveBeenCalledTimes(1);
    });

    it('cancela imediatamente com clear() e não dispara callback', () => {
        const callback = vi.fn();
        let timeoutHandle: ReturnType<typeof useResettableTimeout>;

        const TestComponent = defineComponent({
            setup() {
                timeoutHandle = useResettableTimeout(2000);
                return () => h('div');
            }
        });

        mount(TestComponent);

        timeoutHandle!.start(callback);
        vi.advanceTimersByTime(1000);
        timeoutHandle!.clear();

        expect(timeoutHandle!.isActive).toBe(false);
        vi.runAllTimers();
        expect(callback).not.toHaveBeenCalled();
    });

    it('desmontagem do componente cancela o timer e impede execução do callback', () => {
        const callback = vi.fn();
        let timeoutHandle: ReturnType<typeof useResettableTimeout>;

        const TestComponent = defineComponent({
            setup() {
                timeoutHandle = useResettableTimeout(2000);
                return () => h('div');
            }
        });

        const wrapper = mount(TestComponent);
        timeoutHandle!.start(callback);

        wrapper.unmount();
        vi.runAllTimers();

        expect(callback).not.toHaveBeenCalled();
        expect(timeoutHandle!.isActive).toBe(false);
    });
});
