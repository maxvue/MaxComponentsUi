<template>
    <div class="max-listbox" :class="{ 'is-disabled': props.disabled, 'two-lines': props.twoLines }" :style="rootStyle">
        <div v-if="$slots.header || props.title" class="max-listbox-header">
            <slot name="header">
                <span class="max-listbox-title">{{ props.title }}</span>
            </slot>
        </div>

        <div v-if="props.filter" class="max-listbox-filter">
            <input
                v-model="searchInput"
                type="text"
                class="max-listbox-filter-input"
                :placeholder="props.filterPlaceholder"
                :disabled="props.disabled"
                @input="onFilterInput"
            >
        </div>

        <div ref="listElem" class="max-listbox-list" @scroll="onListScroll">
            <div v-if="isVirtual" class="max-listbox-spacer" :style="{ height: `${totalHeight}px` }" aria-hidden="true" />

            <ul
                class="max-listbox-window"
                role="listbox"
                :aria-disabled="props.disabled"
                :style="isVirtual ? { transform: `translateY(${offsetY}px)` } : undefined"
            >
                <li
                    v-for="entry in (isVirtual ? visibleItems : plainItems)"
                    :key="optionKey(entry.item, entry.index)"
                    class="max-listbox-item"
                    :class="{ 'is-selected': isSelected(entry.item), 'is-disabled': isDisabled(entry.item) }"
                    role="option"
                    :aria-selected="isSelected(entry.item)"
                    :aria-disabled="isDisabled(entry.item)"
                    :style="isVirtual ? { height: `${props.itemHeight}px` } : undefined"
                    @click="selectOption(entry.item)"
                >
                    <slot name="option" :option="entry.item" :selected="isSelected(entry.item)" :index="entry.index">
                        <MaxIcon v-if="entry.item.icon" :icon="entry.item.icon" class="max-listbox-item-icon" />
                        <div class="max-listbox-item-labels">
                            <span class="max-listbox-item-label">{{ labelOf(entry.item) }}</span>
                            <span v-if="subLabelOf(entry.item)" class="max-listbox-item-sublabel">{{ subLabelOf(entry.item) }}</span>
                        </div>
                        <MaxBadgeComponent v-if="entry.item.badge !== undefined && entry.item.badge !== null" :label="String(entry.item.badge)" :color="entry.item.badgeColor" class="max-listbox-item-badge" />
                    </slot>
                </li>

                <li v-if="isLoading || (isApiMode && hasMore && visibleOptions.length > 0)" class="max-listbox-loader">
                    <slot name="loader">Carregando...</slot>
                </li>

                <li v-if="loadError" class="max-listbox-error">
                    <span>Erro ao carregar</span>
                    <button type="button" class="max-listbox-retry" @click="retry">Tentar novamente</button>
                </li>

                <li v-if="visibleOptions.length === 0 && !isInitialLoading && !loadError" class="max-listbox-empty">
                    <slot name="empty">{{ props.emptyMessage }}</slot>
                </li>
            </ul>
        </div>

        <div v-if="$slots.footer" class="max-listbox-footer">
            <slot name="footer" />
        </div>
    </div>
</template>

/**
 * Lista de seleção sempre visível, para painéis de navegação mestre-detalhe.
 * Suporta itens ricos (ícone, label, sublabel, badge), filtro, virtualização
 * automática e carregamento paginado por scroll infinito.
 */
