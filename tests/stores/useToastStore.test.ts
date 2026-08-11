import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useToastStore } from '../../src/stores/useToast.Store';

describe('useToastStore', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('inicia com lista de itens vazia', () => {
        const store = useToastStore();
        expect(store.items).toHaveLength(0);
    });

    it('add() cria toast com valores padrão', () => {
        const store = useToastStore();
        const id = store.add({ title: 'Teste' });

        expect(id).toMatch(/^toast-/);
        expect(store.items).toHaveLength(1);
        expect(store.items[0].title).toBe('Teste');
        expect(store.items[0].severity).toBe('info');
        expect(store.items[0].duration).toBe(4000);
        expect(store.items[0].paused).toBe(false);
    });

    it('add() cria toast com valores customizados', () => {
        const store = useToastStore();
        store.add({
            title: 'Sucesso',
            message: 'Operação concluída',
            severity: 'success',
            icon: 'mdi:check',
            duration: 8000
        });

        const toast = store.items[0];
        expect(toast.title).toBe('Sucesso');
        expect(toast.message).toBe('Operação concluída');
        expect(toast.severity).toBe('success');
        expect(toast.icon).toBe('mdi:check');
        expect(toast.duration).toBe(8000);
    });

    it('add() retorna ID único para cada toast', () => {
        const store = useToastStore();
        const id1 = store.add({ title: 'Toast 1' });
        const id2 = store.add({ title: 'Toast 2' });
        expect(id1).not.toBe(id2);
        expect(store.items).toHaveLength(2);
    });

    it('remove() remove toast existente', () => {
        const store = useToastStore();
        const id = store.add({ title: 'Para remover' });
        expect(store.items).toHaveLength(1);

        store.remove(id);
        expect(store.items).toHaveLength(0);
    });

    it('remove() não lança erro para ID inexistente', () => {
        const store = useToastStore();
        expect(() => store.remove('id-inexistente')).not.toThrow();
    });

    it('auto-remove após duration via timer', () => {
        const store = useToastStore();
        store.add({ title: 'Auto remove', duration: 3000 });

        expect(store.items).toHaveLength(1);
        vi.advanceTimersByTime(3000);
        expect(store.items).toHaveLength(0);
    });

    it('pause() pausa o timer do toast', () => {
        const store = useToastStore();
        const id = store.add({ title: 'Pausável', duration: 5000 });

        // Avança 2s e pausa
        vi.advanceTimersByTime(2000);
        store.pause(id);

        const toast = store.items[0];
        expect(toast.paused).toBe(true);
        expect(toast.timerId).toBeNull();

        // Avança mais 10s — toast NÃO deve ser removido pois está pausado
        vi.advanceTimersByTime(10000);
        expect(store.items).toHaveLength(1);
    });

    it('pause() armazena remaining real e garante respiro no resume()', () => {
        const store = useToastStore();
        const id = store.add({ title: 'Quase expirado', duration: 2000 });

        // Avança quase todo o tempo
        vi.advanceTimersByTime(1800);
        store.pause(id);

        const toast = store.items[0];
        expect(toast.remaining).toBe(200);

        store.resume(id);
        // Avança 400ms (ainda não fechou pois o respiro mínimo é 500ms)
        vi.advanceTimersByTime(400);
        expect(store.items).toHaveLength(1);

        // Avança +100ms (total 500ms) e fecha
        vi.advanceTimersByTime(100);
        expect(store.items).toHaveLength(0);
    });

    it('pause() não lança erro para ID inexistente', () => {
        const store = useToastStore();
        expect(() => store.pause('id-fake')).not.toThrow();
    });

    it('resume() retoma o timer após pausa', () => {
        const store = useToastStore();
        const id = store.add({ title: 'Resumível', duration: 5000 });

        // Avança 2s, pausa, resume
        vi.advanceTimersByTime(2000);
        store.pause(id);
        store.resume(id);

        const toast = store.items[0];
        expect(toast.paused).toBe(false);
        expect(toast.timerId).not.toBeNull();
    });

    it('resume() não lança erro para ID inexistente', () => {
        const store = useToastStore();
        expect(() => store.resume('id-fake')).not.toThrow();
    });

    it('clear() remove todos os toasts', () => {
        const store = useToastStore();
        store.add({ title: 'Toast 1' });
        store.add({ title: 'Toast 2' });
        store.add({ title: 'Toast 3' });
        expect(store.items).toHaveLength(3);

        store.clear();
        expect(store.items).toHaveLength(0);
    });

    it('clear() cancela todos os timers ativos', () => {
        const store = useToastStore();
        store.add({ title: 'Com timer 1', duration: 5000 });
        store.add({ title: 'Com timer 2', duration: 10000 });

        store.clear();
        // Após clear + avanço, nada deve estourar (sem erros)
        vi.advanceTimersByTime(15000);
        expect(store.items).toHaveLength(0);
    });

    it('pausas e retomadas sucessivas próximo do vencimento não estendem a vida útil infinitamente', () => {
        const store = useToastStore();
        const id = store.add({ title: 'Respiro', duration: 4000 });

        // Avança 3900ms (faltam 100ms)
        vi.advanceTimersByTime(3900);

        // Faz 5 ciclos de pause -> resume -> avança 400ms enquanto rodando
        for (let i = 0; i < 5; i++) {
            store.pause(id);
            store.resume(id);
            vi.advanceTimersByTime(400);
        }

        // Respiro final de 500ms encerra o timer e remove o toast
        vi.advanceTimersByTime(500);

        expect(store.items).toHaveLength(0);
    });
});
