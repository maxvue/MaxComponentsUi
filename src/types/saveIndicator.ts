export type MaxSaveState = 'idle' | 'pending' | 'saving' | 'saved' | 'error' | 'offline';

export interface MaxSaveIndicatorProps {
    state: MaxSaveState;
    message?: string;
    retryable?: boolean;
}