<script setup lang="ts">
    import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
    import MaxIcon from './MaxIcon.vue';
    import MaxBadgeComponent from './MaxBadgeComponent.vue';
    import { useVirtualList } from '../composables/useVirtualList';
    import { LoadOptionsContext, LoadOptionsResult } from '../types';

    const props = withDefaults(
        defineProps<{
            /** Valor selecionado; null quando nada está selecionado */
            modelValue?: any;
            /** Objeto já resolvido pela app, exibido enquanto o item real não foi carregado */
            selectedOption?: any;
            /** Lista de opções local */
            options?: any[];
            /** Campo que contém o valor do item */
            optionValue?: string;
            /** Campo que contém o rótulo principal */
            optionLabel?: string;
            /** Campo que contém o rótulo secundário */
            optionSubLabel?: string;
            /** Campo que marca o item como não selecionável */
            optionDisabled?: string;
            /** Exibe o sublabel abaixo do label em vez de à direita */
            twoLines?: boolean;
            /** Mensagem exibida quando não há itens */
            emptyMessage?: string;
            /** Desabilita o painel inteiro */
            disabled?: boolean;
            /** Título exibido no cabeçalho */
            title?: string;
            /** Altura do painel (ex.: '400px'); padrão 100% do container */
            height?: string;
            /** Exibe o campo de busca */
            filter?: boolean;
            /** Placeholder do campo de busca */
            filterPlaceholder?: string;
            /** Campos usados no filtro local; padrão: optionLabel + optionSubLabel */
            filterFields?: string[];
            /** Força a virtualização; undefined = automático acima do threshold */
            virtualScroll?: boolean;
            /** Quantidade de itens a partir da qual a virtualização liga sozinha */
            virtualScrollThreshold?: number;
            /** Altura fixa de cada linha, em pixels (exigida pela virtualização) */
            itemHeight?: number;
            /** Carrega páginas do servidor; quando definido, `options` é ignorado */
            loadOptions?: (ctx: LoadOptionsContext) => Promise<LoadOptionsResult>;
            /** Itens por página enviados ao loadOptions */
            pageSize?: number;
            /** Loading controlado externamente pela app */
            loading?: boolean;
        }>(),
        {
            modelValue: null,
            selectedOption: undefined,
            options: undefined,
            optionValue: 'value',
            optionLabel: 'label',
            optionSubLabel: 'sub_label',
            optionDisabled: 'disabled',
            twoLines: false,
            emptyMessage: 'Nenhum registro encontrado',
            disabled: false,
            title: undefined,
            height: undefined,
            filter: false,
            filterPlaceholder: 'Buscar...',
            filterFields: undefined,
            virtualScroll: undefined,
            virtualScrollThreshold: 500,
            itemHeight: 44,
            loadOptions: undefined,
            pageSize: 50,
            loading: false
        }
    );

    const emit = defineEmits<{
        (e: 'update:modelValue', value: any): void;
        (e: 'change', payload: { value: any; option: any }): void;
        (e: 'filter', term: string): void;
        (e: 'load-error', error: unknown): void;
    }>();

    const listElem = ref<HTMLElement | null>(null);

    const rootStyle = computed(() => (props.height ? { height: props.height } : undefined));

    const searchInput = ref('');
    const searchTerm = ref('');
    let filterTimer: ReturnType<typeof setTimeout> | undefined;

    /** Remove acentos e normaliza a caixa para comparação de texto. */
    function normalize(value: any): string {
        return String(value ?? '')
            .normalize('NFD')
            .replace(/[̀-ͯ]/g, '')
            .toLowerCase();
    }

    function onFilterInput() {
        clearTimeout(filterTimer);
        filterTimer = setTimeout(() => {
            searchTerm.value = searchInput.value;
            emit('filter', searchInput.value);
        }, 300);
    }

    const filterFieldList = computed(() => props.filterFields ?? [props.optionLabel, props.optionSubLabel]);

    /** Verifica se uma opção casa com o termo de busca já normalizado. */
    function matchesTerm(option: any, term: string): boolean {
        if (term === '') return true;
        return filterFieldList.value.some((field) => normalize(option?.[field]).includes(term));
    }

    const isApiMode = computed(() => props.loadOptions !== undefined);

    const apiItems = ref<any[]>([]);
    const currentPage = ref(0);
    const hasMore = ref(true);
    const isLoadingPage = ref(false);
    const loadError = ref<unknown>(null);
    /** Página que estava sendo buscada quando o erro ocorreu. */
    const failedPage = ref(1);
    /** Sequência de requisição: respostas de buscas antigas são descartadas. */
    let requestId = 0;

    const isLoading = computed(() => props.loading || isLoadingPage.value);
    const isInitialLoading = computed(() => isLoadingPage.value && apiItems.value.length === 0);

    async function fetchPage(pageToLoad: number) {
        if (!props.loadOptions || isLoadingPage.value) return;

        const thisRequest = ++requestId;
        isLoadingPage.value = true;
        loadError.value = null;
        failedPage.value = pageToLoad;

        try {
            const result = await props.loadOptions({
                page: pageToLoad,
                search: searchTerm.value,
                pageSize: props.pageSize
            });

            // Uma busca mais recente já foi disparada: descarta esta resposta.
            if (thisRequest !== requestId) return;

            const items = result?.items ?? [];
            apiItems.value = pageToLoad === 1 ? items : [...apiItems.value, ...items];
            currentPage.value = pageToLoad;

            if (result?.hasMore !== undefined) hasMore.value = result.hasMore;
            else if (result?.total !== undefined) hasMore.value = apiItems.value.length < result.total;
            else hasMore.value = items.length > 0;
        } catch (error) {
            if (thisRequest !== requestId) return;

            loadError.value = error;
            hasMore.value = false;
            emit('load-error', error);
        } finally {
            if (thisRequest === requestId) isLoadingPage.value = false;
        }
    }

    /** Recomeça a busca do zero — usado na montagem e a cada mudança de filtro. */
    function resetAndFetch() {
        apiItems.value = [];
        currentPage.value = 0;
        hasMore.value = true;
        loadError.value = null;
        isLoadingPage.value = false;
        fetchPage(1);
    }

    function retry() {
        loadError.value = null;
        hasMore.value = true;
        fetchPage(failedPage.value);
    }

    onMounted(() => {
        if (isApiMode.value) resetAndFetch();
    });

    watch(searchTerm, () => {
        if (isApiMode.value) resetAndFetch();
    });

    const filteredOptions = computed<any[]>(() => {
        // No modo API o filtro é server-side: a lista já vem filtrada.
        if (isApiMode.value) return apiItems.value;

        const list = props.options ?? [];

        if (!props.filter) return list;

        const term = normalize(searchInput.value);
        return list.filter((option) => matchesTerm(option, term));
    });

    /** Lista efetivamente renderizada. Inclui o selectedOption externo no topo
     * quando o valor selecionado ainda não está presente na lista local — mas
     * apenas se ele também casar com o termo de busca ativo (o filtro tem
     * precedência sobre a fixação do selectedOption). */
    const visibleOptions = computed<any[]>(() => {
        const list = filteredOptions.value;

        if (props.selectedOption === undefined || props.selectedOption === null) return list;

        const alreadyInList = list.some((opt) => valueOf(opt) === valueOf(props.selectedOption));
        if (alreadyInList) return list;

        const term = props.filter ? normalize(searchInput.value) : '';
        if (!matchesTerm(props.selectedOption, term)) return list;

        return [props.selectedOption, ...list];
    });

    /** Altura assumida do viewport antes do primeiro scroll (e em ambiente sem layout). */
    const DEFAULT_VIEWPORT_HEIGHT = 400;

    const isVirtual = computed(() => {
        if (props.virtualScroll !== undefined) return props.virtualScroll;
        return visibleOptions.value.length > props.virtualScrollThreshold;
    });

    const { visibleItems, offsetY, totalHeight, setViewport } = useVirtualList(visibleOptions, {
        itemHeight: computed(() => props.itemHeight),
        enabled: isVirtual
    });

    /** Janela não virtualizada: todas as opções, no mesmo formato { item, index } da janela virtual. */
    const plainItems = computed(() => visibleOptions.value.map((item, index) => ({ item, index })));

    setViewport(0, DEFAULT_VIEWPORT_HEIGHT);

    function onListScroll(event: Event) {
        const target = event.target as HTMLElement;
        setViewport(target.scrollTop, target.clientHeight || DEFAULT_VIEWPORT_HEIGHT);
    }

    function valueOf(option: any): any {
        return option?.[props.optionValue];
    }

    function labelOf(option: any): string {
        return option?.[props.optionLabel] ?? '';
    }

    function subLabelOf(option: any): string {
        return option?.[props.optionSubLabel] ?? '';
    }

    function isDisabled(option: any): boolean {
        return option?.[props.optionDisabled] === true;
    }

    function isSelected(option: any): boolean {
        return props.modelValue !== null && props.modelValue !== undefined && valueOf(option) === props.modelValue;
    }

    function optionKey(option: any, index: number): string | number {
        const value = valueOf(option);
        return value !== undefined && value !== null ? value : index;
    }

    function selectOption(option: any) {
        if (props.disabled || isDisabled(option)) return;

        const value = valueOf(option);
        emit('update:modelValue', value);
        emit('change', { value, option });
    }

    onBeforeUnmount(() => clearTimeout(filterTimer));

    defineExpose({ listElem });
</script>

<style lang="scss">
.max-listbox {
    display: flex;
    flex-direction: column;
    min-height: 0;
}

.max-listbox-list {
    flex: 1;
    margin: 0;
    padding: 0;
    list-style: none;
    overflow-y: auto;
}

.max-listbox-item {
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
}
</style>
