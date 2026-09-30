<template>
    <div
        ref="containerRef"
        class="max-card-list"
        :class="{
            'is-loading': props.loading,
            'is-empty': !props.loading && displayItems.length === 0 && !hasGridAddCard,
            'is-virtual': isVirtualActive
        }"
    >
        <!-- Cabeçalho (Header, Títulos, MaxStats, Categorias e Ações) -->
        <header v-if="hasHeader" class="max-card-list-header">
            <div class="max-card-list-header-main">
                <slot
                    name="header"
                    :total="props.items?.length ?? 0"
                    :filtered-count="displayItems.length"
                    :items="displayItems"
                >
                    <div v-if="props.title || props.subtitle" class="max-card-list-titles">
                        <h2 v-if="props.title" class="max-card-list-title">{{ props.title }}</h2>
                        <p v-if="props.subtitle" class="max-card-list-subtitle">{{ props.subtitle }}</p>
                    </div>

                    <!-- Integração semântica com MaxStats -->
                    <MaxStats
                        v-if="props.stats && props.stats.length > 0"
                        :items="props.stats"
                        class="max-card-list-stats"
                    />
                </slot>
            </div>

            <!-- Ações, Seletor de Categoria e Add Card no cabeçalho -->
            <div
                v-if="hasHeaderActions"
                class="max-card-list-header-actions"
            >
                <!-- Seletor de Categoria Compacto Integrado -->
                <div v-if="hasCategories" class="max-card-list-category-wrapper">
                    <select
                        :value="internalCategory"
                        class="max-card-list-category-select"
                        :aria-label="props.categoryPlaceholder || 'Filtrar por categoria'"
                        @change="onCategoryChange"
                    >
                        <option value="">{{ props.categoryPlaceholder || 'Todas as categorias' }}</option>
                        <option
                            v-for="cat in normalizedCategories"
                            :key="String(cat.value)"
                            :value="cat.value"
                        >
                            {{ cat.label }}
                        </option>
                    </select>
                </div>

                <div v-if="$slots['add-card'] && props.addCardPosition === 'header'" class="max-card-list-header-add">
                    <slot name="add-card" />
                </div>
                <slot name="actions" />
            </div>
        </header>

        <!-- Slot de Filtros Customizados (quando fornecido explicitamente) -->
        <div v-if="$slots.filters" class="max-card-list-controls">
            <slot
                name="filters"
                :search="effectiveSearchQuery"
                :category="internalCategory"
                :categories="normalizedCategories"
                :set-search="setSearch"
                :set-category="setCategory"
            />
        </div>

        <!-- Estado de Carregamento Pré-estilizado com MaxLoader -->
        <div v-if="props.loading" class="max-card-list-status max-card-list-loading" role="status" aria-live="polite">
            <slot name="loading">
                <MaxLoader :label="props.loadingLabel || 'Carregando cards...'" />
            </slot>
        </div>

        <!-- Estado Vazio Pré-estilizado com MaxEmptyDiv -->
        <div
            v-else-if="displayItems.length === 0 && !hasGridAddCard"
            class="max-card-list-status max-card-list-empty"
            role="region"
            aria-live="polite"
        >
            <slot name="empty" :search="effectiveSearchQuery" :category="internalCategory">
                <MaxEmptyDiv :label="props.emptyLabel || 'Nenhum card encontrado'" />
            </slot>
        </div>

        <!-- Grid Virtualizado via @tanstack/vue-virtual com medição dinâmica -->
        <div
            v-else-if="isVirtualActive"
            ref="scrollContainerRef"
            class="max-card-list-scroll"
            :style="scrollContainerStyle"
            @scroll="onScroll"
        >
            <div
                class="max-card-list-viewport"
                :style="{
                    height: `${virtualizer.getTotalSize()}px`,
                    width: '100%',
                    position: 'relative'
                }"
            >
                <div
                    v-for="virtualRow in virtualizer.getVirtualItems()"
                    :key="String(virtualRow.key)"
                    :ref="(el) => measureRow(el as Element)"
                    :data-index="virtualRow.index"
                    class="max-card-list-row"
                    :style="{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        transform: `translateY(${virtualRow.start}px)`
                    }"
                >
                    <div
                        class="max-card-list-grid"
                        :style="gridLayoutStyle"
                    >
                        <div
                            v-for="(cellItem, colIdx) in rows[virtualRow.index]"
                            :key="cellItem?.__isAddSlot ? '__add_slot__' : getItemKey(cellItem, getActualItemIndex(virtualRow.index, colIdx))"
                            class="max-card-list-col"
                            :class="{ 'max-card-list-col--add': cellItem?.__isAddSlot }"
                        >
                            <template v-if="cellItem?.__isAddSlot">
                                <slot name="add-card" />
                            </template>
                            <template v-else>
                                <slot
                                    name="card"
                                    :item="cellItem"
                                    :index="getActualItemIndex(virtualRow.index, colIdx)"
                                >
                                    <slot
                                        name="item"
                                        :item="cellItem"
                                        :index="getActualItemIndex(virtualRow.index, colIdx)"
                                    >
                                        <MaxCard
                                            :title="cellItem.title"
                                            :subtitle="cellItem.subtitle"
                                            :icon="cellItem.icon"
                                            :disabled="cellItem.disabled"
                                            :loading="cellItem.loading"
                                        />
                                    </slot>
                                </slot>
                            </template>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Grid Estático (fallback quando virtualScroll === false) -->
        <div
            v-else
            class="max-card-list-static-grid"
            :style="gridLayoutStyle"
        >
            <!-- Card de Adicionar junto com os demais cards no grid -->
            <div
                v-if="hasGridAddCard"
                class="max-card-list-col max-card-list-col--add"
            >
                <slot name="add-card" />
            </div>

            <div
                v-for="(item, index) in displayItems"
                :key="getItemKey(item, index)"
                class="max-card-list-col"
            >
                <slot
                    name="card"
                    :item="item"
                    :index="index"
                >
                    <slot
                        name="item"
                        :item="item"
                        :index="index"
                    >
                        <MaxCard
                            :title="item.title"
                            :subtitle="item.subtitle"
                            :icon="item.icon"
                            :disabled="item.disabled"
                            :loading="item.loading"
                        />
                    </slot>
                </slot>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import {
        ref,
        computed,
        watch,
        onMounted,
        onUnmounted,
        useSlots,
        type CSSProperties
    } from 'vue';
    import { useVirtualizer } from '@tanstack/vue-virtual';
    import { useElementSize } from '@maxvue/max-use';
    import MaxCard from './MaxCard.vue';
    import MaxStats from './MaxStats.vue';
    import MaxLoader from './MaxLoader.vue';
    import MaxEmptyDiv from './MaxEmptyDiv.vue';
    import { useSearchBarStore } from '../stores/useSearchBar.Store';
    import type {
        MaxCardListProps,
        MaxCardListFilterPayload,
        MaxCardListCategoryOption
    } from '../types/card';

    const props = withDefaults(defineProps<MaxCardListProps>(), {
        items: () => [],
        itemKey: undefined,
        minCardWidth: 320,
        columns: undefined,
        gap: 16,
        estimateSize: 240,
        height: '600px',
        maxHeight: undefined,
        overscan: 3,
        virtualScroll: true,
        loading: false,
        loadingLabel: 'Carregando cards...',
        emptyLabel: 'Nenhum card encontrado',
        filterable: true,
        useGlobalSearch: true,
        searchQuery: '',
        searchPlaceholder: 'Pesquisar cards...',
        category: '',
        categories: () => [],
        categoryPlaceholder: 'Todas as categorias',
        addCardPosition: 'top',
        title: undefined,
        subtitle: undefined,
        stats: () => [],
        filterFn: undefined,
        customFilter: false,
        defaultColumns: 3
    });

    const emit = defineEmits<{
        'update:searchQuery': [query: string];
        'update:search': [query: string];
        'update:category': [category: any];
        'update:filter': [filter: MaxCardListFilterPayload];
        'search': [query: string];
        'scroll': [event: Event];
    }>();

    const slots = useSlots();
    const searchBar = useSearchBarStore();

    // Estado interno reativo de busca e categoria
    const internalSearch = ref<string>(props.searchQuery ?? '');
    const internalCategory = ref<any>(props.category ?? '');

    let previousSearchBarVisibility = false;

    onMounted(() => {
        if (props.useGlobalSearch !== false) {
            previousSearchBarVisibility = searchBar.is_visible;
            searchBar.is_visible = true;
        }
    });

    onUnmounted(() => {
        if (props.useGlobalSearch !== false) searchBar.is_visible = previousSearchBarVisibility;

    });

    watch(
        () => props.searchQuery,
        (val) => {
            if (val !== undefined && val !== internalSearch.value) internalSearch.value = val;

        }
    );

    watch(
        () => props.category,
        (val) => {
            if (val !== undefined && val !== internalCategory.value) internalCategory.value = val;

        }
    );

    // Texto de busca efetivo (prioriza prop direta, depois store global se habilitada, depois estado interno)
    const effectiveSearchQuery = computed<string>(() => {
        if (props.searchQuery !== undefined && props.searchQuery !== '') return props.searchQuery;

        if (props.useGlobalSearch !== false) return searchBar.search_value || searchBar.input_value || '';

        return internalSearch.value || '';
    });

    watch(
        () => searchBar.search_value,
        (val) => {
            if (props.useGlobalSearch !== false && !props.searchQuery) {
                internalSearch.value = val;
                emit('update:searchQuery', val);
                emit('update:search', val);
                emit('search', val);
                emit('update:filter', {
                    search: val,
                    category: internalCategory.value
                });
            }
        }
    );

    // Normalização das categorias
    const normalizedCategories = computed<MaxCardListCategoryOption[]>(() => {
        if (!props.categories || !props.categories.length) return [];
        return props.categories.map((cat) => {
            if (typeof cat === 'string') return { label: cat, value: cat };
            return cat;
        });
    });

    const hasCategories = computed(() => normalizedCategories.value.length > 0);
    const hasHeaderContent = computed(() => Boolean(props.title || props.subtitle || (props.stats && props.stats.length > 0)));
    const hasHeaderActions = computed(() => Boolean(slots.actions || hasCategories.value || (slots['add-card'] && props.addCardPosition === 'header')));
    const hasHeader = computed(() => Boolean(slots.header || hasHeaderContent.value || hasHeaderActions.value));
    const hasGridAddCard = computed(() => Boolean(slots['add-card'] && props.addCardPosition !== 'header'));

    // Elemento container para medição de largura responsiva
    const containerRef = ref<HTMLElement | null>(null);
    const { width: measuredWidth } = useElementSize(containerRef);

    // Auto-cálculo dinâmico de colunas baseado na largura e minCardWidth
    const effectiveColumns = computed<number>(() => {
        if (props.columns && props.columns > 0) return Math.floor(props.columns);

        const minW = props.minCardWidth && props.minCardWidth > 0 ? props.minCardWidth : 320;
        const g = props.gap !== undefined ? props.gap : 16;
        const width = measuredWidth.value || (containerRef.value?.clientWidth ?? 0);

        if (width > 0) {
            const calculated = Math.floor((width + g) / (minW + g));
            return Math.max(1, calculated);
        }

        return props.defaultColumns && props.defaultColumns > 0 ? props.defaultColumns : 3;
    });

    // Filtragem dos itens da lista
    const displayItems = computed<any[]>(() => {
        const rawItems = props.items ?? [];
        if (props.customFilter) return rawItems;

        const searchTrimmed = effectiveSearchQuery.value?.trim().toLowerCase() ?? '';
        const currentCat = internalCategory.value;

        return rawItems.filter((item) => {
            if (!item) return false;

            if (props.filterFn) return props.filterFn(item, effectiveSearchQuery.value, internalCategory.value);

            // Filtro por texto de busca
            if (searchTrimmed) if (!matchesSearchQuery(item, searchTrimmed)) return false;


            // Filtro por categoria
            if (currentCat !== undefined && currentCat !== '' && currentCat !== null && currentCat !== 'all') {
                const itemCat = item.category ?? item.type ?? item.status;
                if (itemCat !== currentCat) return false;
            }

            return true;
        });
    });

    function matchesSearchQuery(item: any, query: string): boolean {
        if (typeof item === 'string' || typeof item === 'number') return String(item).toLowerCase().includes(query);

        if (typeof item === 'object') {
            const priorityKeys = ['title', 'name', 'label', 'subtitle', 'description'];
            for (const key of priorityKeys) if (item[key] && typeof item[key] === 'string' && item[key].toLowerCase().includes(query)) return true;


            for (const key of Object.keys(item)) {
                const val = item[key];
                if (typeof val === 'string' && val.toLowerCase().includes(query)) return true;
                if (typeof val === 'number' && String(val).includes(query)) return true;
            }
        }
        return false;
    }

    // Agrupamento em linhas para virtualização de grid responsivo com Add Card integrado
    const rows = computed<any[][]>(() => {
        const list = displayItems.value;
        const cols = effectiveColumns.value;
        const hasAdd = hasGridAddCard.value;

        if (!list || (list.length === 0 && !hasAdd)) return [];

        const gridItems: any[] = hasAdd ? [{ __isAddSlot: true }, ...list] : list;
        const result: any[][] = [];
        for (let i = 0; i < gridItems.length; i += cols) result.push(gridItems.slice(i, i + cols));


        return result;
    });

    function getActualItemIndex(rowIndex: number, colIndex: number): number {
        const flatIndex = rowIndex * effectiveColumns.value + colIndex;
        return hasGridAddCard.value ? flatIndex - 1 : flatIndex;
    }

    const isVirtualActive = computed(() => props.virtualScroll !== false);

    // Instância do virtual scroller do TanStack Virtual com medição dinâmica
    const scrollContainerRef = ref<HTMLElement | null>(null);

    const virtualizer = useVirtualizer(
        computed(() => ({
            count: isVirtualActive.value ? rows.value.length : 0,
            getScrollElement: () => scrollContainerRef.value,
            estimateSize: () => props.estimateSize ?? 240,
            overscan: props.overscan ?? 3,
            enabled: isVirtualActive.value,
            measureElement: (element: HTMLElement) => {
                if (!element) return props.estimateSize ?? 240;
                const height = Math.round(element.getBoundingClientRect().height);
                return height > 0 ? height : (props.estimateSize ?? 240);
            }
        }))
    );

    function measureRow(el: Element | null) {
        if (el && isVirtualActive.value && virtualizer.value) virtualizer.value.measureElement(el as HTMLElement);

    }

    // Estilos do layout de grade e container de scroll
    const gridLayoutStyle = computed<CSSProperties>(() => ({
        display: 'grid',
        gridTemplateColumns: `repeat(${effectiveColumns.value}, minmax(0, 1fr))`,
        gridAutoRows: '1fr',
        gap: `${props.gap ?? 16}px`
    }));

    const scrollContainerStyle = computed<CSSProperties>(() => {
        const style: CSSProperties = {
            overflowY: 'auto',
            position: 'relative'
        };
        if (props.height) style.height = typeof props.height === 'number' ? `${props.height}px` : props.height;

        if (props.maxHeight) style.maxHeight = typeof props.maxHeight === 'number' ? `${props.maxHeight}px` : props.maxHeight;

        return style;
    });

    function getItemKey(item: any, fallbackIndex: number): string | number {
        if (props.itemKey) {
            if (typeof props.itemKey === 'function') return props.itemKey(item, fallbackIndex);
            if (typeof props.itemKey === 'string' && item && typeof item === 'object') return item[props.itemKey] ?? fallbackIndex;
        }
        if (item && typeof item === 'object' && ('id' in item || 'key' in item)) return item.id ?? item.key ?? fallbackIndex;

        return fallbackIndex;
    }

    // Handlers de interação e eventos reativos
    function onCategoryChange(event: Event) {
        const target = event.target as HTMLSelectElement;
        const val = target.value;
        internalCategory.value = val;
        emit('update:category', val);
        emit('update:filter', {
            search: effectiveSearchQuery.value,
            category: val
        });
    }

    function setSearch(query: string) {
        internalSearch.value = query;
        if (props.useGlobalSearch !== false) {
            searchBar.input_value = query;
            searchBar.search_value = query;
        }
        emit('update:searchQuery', query);
        emit('update:search', query);
        emit('search', query);
        emit('update:filter', {
            search: query,
            category: internalCategory.value
        });
    }

    function setCategory(cat: any) {
        internalCategory.value = cat;
        emit('update:category', cat);
        emit('update:filter', {
            search: effectiveSearchQuery.value,
            category: cat
        });
    }

    function onScroll(event: Event) {
        emit('scroll', event);
    }

    // Métodos públicos expostos via defineExpose
    defineExpose({
        virtualizer,
        computedColumns: effectiveColumns,
        filteredItems: displayItems,
        totalItems: computed(() => props.items?.length ?? 0),
        scrollToIndex: (index: number, options?: { align?: 'start' | 'center' | 'end' | 'auto'; behavior?: 'auto' | 'smooth' }) => {
            if (!virtualizer.value) return;
            const rowIndex = Math.floor(index / effectiveColumns.value);
            virtualizer.value.scrollToIndex(rowIndex, options);
        },
        scrollToOffset: (offset: number, options?: { align?: 'start' | 'center' | 'end' | 'auto'; behavior?: 'auto' | 'smooth' }) => {
            virtualizer.value?.scrollToOffset(offset, options);
        },
        setSearch,
        setCategory
    });
