import { ref, computed, unref, type ComputedRef, type Ref } from 'vue';

type MaybeRef<T> = Ref<T> | ComputedRef<T> | T;

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
    /** Altura padrão da viewport quando não mensurada (ex: JSDOM/inicial) */
    defaultViewportHeight?: number;
};

/**
 * Calcula a janela de itens visíveis de uma lista longa.
 * O consumidor informa o estado do scroll via setViewport() e renderiza
 * apenas visibleItems, deslocados por offsetY dentro de um container de totalHeight.
 */
export function useVirtualList<T>(items: MaybeRef<T[]>, options: UseVirtualListOptions) {
    const overscan = options.overscan ?? 5;
    const defaultViewportHeight = options.defaultViewportHeight ?? 200;
    const scrollTop = ref(0);
    const viewportHeight = ref(0);

    const resolvedItems = computed<T[]>(() => {
        const val = unref(items);
        return Array.isArray(val) ? val : [];
    });

    const itemHeight = computed(() => {
        const h = unref(options.itemHeight);
        return typeof h === 'number' && h > 0 ? h : 44;
    });

    const isEnabled = computed(() => Boolean(unref(options.enabled)));

    function setViewport(nextScrollTop: number, nextViewportHeight: number) {
        scrollTop.value = Math.max(0, nextScrollTop);
        viewportHeight.value = Math.max(0, nextViewportHeight);
    }

    const effectiveViewportHeight = computed(() => (viewportHeight.value > 0 ? viewportHeight.value : defaultViewportHeight));

    const totalHeight = computed(() => resolvedItems.value.length * itemHeight.value);

    const startIndex = computed(() => {
        if (!isEnabled.value) return 0;

        const first = Math.floor(scrollTop.value / itemHeight.value);
        const maxIndex = Math.max(0, resolvedItems.value.length - 1);
        return Math.min(maxIndex, Math.max(0, first - overscan));
    });

    const endIndex = computed(() => {
        if (!isEnabled.value) return resolvedItems.value.length;

        const visibleCount = Math.ceil(effectiveViewportHeight.value / itemHeight.value);
        const last = Math.floor(scrollTop.value / itemHeight.value) + visibleCount + overscan;
        return Math.min(resolvedItems.value.length, last);
    });

    const visibleItems = computed<VirtualListItem<T>[]>(() =>
        resolvedItems.value
            .slice(startIndex.value, endIndex.value)
            .map((item, offset) => ({ item, index: startIndex.value + offset }))
    );

    const offsetY = computed(() => (isEnabled.value ? startIndex.value * itemHeight.value : 0));

    function scrollToIndex(index: number, align: 'auto' | 'start' | 'center' | 'end' = 'auto'): number {
        const total = resolvedItems.value.length;
        if (total === 0 || itemHeight.value <= 0) return scrollTop.value;

        const clampedIndex = Math.max(0, Math.min(total - 1, index));
        const vpHeight = effectiveViewportHeight.value;
        const maxScroll = Math.max(0, totalHeight.value - vpHeight);
        let targetScroll = scrollTop.value;

        if (align === 'start') targetScroll = clampedIndex * itemHeight.value;
        else if (align === 'end') targetScroll = (clampedIndex + 1) * itemHeight.value - vpHeight;
        else if (align === 'center') targetScroll = clampedIndex * itemHeight.value + itemHeight.value / 2 - vpHeight / 2;
        else {
            const itemTop = clampedIndex * itemHeight.value;
            const itemBottom = itemTop + itemHeight.value;

            if (itemTop < scrollTop.value) targetScroll = itemTop;
            else if (itemBottom > scrollTop.value + vpHeight && vpHeight > 0) targetScroll = itemBottom - vpHeight;
        }

        scrollTop.value = Math.max(0, Math.min(maxScroll, targetScroll));
        return scrollTop.value;
    }

    return { visibleItems, offsetY, totalHeight, startIndex, endIndex, setViewport, scrollToIndex };
}
