import { ref, computed, ComputedRef, Ref } from 'vue';

type MaybeRef<T> = Ref<T> | ComputedRef<T>;

export type VirtualListItem<T> = {
    item: T;
    index: number;
};

export type UseVirtualListOptions = {
    /** Altura fixa de cada linha, em pixels */
    itemHeight: MaybeRef<number>;
    /** Quando false, a lista inteira é retornada sem virtualizar */
    enabled: MaybeRef<boolean>;
    /** Itens extras renderizados acima e abaixo da janela visível */
    overscan?: number;
};

/**
 * Calcula a janela de itens visíveis de uma lista longa.
 * O consumidor informa o estado do scroll via setViewport() e renderiza
 * apenas visibleItems, deslocados por offsetY dentro de um container de totalHeight.
 */
export function useVirtualList<T>(items: MaybeRef<T[]>, options: UseVirtualListOptions) {
    const overscan = options.overscan ?? 5;
    const scrollTop = ref(0);
    const viewportHeight = ref(0);

    function setViewport(nextScrollTop: number, nextViewportHeight: number) {
        scrollTop.value = Math.max(0, nextScrollTop);
        viewportHeight.value = Math.max(0, nextViewportHeight);
    }

    const totalHeight = computed(() => items.value.length * options.itemHeight.value);

    const startIndex = computed(() => {
        if (!options.enabled.value) return 0;

        const first = Math.floor(scrollTop.value / options.itemHeight.value);
        return Math.max(0, first - overscan);
    });

    const endIndex = computed(() => {
        if (!options.enabled.value) return items.value.length;

        const visibleCount = Math.ceil(viewportHeight.value / options.itemHeight.value);
        const last = Math.floor(scrollTop.value / options.itemHeight.value) + visibleCount + overscan;
        return Math.min(items.value.length, last);
    });

    const visibleItems = computed<VirtualListItem<T>[]>(() =>
        items.value
            .slice(startIndex.value, endIndex.value)
            .map((item, offset) => ({ item, index: startIndex.value + offset }))
    );

    const offsetY = computed(() => (options.enabled.value ? startIndex.value * options.itemHeight.value : 0));

    return { visibleItems, offsetY, totalHeight, startIndex, setViewport };
}
