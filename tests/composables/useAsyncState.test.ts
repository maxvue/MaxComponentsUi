import { describe, it, expect } from 'vitest';
import { useAsyncState } from '../../src/composables/useAsyncState';

describe('useAsyncState composable (E05-07)', () => {
    it('inicia com status idle e sem erro', () => {
        const state = useAsyncState<string>('initial');

        expect(state.status.value).toBe('idle');
        expect(state.isIdle.value).toBe(true);
        expect(state.isLoading.value).toBe(false);
        expect(state.isSuccess.value).toBe(false);
        expect(state.isEmpty.value).toBe(false);
        expect(state.isError.value).toBe(false);
        expect(state.data.value).toBe('initial');
        expect(state.error.value).toBeNull();
        expect(state.attempt.value).toBe(0);
    });

    it('transiciona para loading incrementando attempt', () => {
        const state = useAsyncState<number[]>();

        state.setLoading();
        expect(state.status.value).toBe('loading');
        expect(state.isLoading.value).toBe(true);
        expect(state.attempt.value).toBe(1);

        state.setLoading();
        expect(state.attempt.value).toBe(2);
    });

    it('transiciona para success e atualiza data', () => {
        const state = useAsyncState<string[]>();

        state.setLoading();
        state.setSuccess(['item 1', 'item 2']);

        expect(state.status.value).toBe('success');
        expect(state.isSuccess.value).toBe(true);
        expect(state.isLoading.value).toBe(false);
        expect(state.data.value).toEqual(['item 1', 'item 2']);
        expect(state.error.value).toBeNull();
    });

    it('transiciona para empty quando checkEmpty retorna true', () => {
        const state = useAsyncState<string[]>();

        state.setLoading();
        state.setSuccess([], (res) => res.length === 0);

        expect(state.status.value).toBe('empty');
        expect(state.isEmpty.value).toBe(true);
        expect(state.isSuccess.value).toBe(false);
        expect(state.data.value).toEqual([]);
    });

    it('transiciona para error e armazena erro', () => {
        const state = useAsyncState<string[]>();

        state.setLoading();
        const err = new Error('Falha de rede');
        state.setError(err);

        expect(state.status.value).toBe('error');
        expect(state.isError.value).toBe(true);
        expect(state.isLoading.value).toBe(false);
        expect(state.error.value).toBe(err);
    });

    it('permite redefinir para idle', () => {
        const state = useAsyncState<string[]>();

        state.setError('Falha');
        expect(state.isError.value).toBe(true);

        state.setIdle();
        expect(state.status.value).toBe('idle');
        expect(state.isIdle.value).toBe(true);
        expect(state.error.value).toBeNull();
    });
});
