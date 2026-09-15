import { defineStore } from 'pinia';
import type { Ref } from 'vue';
import { ref, computed, getCurrentScope, onScopeDispose } from 'vue';
import { valuesInKey, size, watchDebounced } from '@maxvue/max-use';

import type { LoadingItem, LoadingTarget } from '../types/app';

export const useLoadingStore = defineStore('loading', () => {

    const targets: Ref<Record<string, LoadingTarget>> = ref({});
    const items = computed(() => valuesInKey(targets, 'items', []));
    const pendingItems = computed(() => items.value.filter((item: LoadingItem) => item.status === 'loading' || item.status === 'waiting'));
    const terminalItems = computed(() => items.value.filter((item: LoadingItem) => item.status === 'done' || item.status === 'error'));

    const isPending = (target?: string): boolean => {
        if (!target) return pendingItems.value.length > 0;
        const t = targets.value[target];
        if (!t || !t.items) return false;
        return Object.values(t.items).some((item: LoadingItem) => item.status === 'loading' || item.status === 'waiting');
    };

    /** Mapa chave lógica -> array de chaves internas */
    const keys = ref<Record<string, string[]>>({});
    const keys_target = ref<Record<string, string>>({});
    const count = ref(0);
    const doneTimers = new Map<string, ReturnType<typeof setTimeout>>();

    const clearTimers = (): void => {
        doneTimers.forEach((timer) => clearTimeout(timer));
        doneTimers.clear();
    };

    if (getCurrentScope()) onScopeDispose(() => {
        clearTimers();
    });

    const reset = (): void => {
        clearTimers();
        for (const target of Object.keys(targets.value ?? {})) delete targets.value[target];
        keys.value = {};
        keys_target.value = {};
        count.value = 0;
    };

    function start(item_loading: LoadingItem): void {
        const target = item_loading.target ?? 'body';
        const logicalKey = item_loading.key;

        let internalKey = null;
        if (keys.value[logicalKey]) for (const k of keys.value[logicalKey]) if (keys_target.value[k] === target) {
            internalKey = k;
            break;
        }


        if (!internalKey) {
            internalKey = String(count.value++).padStart(4, '0') + '.' + logicalKey;
            if (!keys.value[logicalKey]) keys.value[logicalKey] = [];
            keys.value[logicalKey].push(internalKey);
            keys_target.value[internalKey] = target;
        }

        const item: LoadingItem = {
            ...item_loading,
            key: internalKey,
            message: item_loading.message ?? 'Carregando mais informações.',
            status: item_loading.status ?? 'loading',
            target
        };

        targets.value[target] ??= { target, items: {} };
        targets.value[target].items[internalKey] = item;
    }

    function update(item_loading: LoadingItem): void {
        const logicalKey = item_loading.key;
        let internalKeys = keys.value[logicalKey];

        if (!internalKeys || internalKeys.length === 0) if (keys_target.value[logicalKey]) internalKeys = [logicalKey];
        else return;


        for (const k of internalKeys) {
            const target = keys_target.value[k];
            if (target && targets.value[target]?.items[k]) Object.assign(targets.value[target].items[k], item_loading);

        }
    }

    const resolveItems = (loading_key: string): { item: LoadingItem; internal_key: string; target: string }[] => {
        let internal_keys = keys.value[loading_key];

        if (!internal_keys || internal_keys.length === 0) if (keys_target.value[loading_key]) internal_keys = [loading_key];
        else internal_keys = [];


        const results: { item: LoadingItem; internal_key: string; target: string }[] = [];

        if (internal_keys.length > 0) {
            for (const internal_key of internal_keys) {
                let target = keys_target.value[internal_key];
                if (target && targets.value[target]?.items[internal_key]) results.push({ item: targets.value[target].items[internal_key], internal_key, target });

            }
            if (results.length > 0) return results;
        }

        for (const t of Object.values(targets.value ?? {})) {
            if (t.items[loading_key]) {
                results.push({ item: t.items[loading_key], internal_key: loading_key, target: t.target });
                continue;
            }
            for (const [iKey, item] of Object.entries(t.items)) {
                const dot = iKey.indexOf('.');
                if (dot !== -1 && iKey.substring(dot + 1) === loading_key) results.push({ item, internal_key: iKey, target: t.target });
                else if (item.key === loading_key) results.push({ item, internal_key: iKey, target: t.target });

            }
        }

        return results;
    };

    const removeFromKeys = (logicalKey: string, internalKey: string) => {
        if (keys.value[logicalKey]) {
            keys.value[logicalKey] = keys.value[logicalKey].filter((k) => k !== internalKey);
            if (keys.value[logicalKey].length === 0) delete keys.value[logicalKey];

        }
    };

    const dismiss = (loading_key?: string): void => {
        if (!loading_key) {
            reset();
            return;
        }

        const resolvedList = resolveItems(loading_key);
        if (resolvedList.length === 0) return;

        for (const { internal_key, target } of resolvedList) {
            const timer = doneTimers.get(internal_key);
            if (timer) {
                clearTimeout(timer);
                doneTimers.delete(internal_key);
            }

            delete targets.value[target]?.items[internal_key];
            delete keys_target.value[internal_key];

            const dotIndex = internal_key.indexOf('.');
            if (dotIndex !== -1) {
                const logical = internal_key.substring(dotIndex + 1);
                removeFromKeys(logical, internal_key);
            }
        }

        delete keys.value[loading_key];

        const totalItems = Object.values(targets.value ?? {}).reduce(
            (acc, t) => acc + size(t.items), 0
        );
        if (totalItems === 0) count.value = 0;
    };

    const end = (loading_key: string, options?: { done_duration?: number }): void => {
        const resolvedList = resolveItems(loading_key);
        if (resolvedList.length === 0) return;

        for (const { item, internal_key, target } of resolvedList) {
            const prevTimer = doneTimers.get(internal_key);
            if (prevTimer) {
                clearTimeout(prevTimer);
                doneTimers.delete(internal_key);
            }

            Object.assign(item, { status: 'done' });

            const dotIndex = internal_key.indexOf('.');
            if (dotIndex !== -1) {
                const logical = internal_key.substring(dotIndex + 1);
                removeFromKeys(logical, internal_key);
            }

            const duration = options?.done_duration ?? item.done_duration ?? 500;
            if (duration <= 0) {
                delete targets.value[target]?.items[internal_key];
                delete keys_target.value[internal_key];
                continue;
            }

            const timer = setTimeout(() => {
                doneTimers.delete(internal_key);
                if (targets.value[target]?.items[internal_key]?.status === 'done') {
                    delete targets.value[target]?.items[internal_key];
                    delete keys_target.value[internal_key];
                }
            }, duration);
            doneTimers.set(internal_key, timer);
        }
        delete keys.value[loading_key];
    };

    const error = (
        loading_key: string,
        errorOrMessage?: string | Error | { message?: string; error?: any; retry?: () => void | Promise<void> }
    ): void => {
        const resolvedList = resolveItems(loading_key);
        if (resolvedList.length === 0) return;

        for (const { item, internal_key, target } of resolvedList) {
            const prevTimer = doneTimers.get(internal_key);
            if (prevTimer) {
                clearTimeout(prevTimer);
                doneTimers.delete(internal_key);
            }

            let message: string | undefined;
            let errorData: any;
            let retryFn: (() => void | Promise<void>) | undefined;

            if (typeof errorOrMessage === 'string') message = errorOrMessage;
            else if (errorOrMessage instanceof Error) {
                message = errorOrMessage.message;
                errorData = errorOrMessage;
            } else if (errorOrMessage && typeof errorOrMessage === 'object') {
                message = errorOrMessage.message;
                errorData = errorOrMessage.error ?? errorOrMessage;
                retryFn = errorOrMessage.retry;
            }

            Object.assign(item, {
                status: 'error',
                ...(message ? { message } : {}),
                ...(errorData !== undefined ? { error: errorData } : {}),
                ...(retryFn ? { retry: retryFn } : {})
            });

            const dotIndex = internal_key.indexOf('.');
            if (dotIndex !== -1) {
                const logical = internal_key.substring(dotIndex + 1);
                if (!keys.value[logical]) keys.value[logical] = [];
                if (!keys.value[logical].includes(internal_key)) keys.value[logical].push(internal_key);

            }
            keys_target.value[internal_key] = target;
        }
    };

    const retry = async (loading_key: string): Promise<void> => {
        const resolvedList = resolveItems(loading_key);
        if (resolvedList.length === 0) return;

        for (const { item, internal_key, target } of resolvedList) {
            const prevTimer = doneTimers.get(internal_key);
            if (prevTimer) {
                clearTimeout(prevTimer);
                doneTimers.delete(internal_key);
            }

            const dotIndex = internal_key.indexOf('.');
            if (dotIndex !== -1) {
                const logical = internal_key.substring(dotIndex + 1);
                if (!keys.value[logical]) keys.value[logical] = [];
                if (!keys.value[logical].includes(internal_key)) keys.value[logical].push(internal_key);

            }
            keys_target.value[internal_key] = target;

            item.status = 'loading';
            item.error = undefined;

            if (item.retry) await item.retry();
        }
    };

    const stop = end;

    watchDebounced(targets, () => {
        const totalItems = Object.values(targets.value ?? {}).reduce(
            (acc, t) => acc + size(t.items), 0
        );
        if (totalItems === 0) count.value = 0;
    }, { debounce: 200, deep: true });

    return {
        targets,
        items,
        pendingItems,
        terminalItems,
        isPending,
        keys,
        keys_target,
        start,
        update,
        end,
        stop,
        error,
        dismiss,
        retry,
        reset
    };
});