</script>

<style scoped lang="scss">
    .max-card-list {
        display: flex;
        flex-direction: column;
        width: 100%;
        position: relative;
        box-sizing: border-box;
        gap: 0.875rem;
    }

    .max-card-list-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 0.875rem;
        padding-bottom: 0.25rem;
    }

    .max-card-list-header-main {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        flex: 1;
        min-width: 240px;
    }

    .max-card-list-titles {
        display: flex;
        flex-direction: column;
        gap: 0.125rem;
    }

    .max-card-list-title {
        font-size: 1.125rem;
        font-weight: 600;
        color: var(--background-900, #0f172a);
        margin: 0;
        line-height: 1.3;
    }

    .max-card-list-subtitle {
        font-size: 0.8125rem;
        color: var(--background-600, #64748b);
        margin: 0;
        line-height: 1.35;
    }

    .max-card-list-header-actions {
        display: flex;
        align-items: center;
        gap: 0.625rem;
        flex-wrap: wrap;
    }

    .max-card-list-category-wrapper {
        min-width: 150px;
    }

    .max-card-list-category-select {
        width: 100%;
        height: 32px;
        padding: 0 0.625rem;
        border-radius: 6px;
        border: 1px solid var(--background-200, #cbd5e1);
        background-color: var(--background-0, #fff);
        color: var(--background-900, #0f172a);
        font-size: 0.8125rem;
        cursor: pointer;
        transition: border-color 0.15s ease, box-shadow 0.15s ease;

        &:focus-visible {
            outline: var(--max-focus-outline, 2px solid var(--max-focus-ring-color, #00768e));
            outline-offset: 2px;
            border-color: var(--max-primary-500, #00768E);
            box-shadow: var(--max-focus-ring);
        }
    }

    .max-card-list-controls {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        width: 100%;
    }

    .max-card-list-status {
        width: 100%;
        min-height: 200px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .max-card-list-scroll {
        width: 100%;
        box-sizing: border-box;

        &::-webkit-scrollbar {
            width: 8px;
        }

        &::-webkit-scrollbar-thumb {
            background-color: var(--background-300, #cbd5e1);
            border-radius: 4px;
        }
    }

    .max-card-list-viewport {
        box-sizing: border-box;
    }

    .max-card-list-row {
        box-sizing: border-box;
        padding-bottom: 16px;
    }

    .max-card-list-grid {
        width: 100%;
        box-sizing: border-box;
    }

    .max-card-list-col {
        min-width: 0;
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        box-sizing: border-box;

        > * {
            height: 100%;
            width: 100%;
            flex: 1;
        }

        &--add {
            display: flex;
            flex-direction: column;
            height: 100%;

            > * {
                height: 100%;
                width: 100%;
                flex: 1;
            }
        }
    }

    .max-card-list-static-grid {
        width: 100%;
        box-sizing: border-box;
    }

    @media (prefers-reduced-motion: reduce) {
        .max-card-list-category-select {
            transition: none;
        }
    }
</style>
