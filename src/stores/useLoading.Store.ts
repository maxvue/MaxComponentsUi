import { defineStore } from 'pinia';
import type { Ref } from 'vue';
import { ref, computed, getCurrentScope, onScopeDispose } from 'vue';
import { valuesInKey, size, watchDebounced } from '@maxvue/max-use';

import type { LoadingItem, LoadingTarget, LoadingHandle } from '../types/app';

export type { LoadingHandle } from '../types/app';

export const useLoadingStore = defineStore('loading', () => {

    const targets: Ref<Record<string, LoadingTarget>> = ref({});
    const items = computed(() => valuesInKey(targets, 'items', []));
    const pendingItems = computed(() => items.value.filter((item: LoadingItem) => item.status === 'loading' || item.status === 'waiting'));
    const terminalItems = computed(() => items.value.filter((item: LoadingItem) => item.status === 'done' || item.status === 'error'));

    /** Mapa chave lógica -> array de chaves internas / handles */
    const keys = ref<Record<string, string[]>>({});
    /** Mapa handle / chave interna -> target onde está montado */
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

    const checkAndResetCountIfEmpty = (): void => {
        const totalItems = Object.values(targets.value ?? {}).reduce(
            (acc, t) => acc + size(t.items), 0
        );
        if (totalItems === 0) count.value = 0;
    };

    const reset = (): void => {
        clearTimers();
        for (const target of Object.keys(targets.value ?? {})) delete targets.value[target];
        keys.value = {};
        keys_target.value = {};
        count.value = 0;
    };

    /**
     * Inicia uma operação de carregamento e retorna um handle opaco identificador da operação (R15/F22).
     * Cada chamada a `start()` produz uma instância individual única, permitindo que instâncias
     * concorrentes A e B que compartilham a mesma chave lógica sejam controladas de forma independente.
     */
    function start(item_loading: LoadingItem): LoadingHandle {
        const target = item_loading.target ?? 'body';
        const logicalKey = item_loading.key;

        const internalKey = String(count.value++).padStart(4, '0') + '.' + logicalKey;
        const handle = internalKey as LoadingHandle;

        if (!keys.value[logicalKey]) keys.value[logicalKey] = [];
        keys.value[logicalKey].push(internalKey);
        keys_target.value[internalKey] = target;

        const item: LoadingItem = {
            ...item_loading,
            key: internalKey,
            handle,
            logicalKey,
            retryCount: item_loading.retryCount ?? 0,
            message: item_loading.message ?? 'Carregando mais informações.',
            status: item_loading.status ?? 'loading',
            target
        };

        targets.value[target] ??= { target, items: {} };
        targets.value[target].items[internalKey] = item;

        return handle;
    }

    /**
     * Resolve instâncias de carregamento a partir de um identificador.
     * Precedência:
     * 1. Se o identificador corresponder exatamente a um handle/chave interna individual,
     *    retorna EXATAMENTE essa instância única.
     * 2. Se corresponder a uma chave lógica, retorna determinística e explicitamente
     *    TODAS as instâncias associadas àquela chave lógica.
     */
    const resolveItems = (identifier: string | LoadingHandle): { item: LoadingItem; internal_key: string; target: string }[] => {
        const idStr = String(identifier);

        // 1. Caso seja um handle específico registrado em keys_target
        const directTarget = keys_target.value[idStr];
        if (directTarget && targets.value[directTarget]?.items[idStr]) return [{ item: targets.value[directTarget].items[idStr], internal_key: idStr, target: directTarget }];


        // 2. Caso exista diretamente em algum target pelo ID do handle
        for (const t of Object.values(targets.value ?? {})) if (t.items[idStr]) return [{ item: t.items[idStr], internal_key: idStr, target: t.target }];


        // 3. Caso seja uma chave lógica agrupando uma ou mais instâncias
        const results: { item: LoadingItem; internal_key: string; target: string }[] = [];
        const logicalHandles = keys.value[idStr];

        if (logicalHandles && logicalHandles.length > 0) {
            for (const h of logicalHandles) {
                const target = keys_target.value[h];
                if (target && targets.value[target]?.items[h]) results.push({ item: targets.value[target].items[h], internal_key: h, target });

            }
            if (results.length > 0) return results;
        }

        // 4. Fallback estrutural: busca nos targets instâncias cuja chave lógica corresponda ao idStr
        for (const t of Object.values(targets.value ?? {})) for (const [iKey, item] of Object.entries(t.items)) {
            if (results.some((r) => r.internal_key === iKey)) continue;

            const dot = iKey.indexOf('.');
            if (dot !== -1 && iKey.substring(dot + 1) === idStr) results.push({ item, internal_key: iKey, target: t.target });
            else if (item.logicalKey === idStr || item.key === idStr) results.push({ item, internal_key: iKey, target: t.target });

        }


        return results;
    };

    const isPending = (targetOrKeyOrHandle?: string | LoadingHandle): boolean => {
        if (!targetOrKeyOrHandle) return pendingItems.value.length > 0;
        const raw = String(targetOrKeyOrHandle);

        const t = targets.value[raw];
        if (t && t.items) return Object.values(t.items).some((item: LoadingItem) => item.status === 'loading' || item.status === 'waiting');


        const resolved = resolveItems(raw);
        if (resolved.length > 0) return resolved.some(({ item }) => item.status === 'loading' || item.status === 'waiting');


        return false;
    };

    function update(item_loading: Partial<LoadingItem> & { key?: string; handle?: LoadingHandle }): void {
        const identifier = item_loading.handle ?? item_loading.key;
        if (!identifier) return;

        const resolvedList = resolveItems(identifier);
        for (const { item } of resolvedList) Object.assign(item, item_loading);

    }

    const removeFromKeys = (logicalKey: string, internalKey: string) => {
        if (keys.value[logicalKey]) {
            keys.value[logicalKey] = keys.value[logicalKey].filter((k) => k !== internalKey);
            if (keys.value[logicalKey].length === 0) delete keys.value[logicalKey];
        }
    };

    /**
     * Encerra uma operação de carregamento.
     * - Se fornecido um `handle`, encerra EXATAMENTE a instância individual correspondente.
     * - Se fornecida uma `chave lógica`, encerra de forma explícita e determinística
     *   TODAS as instâncias associadas àquela chave.
     */
    const end = (keyOrHandle: string | LoadingHandle, options?: { done_duration?: number }): void => {
        const resolvedList = resolveItems(keyOrHandle);
        if (resolvedList.length === 0) return;

        const idStr = String(keyOrHandle);
        const isHandleDirect = Boolean(keys_target.value[idStr]);

        for (const { item, internal_key, target } of resolvedList) {
            const prevTimer = doneTimers.get(internal_key);
            if (prevTimer) {
                clearTimeout(prevTimer);
                doneTimers.delete(internal_key);
            }

            Object.assign(item, { status: 'done' });

            const logical = item.logicalKey ?? (internal_key.indexOf('.') !== -1 ? internal_key.substring(internal_key.indexOf('.') + 1) : internal_key);
            removeFromKeys(logical, internal_key);

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
                    checkAndResetCountIfEmpty();
                }
            }, duration);
            doneTimers.set(internal_key, timer);
        }

        if (!isHandleDirect && keys.value[idStr]) delete keys.value[idStr];


        checkAndResetCountIfEmpty();
    };

    const stop = end;

    /**
     * Marca uma operação com status de erro e registra detalhes/recuperação.
     * Suporta handle individual ou chave lógica.
     */
    const error = (
        keyOrHandle: string | LoadingHandle,
        errorOrMessage?: string | Error | { message?: string; error?: any; retry?: () => void | Promise<void> }
    ): void => {
        const resolvedList = resolveItems(keyOrHandle);
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

            const logical = item.logicalKey ?? (internal_key.indexOf('.') !== -1 ? internal_key.substring(internal_key.indexOf('.') + 1) : internal_key);
            if (!keys.value[logical]) keys.value[logical] = [];
            if (!keys.value[logical].includes(internal_key)) keys.value[logical].push(internal_key);
            keys_target.value[internal_key] = target;
        }
    };

    /**
     * Executa a recuperação via retry de uma operação.
     * Incrementa o contador de retryCount e reinicia o status como 'loading'.
     */
    const retry = async (keyOrHandle: string | LoadingHandle): Promise<void> => {
        const resolvedList = resolveItems(keyOrHandle);
        if (resolvedList.length === 0) return;

        for (const { item, internal_key, target } of resolvedList) {
            const prevTimer = doneTimers.get(internal_key);
            if (prevTimer) {
                clearTimeout(prevTimer);
                doneTimers.delete(internal_key);
            }

            const logical = item.logicalKey ?? (internal_key.indexOf('.') !== -1 ? internal_key.substring(internal_key.indexOf('.') + 1) : internal_key);
            if (!keys.value[logical]) keys.value[logical] = [];
            if (!keys.value[logical].includes(internal_key)) keys.value[logical].push(internal_key);
            keys_target.value[internal_key] = target;

            item.retryCount = (item.retryCount ?? 0) + 1;
            item.status = 'loading';
            item.error = undefined;

            if (item.retry) await item.retry();
        }
    };

    /**
     * Descarta imediatamente operações de carregamento.
     * Sem parâmetros: descarta tudo (`reset()`).
     * Com handle: descarta apenas a instância específica.
     * Com chave lógica: descarta todas as instâncias associadas.
     */
    const dismiss = (keyOrHandle?: string | LoadingHandle): void => {
        if (!keyOrHandle) {
            reset();
            return;
        }

        const resolvedList = resolveItems(keyOrHandle);
        if (resolvedList.length === 0) return;

        const idStr = String(keyOrHandle);
        const isHandleDirect = Boolean(keys_target.value[idStr]);

        for (const { item, internal_key, target } of resolvedList) {
            const timer = doneTimers.get(internal_key);
            if (timer) {
                clearTimeout(timer);
                doneTimers.delete(internal_key);
            }

            delete targets.value[target]?.items[internal_key];
            delete keys_target.value[internal_key];

            const logical = item.logicalKey ?? (internal_key.indexOf('.') !== -1 ? internal_key.substring(internal_key.indexOf('.') + 1) : internal_key);
            removeFromKeys(logical, internal_key);
        }

        if (!isHandleDirect && keys.value[idStr]) delete keys.value[idStr];


        checkAndResetCountIfEmpty();
    };

    watchDebounced(targets, () => {
        checkAndResetCountIfEmpty();
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
