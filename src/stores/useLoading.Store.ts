import { defineStore } from 'pinia';
import type { Ref } from 'vue';
import { ref, computed, getCurrentScope, onScopeDispose } from 'vue';
import { valuesInKey, size, watchDebounced } from '@maxvue/max-use';

import type { LoadingItem, LoadingTarget } from '../types/app';

/**
 * Store da fila de carregamento global.
 *
 * Cada item é registrado sob um *target* (o seletor onde a tela de loading é
 * renderizada, `'body'` por padrão) e recebe uma chave interna sequencial, o
 * que preserva a ordem de exibição mesmo quando duas chamadas usam a mesma
 * chave lógica.
 *
 * Também é o adapter de loading consumido pelo `@maxvue/max-pinia`
 * (`createMaxPinia({ loading: { start, stop, update } })`).
 */
export const useLoadingStore = defineStore('loading', () => {

    /** Itens agrupados por target. */
    const targets: Ref<Record<string, LoadingTarget>> = ref({});

    /** Todos os itens de todos os targets, achatados. */
    const items = computed(() => valuesInKey(targets, 'items', []));

    /** Itens em estado pendente (loading ou waiting). */
    const pendingItems = computed(() => items.value.filter((item: LoadingItem) => item.status === 'loading' || item.status === 'waiting'));

    /** Itens em estado terminal (done ou error). */
    const terminalItems = computed(() => items.value.filter((item: LoadingItem) => item.status === 'done' || item.status === 'error'));

    /** Verifica se há algum item pendente (globalmente ou para um target específico). */
    const isPending = (target?: string): boolean => {
        if (!target) return pendingItems.value.length > 0;
        const t = targets.value[target];
        if (!t || !t.items) return false;
        return Object.values(t.items).some((item: LoadingItem) => item.status === 'loading' || item.status === 'waiting');
    };

    /** Mapa chave lógica → chave interna sequencial. */
    const keys = ref<Record<string, string>>({});

    /** Mapa chave interna → target. */
    const keys_target = ref<Record<string, string>>({});

    /** Contador usado para gerar chaves internas ordenáveis. */
    const count = ref(0);

    /** Timers ativos de auto-limpeza de itens concluídos. */
    const doneTimers = new Map<string, ReturnType<typeof setTimeout>>();

    /** Cancela e descarta todos os timers ativos em doneTimers. */
    const clearTimers = (): void => {
        doneTimers.forEach((timer) => clearTimeout(timer));
        doneTimers.clear();
    };

    if (getCurrentScope()) onScopeDispose(() => {
        clearTimers();
    });


    /**
     * Gera (uma única vez) a chave interna de uma chave lógica.
     * O prefixo numérico com zeros à esquerda mantém a ordem de inserção.
     */
    const setKeys = (key: string) => keys.value[key] ??= String(count.value++).padStart(4, '0') + '.' + key;

    /**
     * Devolve a chave interna de uma chave lógica.
     *
     * @param create Quando `true` (padrão), cria a chave se ainda não existir.
     */
    const getKeys = (key: string, create: boolean = true) => {
        if (create) return keys.value[key] ?? setKeys(key);

        return keys.value[key] ?? null;
    };

    /**
     * Reseta completamente a store, cancelando timers e esvaziando todas as filas.
     */
    const reset = (): void => {
        clearTimers();
        for (const target of Object.keys(targets.value ?? {})) delete targets.value[target];
        keys.value = {};
        keys_target.value = {};
        count.value = 0;
    };

    /**
     * Registra um novo item de carregamento.
     */
    function start(item_loading: LoadingItem): void {
        const target = item_loading.target ?? 'body';
        let key = keys.value[item_loading.key];

        // Se a chave lógica já existe mas está vinculada a outro target ativo, gera nova chave interna para evitar conflito
        if (!key || (keys_target.value[key] && keys_target.value[key] !== target)) {
            key = String(count.value++).padStart(4, '0') + '.' + item_loading.key;
            keys.value[item_loading.key] = key;
        }

        keys_target.value[key] = target;

        const item: LoadingItem = {
            ...item_loading,
            key,
            message: item_loading.message ?? 'Carregando mais informações.',
            status: item_loading.status ?? 'loading',
            target
        };

        targets.value[target] ??= { target, items: {} };
        targets.value[target].items[key] = item;
    }

    /**
     * Atualiza um item já registrado. Ignora chaves desconhecidas.
     */
    function update(item_loading: LoadingItem): void {
        const key = getKeys(item_loading.key);
        const target = key ? keys_target.value[key] ?? null : null;

        if (!target || !targets.value[target]?.items[key as string]) return;

        Object.assign(targets.value[target].items[key as string], item_loading);
    }

    /**
     * Resolve o item de um target, sua chave interna e seu target, ou `null` quando não existe.
     */
    const resolveItem = (loading_key: string): { item: LoadingItem; internal_key: string; target: string } | null => {
        let internal_key = keys.value[loading_key] ?? null;
        if (!internal_key && keys_target.value[loading_key]) internal_key = loading_key;

        if (!internal_key) {
            for (const t of Object.values(targets.value ?? {})) {
                if (t.items[loading_key]) return { item: t.items[loading_key], internal_key: loading_key, target: t.target };
                for (const [iKey, item] of Object.entries(t.items)) {
                    const dot = iKey.indexOf('.');
                    if (dot !== -1 && iKey.substring(dot + 1) === loading_key) return { item, internal_key: iKey, target: t.target };
                    if (item.key === loading_key) return { item, internal_key: iKey, target: t.target };
                }
            }

            return null;
        }

        let target = keys_target.value[internal_key] ?? null;
        if (!target || !targets.value[target] || !targets.value[target].items[internal_key]) for (const t of Object.values(targets.value ?? {})) if (t.items[internal_key]) {
            target = t.target;
            keys_target.value[internal_key] = target;
            break;
        }


        if (!target || !targets.value[target] || !targets.value[target].items[internal_key]) return null;

        return { item: targets.value[target].items[internal_key], internal_key, target };
    };

    /**
     * Descarta explicitamente um item ou todos os itens da fila de carregamento e limpa suas referências.
     */
    const dismiss = (loading_key?: string): void => {
        if (!loading_key) {
            reset();
            return;
        }

        const resolved = resolveItem(loading_key);
        if (!resolved) return;

        const { internal_key, target } = resolved;
        const timer = doneTimers.get(internal_key);
        if (timer) {
            clearTimeout(timer);
            doneTimers.delete(internal_key);
        }

        delete targets.value[target]?.items[internal_key];
        delete keys_target.value[internal_key];
        delete keys.value[loading_key];

        const dotIndex = internal_key.indexOf('.');
        if (dotIndex !== -1) {
            const logical = internal_key.substring(dotIndex + 1);
            if (keys.value[logical] === internal_key) delete keys.value[logical];
        }

        const totalItems = Object.values(targets.value ?? {}).reduce(
            (acc, t) => acc + size(t.items), 0
        );
        if (totalItems === 0) count.value = 0;
    };

    /**
     * Marca um item como concluído e programa seu descarte de acordo com a política terminal.
     */
    const end = (loading_key: string, options?: { done_duration?: number }): void => {
        const resolved = resolveItem(loading_key);
        if (!resolved) return;

        const { item, internal_key, target } = resolved;
        const prevTimer = doneTimers.get(internal_key);
        if (prevTimer) {
            clearTimeout(prevTimer);
            doneTimers.delete(internal_key);
        }

        Object.assign(item, { status: 'done' });

        // Libera a chave lógica imediatamente para permitir novos ciclos
        delete keys.value[loading_key];
        const dotIndex = internal_key.indexOf('.');
        if (dotIndex !== -1) {
            const logical = internal_key.substring(dotIndex + 1);
            if (keys.value[logical] === internal_key) delete keys.value[logical];
        }

        const duration = options?.done_duration ?? item.done_duration ?? 500;
        if (duration <= 0) {
            dismiss(internal_key);
            return;
        }

        const timer = setTimeout(() => {
            doneTimers.delete(internal_key);
            if (targets.value[target]?.items[internal_key]?.status === 'done') dismiss(internal_key);
        }, duration);
        doneTimers.set(internal_key, timer);
    };

    /**
     * Marca um item com status de erro. Persiste indefinidamente até dismiss() ou retry() explícito.
     */
    const error = (
        loading_key: string,
        errorOrMessage?: string | Error | { message?: string; error?: any; retry?: () => void | Promise<void> }
    ): void => {
        const resolved = resolveItem(loading_key);
        if (!resolved) return;

        const { item, internal_key, target } = resolved;
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

        // Assegura que a chave lógica permaneça mapeada para a identidade interna do item enquanto existir
        const dotIndex = internal_key.indexOf('.');
        if (dotIndex !== -1) {
            const logical = internal_key.substring(dotIndex + 1);
            keys.value[logical] = internal_key;
        }
        keys.value[loading_key] = internal_key;
        keys_target.value[internal_key] = target;
    };

    /**
     * Executa a recuperação de um item que possui callback retry registrado.
     */
    const retry = async (loading_key: string): Promise<void> => {
        const resolved = resolveItem(loading_key);
        if (!resolved) return;

        const { item, internal_key, target } = resolved;
        const prevTimer = doneTimers.get(internal_key);
        if (prevTimer) {
            clearTimeout(prevTimer);
            doneTimers.delete(internal_key);
        }

        // Assegura que a chave lógica esteja íntegra no mapa de chaves
        const dotIndex = internal_key.indexOf('.');
        if (dotIndex !== -1) {
            const logical = internal_key.substring(dotIndex + 1);
            keys.value[logical] = internal_key;
        }
        keys.value[loading_key] = internal_key;
        keys_target.value[internal_key] = target;

        item.status = 'loading';
        item.error = undefined;

        if (item.retry) await item.retry();
    };

    /** Alias de {@link end}, exigido pelo adapter do `@maxvue/max-pinia`. */
    const stop = end;

    /**
     * Reseta contador global quando não há itens.
     */
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
