<template>
    <div
        ref="containerRef"
        class="max-card-list"
        :class="{
            'is-loading': props.loading,
            'is-empty': !props.loading && displayItems.length === 0,
            'is-virtual': isVirtualActive
        }"
    >
        <!-- Cabeçalho (Header, Títulos, MaxStats e Ações) -->
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

            <!-- Ações e Add Card no cabeçalho quando posicionado como header -->
            <div
                v-if="$slots.actions || ($slots['add-card'] && props.addCardPosition === 'header')"
                class="max-card-list-header-actions"
            >
                <div v-if="$slots['add-card'] && props.addCardPosition === 'header'" class="max-card-list-header-add">
                    <slot name="add-card" />
                </div>
                <slot name="actions" />
            </div>
        </header>

        <!-- Barra de Controles e Filtros -->
        <div v-if="props.filterable !== false && hasControls" class="max-card-list-controls">
            <slot
                name="filters"
                :search="internalSearch"
                :category="internalCategory"
                :categories="normalizedCategories"
                :set-search="setSearch"
                :set-category="setCategory"
            >
                <div class="max-card-list-filters">
                    <!-- Campo de Busca -->
                    <div v-if="showSearch" class="max-card-list-search-wrapper">
                        <MaxInputSearch
                            :model-value="internalSearch"
                            :placeholder="props.searchPlaceholder || 'Pesquisar cards...'"
                            class="max-card-list-search"
                            @update:model-value="onSearchInput"
                            @search="onSearchSubmit"
                        />
                    </div>

                    <!-- Seletor de Categoria -->
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
                </div>
            </slot>
        </div>

        <!-- Slot de Adição isolado para não desalinhar índices de virtualização -->
        <div
            v-if="$slots['add-card'] && props.addCardPosition !== 'header'"
            class="max-card-list-add-section"
        >
            <div class="max-card-list-add-item" :style="addItemStyle">
                <slot name="add-card" />
            </div>
        </div>

        <!-- Estado de Carregamento Pré-estilizado com MaxLoader -->
        <div v-if="props.loading" class="max-card-list-status max-card-list-loading" role="status" aria-live="polite">
            <slot name="loading">
                <MaxLoader :label="props.loadingLabel || 'Carregando cards...'" />
            </slot>
        </div>

        <!-- Estado Vazio Pré-estilizado com MaxEmptyDiv -->
        <div
            v-else-if="displayItems.length === 0"
            class="max-card-list-status max-card-list-empty"
            role="region"
            aria-live="polite"
        >
            <slot name="empty" :search="internalSearch" :category="internalCategory">
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
                            v-for="(item, colIdx) in rows[virtualRow.index]"
                            :key="getItemKey(item, virtualRow.index * effectiveColumns + colIdx)"
                            class="max-card-list-col"
                        >
                            <slot
                                name="card"
                                :item="item"
                                :index="virtualRow.index * effectiveColumns + colIdx"
                            >
                                <slot
                                    name="item"
                                    :item="item"
                                    :index="virtualRow.index * effectiveColumns + colIdx"
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
            </div>
        </div>

        <!-- Grid Estático (fallback quando virtualScroll === false) -->
        <div
            v-else
            class="max-card-list-static-grid"
            :style="gridLayoutStyle"
        >
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
        useSlots,
        type CSSProperties
    } from 'vue';
    import { useVirtualizer } from '@tanstack/vue-virtual';
    import { useElementSize } from '@maxvue/max-use';
    import MaxCard from './MaxCard.vue';
    import MaxStats from './MaxStats.vue';
    import MaxLoader from './MaxLoader.vue';
    import MaxEmptyDiv from './MaxEmptyDiv.vue';
    import MaxInputSearch from './MaxInputSearch.vue';
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

    // Estado interno reativo de busca e categoria
    const internalSearch = ref<string>(props.searchQuery ?? '');
    const internalCategory = ref<any>(props.category ?? '');

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

    // Normalização das categorias
    const normalizedCategories = computed<MaxCardListCategoryOption[]>(() => {
        if (!props.categories || !props.categories.length) return [];
        return props.categories.map((cat) => {
            if (typeof cat === 'string') return { label: cat, value: cat };

            return cat;
        });
    });

    const hasCategories = computed(() => normalizedCategories.value.length > 0);
    const showSearch = computed(() => props.filterable !== false);
    const hasControls = computed(() => showSearch.value || hasCategories.value || Boolean(slots.filters));
    const hasHeaderContent = computed(() => Boolean(props.title || props.subtitle || (props.stats && props.stats.length > 0)));
    const hasHeader = computed(() => Boolean(slots.header || hasHeaderContent.value || slots.actions || (slots['add-card'] && props.addCardPosition === 'header')));


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

        const searchTrimmed = internalSearch.value?.trim().toLowerCase() ?? '';
        const currentCat = internalCategory.value;

        return rawItems.filter((item) => {
            if (!item) return false;

            if (props.filterFn) return props.filterFn(item, internalSearch.value, internalCategory.value);


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

    // Agrupamento em linhas para virtualização de grid responsivo
    const rows = computed<any[][]>(() => {
        const list = displayItems.value;
        const cols = effectiveColumns.value;
        if (!list || list.length === 0) return [];

        const result: any[][] = [];
        for (let i = 0; i < list.length; i += cols) result.push(list.slice(i, i + cols));

        return result;
    });

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

    const addItemStyle = computed<CSSProperties>(() => {
        const minW = props.minCardWidth ?? 320;
        return {
            maxWidth: `${minW}px`,
            width: '100%'
        };
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
    function onSearchInput(val: string) {
        internalSearch.value = val;
        emit('update:searchQuery', val);
        emit('update:search', val);
        emit('search', val);
        emit('update:filter', {
            search: val,
            category: internalCategory.value
        });
    }

    function onSearchSubmit(val: string) {
        emit('search', val);
    }

    function onCategoryChange(event: Event) {
        const target = event.target as HTMLSelectElement;
        const val = target.value;
        internalCategory.value = val;
        emit('update:category', val);
        emit('update:filter', {
            search: internalSearch.value,
            category: val
        });
    }

    function setSearch(query: string) {
        onSearchInput(query);
    }

    function setCategory(cat: any) {
        internalCategory.value = cat;
        emit('update:category', cat);
        emit('update:filter', {
            search: internalSearch.value,
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
        gap: 1rem;
    }

    .max-card-list-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 1rem;
        padding-bottom: 0.5rem;
    }

    .max-card-list-header-main {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        flex: 1;
        min-width: 250px;
    }

    .max-card-list-titles {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }

    .max-card-list-title {
        font-size: 1.25rem;
        font-weight: 700;
        color: var(--text-color, #1e293b);
        margin: 0;
        line-height: 1.3;
    }

    .max-card-list-subtitle {
        font-size: 0.875rem;
        color: var(--background-500, #64748b);
        margin: 0;
    }

    .max-card-list-header-actions {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        flex-wrap: wrap;
    }

    .max-card-list-controls {
        display: flex;
        align-items: center;
        gap: 1rem;
        width: 100%;
    }

    .max-card-list-filters {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 0.75rem;
        width: 100%;
    }

    .max-card-list-search-wrapper {
        flex: 1;
        min-width: 220px;
    }

    .max-card-list-category-wrapper {
        min-width: 180px;
    }

    .max-card-list-category-select {
        width: 100%;
        height: 38px;
        padding: 0 0.75rem;
        border-radius: 0.5rem;
        border: 1px solid var(--background-200, #cbd5e1);
        background-color: var(--background-50, #f8fafc);
        color: var(--text-color, #0f172a);
        font-size: 0.875rem;
        outline: none;
        cursor: pointer;
        transition: border-color 0.2s ease, box-shadow 0.2s ease;

        &:focus {
            border-color: var(--max-primary-500, #3b82f6);
            box-shadow: 0 0 0 2px var(--max-primary-100, rgb(59 130 246 / 20%));
        }
    }

    .max-card-list-add-section {
        display: flex;
        width: 100%;
        margin-bottom: 0.25rem;
    }

    .max-card-list-add-item {
        display: flex;
        flex-direction: column;
    }

    .max-card-list-status {
        width: 100%;
        min-height: 240px;
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
        box-sizing: border-box;
    }

    .max-card-list-static-grid {
        width: 100%;
        box-sizing: border-box;
    }
</style>
