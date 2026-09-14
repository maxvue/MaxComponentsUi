import { ref, computed } from 'vue';
import type { AsyncStateStatus } from '../types';

export function useAsyncState<T = any>(
    fnOrInitial?: ((...args: any[]) => Promise<T>) | T | null,
    initialData: T | null = null
) {
    const isFn = typeof fnOrInitial === 'function';
    const initial = isFn ? initialData : (fnOrInitial ?? null);

    const status = ref<AsyncStateStatus>('idle');
    const data = ref<T | null>(initial) as { value: T | null };
    const error = ref<Error | null>(null);
    const attempt = ref(0);
    let lastArgs: any[] = [];

    const isIdle = computed(() => status.value === 'idle');
    const isLoading = computed(() => status.value === 'loading');
    const isSuccess = computed(() => status.value === 'success');
    const isEmpty = computed(() => status.value === 'empty');
    const isError = computed(() => status.value === 'error');

    const state = computed(() => ({
        status: status.value,
        data: data.value,
        error: error.value,
        attemptId: attempt.value
    }));

    const setIdle = () => {
        status.value = 'idle';
        error.value = null;
    };

    const setLoading = () => {
        status.value = 'loading';
        error.value = null;
        attempt.value++;
    };

    const setSuccess = (result: T, checkEmpty?: (res: T) => boolean) => {
        data.value = result;
        error.value = null;
        if (checkEmpty && checkEmpty(result)) status.value = 'empty';
        else status.value = 'success';
    };

    const setError = (err: unknown) => {
        error.value = err instanceof Error ? err : new Error(String(err));
        status.value = 'error';
    };

    const execute = async (...args: any[]): Promise<T> => {
        if (!isFn) throw new Error('Nenhuma função assíncrona foi fornecida para useAsyncState');
        lastArgs = args;
        setLoading();
        try {
            const result = await (fnOrInitial as (...args: any[]) => Promise<T>)(...args);
            setSuccess(result);
            return result;
        } catch (err: unknown) {
            setError(err);
            throw err;
        }
    };

    const retry = async (): Promise<T> => {
        return execute(...lastArgs);
    };

    const reset = () => {
        status.value = 'idle';
        data.value = initial;
        error.value = null;
    };

    return {
        state,
        status,
        data,
        error,
        attempt,
        attemptId: attempt,
        isIdle,
        isLoading,
        isSuccess,
        isEmpty,
        isError,
        setIdle,
        setLoading,
        setSuccess,
        setError,
        execute,
        retry,
        reset
    };
}
