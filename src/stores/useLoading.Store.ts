import { defineStore } from 'pinia';
import type { Ref } from 'vue';
import { ref, computed } from 'vue';
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

    /** Mapa chave lógica → chave interna sequencial. */
    const keys = ref<Record<string, string>>({});

    /** Mapa chave interna → target. */
    const keys_target = ref<Record<string, string>>({});

    /** Contador usado para gerar chaves internas ordenáveis. */
    const count = ref(0);

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
     * Registra um novo item de carregamento.
     */
    function start(item_loading: LoadingItem): void {
        const key = setKeys(item_loading.key);
        const target = item_loading.target ?? 'body';

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
     * Resolve o item de um target, ou `null` quando ele não existe mais.
     */
    const resolveItem = (loading_key: string): LoadingItem | null => {
        const key = getKeys(loading_key);
        if (!key) return null;

        const target_key = keys_target.value[key] ?? null;

        if (!target_key || !targets.value[target_key] || size(targets.value[target_key].items) === 0) return null;

        return targets.value[target_key].items[key] ?? null;
    };

    /**
     * Marca um item como concluído e libera a chave lógica para reuso.
     */
    const end = (loading_key: string): void => {
        const item = resolveItem(loading_key);
        const internal_key = getKeys(loading_key, false);

        delete keys.value[loading_key];
        if (internal_key) delete keys_target.value[internal_key];

        if (item) Object.assign(item, { status: 'done' });
    };

    /**
     * Marca um item como erro.
     */
    const error = (loading_key: string): void => {
        const item = resolveItem(loading_key);

        if (item) Object.assign(item, { status: 'error' });
    };

    /** Alias de {@link end}, exigido pelo adapter do `@maxvue/max-pinia`. */
    const stop = end;

    /**
     * Limpa os targets que não têm mais nenhum item pendente.
     *
     * O debounce evita que a tela pisque entre dois carregamentos encadeados.
     */
    watchDebounced(targets, () => {
        Object.values(targets.value ?? {}).forEach((data: LoadingTarget) => {
            if (!data.items || size(data.items) === 0) return;

            const count_loading = Object.keys(data.items).filter(
                (key) => data.items[key]?.status === 'loading' || data.items[key]?.status === 'waiting'
            ).length;

            if (data.target && count_loading === 0) {
                Object.keys(data.items).forEach((internal_key) => {
                    delete keys_target.value[internal_key];
                });
                targets.value[data.target].items = {};
            }
        });

        const totalItems = Object.values(targets.value ?? {}).reduce(
            (acc, t) => acc + size(t.items), 0
        );
        if (totalItems === 0) count.value = 0;

    }, { debounce: 500, deep: true });

    return {
        targets,
        items,
        keys,
        keys_target,
        start,
        update,
        end,
        stop,
        error
    };
});
