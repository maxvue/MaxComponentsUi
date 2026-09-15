/**
 * Estado padronizado de operações assíncronas (E05-07).
 */
export type AsyncStateStatus = 'idle' | 'loading' | 'success' | 'empty' | 'error';

export interface AsyncStateContext<T = any> {
    status: AsyncStateStatus;
    data: T | null;
    error: Error | string | null;
    attempt: number;
}

export type { LoadingHandle } from './app';
