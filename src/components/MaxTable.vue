<template>
    <div class="max-table-main-div" :style="tableStyle">
        <div class="p-datatable" :class="{ 'p-datatable-scrollable': props.scrollable }">
            <div class="p-datatable-table-container" :style="scrollContainerStyle">
                <table>
                    <!-- MODO A: TEMPLATE-DRIVEN (Cabeçalho ou Linhas manuais) -->
                    <template v-if="isTemplateDriven">
                        <thead v-if="slots.header">
                            <tr>
                                <slot name="header" />
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-if="props.loading" class="max-table-row-state max-table-loading-row">
                                <td class="p-datatable-cell state-cell">
                                    <slot name="loading">
                                        <div class="max-table-feedback-box">
                                            <div class="max-table-spinner" role="status" aria-label="Carregando"></div>
                                            <span>{{ props.loadingMessage }}</span>
                                        </div>
                                    </slot>
                                </td>
                            </tr>
                            <tr v-else-if="props.empty" class="max-table-row-state max-table-empty-row">
                                <td class="p-datatable-cell state-cell">
                                    <slot name="empty">
                                        <div class="max-table-feedback-box">
                                            <span>{{ props.emptyMessage }}</span>
                                        </div>
                                    </slot>
                                </td>
                            </tr>
                            <template v-else>
                                <slot />
                                <tr v-if="slots.buttons" class="p-column max-table-column-buttons" :style="`width: ${width}px; max-width: ${width}px;`">
                                    <td class="p-datatable-cell">
                                        <div class="max-table-buttons" ref="el">
                                            <slot name="buttons" v-bind="{ data: {}, index: 0 }" />
                                        </div>
                                    </td>
                                </tr>
                            </template>
                        </tbody>
                        <tfoot v-if="slots.footer">
                            <tr>
                                <slot name="footer" />
                            </tr>
                        </tfoot>
                    </template>

                    <!-- MODO B: DATA-DRIVEN (Colunas declarativas via Column / MaxTableColumn) -->
                    <template v-else>
                        <thead>
                            <tr class="max-table-header-row">
                                <th
                                    v-for="col in resolvedColumns"
                                    :key="col.field || col.header || 'col'"
                                    :class="[
                                        'max-table-th',
                                        col.class,
                                        col.headerClass,
                                        { 'max-table-th-sortable': col.sortable }
                                    ]"
                                    :style="getColumnStyle(col)"
                                    :tabindex="col.sortable ? 0 : undefined"
                                    :aria-sort="getAriaSort(col)"
                                    @click="onHeaderClick(col)"
                                    @keydown.enter="col.sortable && onHeaderClick(col)"
                                    @keydown.space.prevent="col.sortable && onHeaderClick(col)"
                                >
                                    <div class="p-datatable-column-header-content">
                                        <div class="p-datatable-column-title">
                                            <component v-if="col.headerSlot" :is="col.headerSlot" :column="col" />
                                            <template v-else>
                                                <span>{{ col.header }}</span>
                                            </template>
                                            <span v-if="col.sortable" class="sort-icon-box">
                                                <svg v-if="sortField === col.field && sortOrder === 1" class="sort-icon-svg" viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none">
                                                    <path d="m18 15-6-6-6 6" />
                                                </svg>
                                                <svg v-else-if="sortField === col.field && sortOrder === -1" class="sort-icon-svg" viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none">
                                                    <path d="m6 9 6 6 6-6" />
                                                </svg>
                                                <svg v-else class="sort-icon-svg sort-icon-neutral" viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none">
                                                    <path d="m7 15 5 5 5-5M7 9l5-5 5 5" />
                                                </svg>
                                            </span>
                                        </div>
                                    </div>
                                </th>
                                <th v-if="slots.buttons" class="max-table-th max-table-th-buttons p-column" :style="buttonsColumnStyle">
                                    <div class="p-datatable-column-header-content">
                                        <div class="p-datatable-column-title">
                                            <span>{{ props.headerButton ?? '' }}</span>
                                        </div>
                                    </div>
                                </th>
                            </tr>
                        </thead>

                        <tbody ref="tbodyRef">
                            <!-- 1. Loading (prioridade absoluta) -->
                            <tr v-if="props.loading" class="max-table-row-state max-table-loading-row">
                                <td :colspan="resolvedColumns.length + (slots.buttons ? 1 : 0)" class="p-datatable-cell state-cell">
                                    <slot name="loading">
                                        <div class="max-table-feedback-box">
                                            <div class="max-table-spinner" role="status" aria-label="Carregando"></div>
                                            <span>{{ props.loadingMessage }}</span>
                                        </div>
                                    </slot>
                                </td>
                            </tr>

                            <!-- 2. Linhas de dados se houver registros e não for empty explícito -->
                            <template v-else-if="!props.empty && displayData.length > 0">
                                <!-- Modo Virtual Scroll -->
                                <template v-if="props.virtualScroll">
                                    <tr
                                        v-if="paddingTop > 0"
                                        class="max-table-virtual-spacer"
                                        aria-hidden="true"
                                        :style="{ height: `${paddingTop}px`, minHeight: `${paddingTop}px`, flexShrink: 0 }"
                                    />
                                    <tr
                                        v-for="virtualRow in virtualRows"
                                        :key="getRowKey(displayData[virtualRow.index], virtualRow.index)"
                                        :ref="isDynamicHeight ? (el) => measureRow(el as Element) : undefined"
                                        :data-index="virtualRow.index"
                                        :class="[
                                            'max-table-row',
                                            'max-table-virtual-row',
                                            props.stripedRows !== false ? (virtualRow.index % 2 === 0 ? 'p-row-even max-table-row-even' : 'p-row-odd max-table-row-odd') : '',
                                            { 'max-table-row-selected': isRowSelected(displayData[virtualRow.index]) }
                                        ]"
                                        :style="virtualRowStyle"
                                        @click="handleRowClick(displayData[virtualRow.index], virtualRow.index, $event)"
                                    >
                                        <td
                                            v-for="col in resolvedColumns"
                                            :key="col.field || col.header || 'td'"
                                            :class="['max-table-td', 'p-datatable-cell', col.class]"
                                            :style="getColumnStyle(col)"
                                        >
                                            <component
                                                v-if="col.bodySlot"
                                                :is="col.bodySlot"
                                                :data="displayData[virtualRow.index]"
                                                :index="virtualRow.index"
                                                :field="col.field"
                                                :value="getFieldValue(displayData[virtualRow.index], col.field)"
                                            />
                                            <template v-else>
                                                {{ getFieldValue(displayData[virtualRow.index], col.field) }}
                                            </template>
                                        </td>

                                        <td v-if="slots.buttons" class="max-table-td max-table-td-buttons p-datatable-cell" :style="buttonsColumnStyle">
                                            <div class="max-table-buttons" ref="el">
                                                <slot name="buttons" :data="displayData[virtualRow.index]" :index="virtualRow.index" />
                                            </div>
                                        </td>
                                    </tr>
                                    <tr
                                        v-if="paddingBottom > 0"
                                        class="max-table-virtual-spacer"
                                        aria-hidden="true"
                                        :style="{ height: `${paddingBottom}px`, minHeight: `${paddingBottom}px`, flexShrink: 0 }"
                                    />
                                </template>

                                <!-- Modo Normal (sem virtual scroll) -->
                                <template v-else>
                                    <tr
                                        v-for="(row, index) in displayData"
                                        :key="getRowKey(row, index)"
                                        :class="[
                                            'max-table-row',
                                            props.stripedRows !== false ? (index % 2 === 0 ? 'p-row-even max-table-row-even' : 'p-row-odd max-table-row-odd') : '',
                                            { 'max-table-row-selected': isRowSelected(row) }
                                        ]"
                                        @click="handleRowClick(row, index, $event)"
                                    >
                                        <td
                                            v-for="col in resolvedColumns"
                                            :key="col.field || col.header || 'td'"
                                            :class="['max-table-td', 'p-datatable-cell', col.class]"
                                            :style="getColumnStyle(col)"
                                        >
                                            <component
                                                v-if="col.bodySlot"
                                                :is="col.bodySlot"
                                                :data="row"
                                                :index="index"
                                                :field="col.field"
                                                :value="getFieldValue(row, col.field)"
                                            />
                                            <template v-else>
                                                {{ getFieldValue(row, col.field) }}
                                            </template>
                                        </td>

                                        <td v-if="slots.buttons" class="max-table-td max-table-td-buttons p-datatable-cell" :style="buttonsColumnStyle">
                                            <div class="max-table-buttons" ref="el">
                                                <slot name="buttons" :data="row" :index="index" />
                                            </div>
                                        </td>
                                    </tr>
                                </template>
                            </template>

                            <!-- 3. Empty state quando empty===true ou displayData estiver vazio -->
                            <tr v-else class="max-table-row-state max-table-empty-row">
                                <td :colspan="resolvedColumns.length + (slots.buttons ? 1 : 0)" class="max-table-empty-cell p-datatable-cell state-cell">
                                    <slot name="empty">
                                        <div class="empty-state-box max-table-feedback-box">
                                            <span>{{ props.emptyMessage || 'Nenhum registro encontrado' }}</span>
                                        </div>
                                    </slot>
                                </td>
                            </tr>
                        </tbody>

                        <tfoot v-if="slots.footer">
                            <tr>
                                <slot name="footer" />
                            </tr>
                        </tfoot>
                    </template>
                </table>
            </div>

            <!-- PAGINADOR (DATA-DRIVEN) -->
            <div v-if="!isTemplateDriven && props.paginator" class="max-table-paginator">
                <div class="paginator-controls">
                    <button
                        type="button"
                        class="paginator-btn"
                        :disabled="currentPage === 0"
                        @click.stop="changePage(0)"
                        aria-label="Primeira página"
                    >
                        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none">
                            <path d="m11 17-5-5 5-5M18 17l-5-5 5-5" />
                        </svg>
                    </button>
                    <button
                        type="button"
                        class="paginator-btn"
                        :disabled="currentPage === 0"
                        @click.stop="changePage(currentPage - 1)"
                        aria-label="Página anterior"
                    >
                        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none">
                            <path d="m15 18-6-6 6-6" />
                        </svg>
                    </button>
                    <div class="paginator-info">
                        <span>Página {{ currentPage + 1 }} de {{ pageCount }}</span>
                    </div>
                    <button
                        type="button"
                        class="paginator-btn"
                        :disabled="currentPage >= pageCount - 1"
                        @click.stop="changePage(currentPage + 1)"
                        aria-label="Próxima página"
                    >
                        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none">
                            <path d="m9 18 6-6-6-6" />
                        </svg>
                    </button>
                    <button
                        type="button"
                        class="paginator-btn"
                        :disabled="currentPage >= pageCount - 1"
                        @click.stop="changePage(pageCount - 1)"
                        aria-label="Última página"
                    >
                        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none">
                            <path d="m13 17 5-5-5-5M6 17l5-5-5-5" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import {
        useSlots,
        useAttrs,
        computed,
        ref,
        watch,
        useTemplateRef,
        type VNode,
        Fragment,
        Comment
    } from 'vue';
    import { useVirtualizer } from '@tanstack/vue-virtual';
    import { useElementSize } from '@maxvue/max-use';
    import { getCssSize } from '../helpers/getCssSize';

    interface MaxTableProps {
        value?: any[];
        data?: any[];
        columns?: any[];
        stripedRows?: boolean;
        scrollable?: boolean;
        scrollHeight?: string;
        tableStyle?: string | Record<string, any>;
        paginator?: boolean;
        rows?: number;
        first?: number;
        totalRecords?: number;
        lazy?: boolean;
        selectionMode?: 'single' | 'multiple';
        selection?: any;
        dataKey?: string;
        loading?: boolean;
        empty?: boolean;
        responsiveLayout?: 'scroll' | 'stack';
        emptyMessage?: string;
        loadingMessage?: string;
        headerButton?: string;
        id?: string;
        sortField?: string;
        sortOrder?: number;
        virtualScroll?: boolean;
        itemHeight?: number;
        virtualScrollOptions?: {
            overscan?: number;
        };
    }

    interface ResolvedColumn {
        field?: string;
        header?: string;
        sortable?: boolean;
        class?: string;
        headerClass?: string;
        style?: any;
        width?: string | number;
        minWidth?: string | number;
        maxWidth?: string | number;
        align?: 'left' | 'center' | 'right';
        expander?: boolean;
        selectionMode?: 'single' | 'multiple';
        bodySlot?: any;
        headerSlot?: any;
    }

    defineOptions({
        name: 'MaxTable'
    });

    const props = withDefaults(defineProps<MaxTableProps>(), {
        stripedRows: true,
        scrollable: false,
        scrollHeight: '100%',
        paginator: false,
        rows: 10,
        first: 0,
        totalRecords: 0,
        lazy: false,
        dataKey: 'id',
        loading: false,
        empty: false,
        responsiveLayout: 'scroll',
        emptyMessage: 'Nenhum registro encontrado',
        loadingMessage: 'Carregando dados...',
        virtualScroll: false,
        itemHeight: undefined
    });

    const emit = defineEmits<{
        'update:first': [first: number];
        'update:rows': [rows: number];
        'update:selection': [selection: any];
        'update:modelValue': [value: any];
        'page': [event: { page: number; first: number; rows: number; pageCount: number }];
        'row-click': [event: { originalEvent: MouseEvent; data: any; index: number }];
        'sort': [event: { sortField: string; sortOrder: 1 | -1 | 0 }];
    }>();

    const attrs = useAttrs();
    const slots = useSlots() as Record<string, any>;

    /** Normaliza nós filhos de slots lidando com Fragments e Comentários */
    function flattenVNodes(vnodes: VNode[]): VNode[] {
        if (!Array.isArray(vnodes)) return [];
        const result: VNode[] = [];
        for (const vnode of vnodes) {
            if (!vnode || vnode.type === Comment) continue;
            if (typeof vnode.type === 'symbol' && vnode.type.toString().includes('v-cmt')) continue;
            if (vnode.type === Fragment && Array.isArray(vnode.children)) result.push(...flattenVNodes(vnode.children as VNode[]));
            else result.push(vnode);

        }
        return result;
    }

    /** Identifica se um nó VNode representa uma definição de coluna */
    function isColumnVNode(vnode: VNode): boolean {
        if (!vnode || typeof vnode.type === 'string' || vnode.type === Comment) return false;
        const type = vnode.type as any;
        const name = type?.name || type?.__name;
        if (name === 'MaxTableColumn' || name === 'Column' || name === 'BaseColumn' || name === 'MaxColumn') return true;
        if (vnode.props && ('field' in vnode.props || 'header' in vnode.props || 'expander' in vnode.props || 'selectionMode' in vnode.props)) return true;

        return false;
    }

    /** Extrai definições de colunas dos VNodes filhos declarados no default slot */
    function extractColumnsFromVNodes(vnodes: VNode[]): ResolvedColumn[] {
        if (!Array.isArray(vnodes)) return [];
        const columns: ResolvedColumn[] = [];
        const flattened = flattenVNodes(vnodes);

        for (const vnode of flattened) {
            if (!isColumnVNode(vnode)) continue;
            const colProps = (vnode.props || {}) as Record<string, any>;
            const children = vnode.children as any;

            let bodySlot: any = null;
            let headerSlot: any = null;
            if (children && typeof children === 'object') {
                if (typeof children.body === 'function') bodySlot = children.body;
                else if (typeof children.default === 'function') bodySlot = children.default;

                if (typeof children.header === 'function') headerSlot = children.header;

            }

            columns.push({
                field: colProps.field,
                header: colProps.header,
                sortable: colProps.sortable !== undefined && colProps.sortable !== false,
                class: colProps.class,
                headerClass: colProps.headerClass || colProps['header-class'],
                style: colProps.style,
                width: colProps.width,
                minWidth: colProps.minWidth || colProps['min-width'],
                maxWidth: colProps.maxWidth || colProps['max-width'],
                align: colProps.align,
                expander: colProps.expander !== undefined && colProps.expander !== false,
                selectionMode: colProps.selectionMode || colProps['selection-mode'],
                bodySlot,
                headerSlot
            });
        }
        return columns;
    }

    /** Colunas resolvidas a partir de props ou do default slot */
    const resolvedColumns = computed<ResolvedColumn[]>(() => {
        if (Array.isArray(props.columns) && props.columns.length > 0) return props.columns.map((col) => ({
            ...col,
            sortable: col.sortable !== undefined && col.sortable !== false,
            bodySlot: (slots as any)[col.slot ?? col.field ?? '']
        }));

        if (!slots.default) return [];
        return extractColumnsFromVNodes(slots.default());
    });

    /** Detecta se o componente está operando em Modo Template-Driven */
    const isTemplateDriven = computed<boolean>(() => {
        if (slots.header) return true;
        const hasColumnsProp = Array.isArray(props.columns) && props.columns.length > 0;
        if (resolvedColumns.value.length === 0 && !hasColumnsProp) return true;
        return false;
    });

    /** Dados brutos fornecidos via value ou data (com fallback a attrs.value) */
    const rawData = computed<any[]>(() => {
        const list = props.value ?? props.data ?? (attrs.value as any[]) ?? [];
        if (Array.isArray(list)) return list;
        if (typeof list === 'object' && list !== null) return Object.entries(list).map(([key, val]) => {
            const item = val as any;
            if (typeof val === 'object' && val !== null && !item.id && !item.uuid && !item.ulid) return { ...val, _recordKey: key };

            return val;
        });

        return [];
    });

    /** Acessa o valor de um campo por notação com ponto */
    function getFieldValue(row: any, field: string | null | undefined): any {
        if (!field) return '';
        return field.split('.').reduce((obj, key) => obj?.[key], row);
    }

    /** Estilo do scroll container */
    const scrollContainerStyle = computed(() => {
        if (!props.scrollable) return {};
        return {
            maxHeight: props.scrollHeight,
            overflow: 'auto'
        };
    });

    /** Ordenação */
    const sortField = ref<string | null>(props.sortField ?? null);
    const sortOrder = ref<number>(props.sortOrder ?? 1);
    watch(() => props.sortField, (v) => { sortField.value = v ?? null; });
    watch(() => props.sortOrder, (v) => { sortOrder.value = v ?? 1; });

    function onHeaderClick(col: ResolvedColumn) {
        if (!col.sortable || !col.field) return;

        if (sortField.value === col.field) if (sortOrder.value === 1) sortOrder.value = -1;
        else {
            sortField.value = null;
            sortOrder.value = 1;
        }
        else {
            sortField.value = col.field;
            sortOrder.value = 1;
        }

        emit('sort', {
            sortField: sortField.value || '',
            sortOrder: (sortField.value ? sortOrder.value : 0) as 1 | -1 | 0
        });
    }

    const getAriaSort = (col: ResolvedColumn): 'ascending' | 'descending' | 'none' | undefined => {
        if (!col.sortable) return undefined;
        if (sortField.value === col.field) {
            if (sortOrder.value === 1) return 'ascending';
            if (sortOrder.value === -1) return 'descending';
        }
        return 'none';
    };

    /** Dados ordenados */
    const sortedData = computed<any[]>(() => {
        const list = Array.isArray(rawData.value) ? [...rawData.value] : [];
        if (props.lazy || !sortField.value) return list;

        const field = sortField.value;
        const order = sortOrder.value;

        return list.sort((a, b) => {
            const valA = getFieldValue(a, field);
            const valB = getFieldValue(b, field);

            if (valA === valB) return 0;
            if (valA === null || valA === undefined) return 1;
            if (valB === null || valB === undefined) return -1;

            if (typeof valA === 'number' && typeof valB === 'number') return (valA - valB) * order;

            if (typeof valA === 'string' && typeof valB === 'string') return valA.localeCompare(valB, undefined, { numeric: true }) * order;

            return (valA > valB ? 1 : -1) * order;
        });
    });

    /** Paginação */
    const first = ref<number>(props.first ?? 0);
    const rows = ref<number>(props.rows ?? 10);
    watch(() => props.first, (v) => { if (v !== undefined) first.value = v; });
    watch(() => props.rows, (v) => { if (v !== undefined) rows.value = v; });

    const total = computed(() => props.lazy ? (props.totalRecords ?? 0) : sortedData.value.length);
    const pageCount = computed(() => Math.max(1, Math.ceil(total.value / (rows.value || 10))));
    const currentPage = computed(() => Math.floor(first.value / (rows.value || 10)));

    function changePage(targetPage: number) {
        if (targetPage < 0 || targetPage >= pageCount.value) return;
        const newFirst = targetPage * rows.value;
        first.value = newFirst;
        emit('update:first', newFirst);
        emit('page', {
            page: targetPage,
            first: newFirst,
            rows: rows.value,
            pageCount: pageCount.value
        });
    }

    /** Dados finais a exibir (fatiados se paginator client-side) */
    const displayData = computed<any[]>(() => {
        if (props.paginator && !props.lazy) return sortedData.value.slice(first.value, first.value + rows.value);

        return sortedData.value;
    });

    /** Chave identificadora de linha */
    function getRowKey(row: any, index: number): string | number {
        if (props.dataKey && row?.[props.dataKey] !== undefined) return row[props.dataKey];
        return row?.id ?? row?.uuid ?? row?.ulid ?? row?._recordKey ?? index;
    }

    /** Estilo de coluna */
    function getColumnStyle(col: ResolvedColumn): Record<string, any> {
        const style: Record<string, any> = {};
        if (col.style && typeof col.style === 'object') Object.assign(style, col.style);

        if (col.width) {
            style.width = getCssSize(col.width);
            style.maxWidth = getCssSize(col.width);
        }
        if (col.minWidth) style.minWidth = getCssSize(col.minWidth);
        if (col.maxWidth) style.maxWidth = getCssSize(col.maxWidth);
        if (col.align) style.textAlign = col.align;
        return style;
    }

    /** Medição da coluna de botões via useElementSize */
    const el = useTemplateRef('el');
    const width = ref(1);
    const { width: calculatedWidth } = useElementSize(el as any);

    watch(calculatedWidth, () => {
        if (calculatedWidth.value === 0) return;
        if (width.value > 1) return;
        else if (width.value === 1 && calculatedWidth.value > 0) width.value = calculatedWidth.value + 10;
    }, { immediate: true });

    const buttonsColumnStyle = computed(() => {
        if (width.value > 1) return {
            width: `${width.value}px`,
            maxWidth: `${width.value}px`
        };

        return {};
    });

    /** Verificação de seleção */
    function isRowSelected(row: any): boolean {
        if (!props.selection) return false;
        if (props.selectionMode === 'single') {
            if (props.dataKey && row?.[props.dataKey] !== undefined) return props.selection?.[props.dataKey] === row[props.dataKey];

            return props.selection === row || props.selection?.id === row?.id;
        }
        if (props.selectionMode === 'multiple' && Array.isArray(props.selection)) return props.selection.some((item: any) => {
            if (props.dataKey && row?.[props.dataKey] !== undefined) return item?.[props.dataKey] === row[props.dataKey];

            return item === row || item?.id === row?.id;
        });

        return false;
    }

    function handleRowClick(row: any, index: number, event: MouseEvent) {
        emit('row-click', {
            originalEvent: event,
            data: row,
            index
        });
        if (props.selectionMode === 'single') emit('update:selection', row);

    }

    /** Referência do elemento tbody para controle de scroll do virtualizador */
    const tbodyRef = ref<HTMLElement | null>(null);

    /** Indica se o virtualizador deve operar com mensuração dinâmica de altura */
    const isDynamicHeight = computed<boolean>(() => Boolean(props.virtualScroll && !props.itemHeight));

    /** Instância do virtualizador de linhas */
    const rowVirtualizer = useVirtualizer(
        computed(() => ({
            count: props.virtualScroll ? displayData.value.length : 0,
            getScrollElement: () => tbodyRef.value,
            estimateSize: () => props.itemHeight ?? 40,
            overscan: props.virtualScrollOptions?.overscan ?? 5,
            enabled: props.virtualScroll,
            measureElement: (element: HTMLElement) => {
                const height = Math.round(element.getBoundingClientRect().height);
                return height > 0 ? height : (props.itemHeight ?? 40);
            }
        }))
    );

    const virtualRows = computed(() => {
        if (!props.virtualScroll) return [];
        return rowVirtualizer.value.getVirtualItems();
    });

    const totalVirtualHeight = computed<number>(() => {
        if (!props.virtualScroll) return 0;
        return rowVirtualizer.value.getTotalSize();
    });

    const paddingTop = computed<number>(() => {
        if (!props.virtualScroll || virtualRows.value.length === 0) return 0;
        return virtualRows.value[0].start;
    });

    const paddingBottom = computed<number>(() => {
        if (!props.virtualScroll || virtualRows.value.length === 0) return 0;
        return totalVirtualHeight.value - virtualRows.value[virtualRows.value.length - 1].end;
    });

    const virtualRowStyle = computed(() => {
        if (props.itemHeight) return {
            height: `${props.itemHeight}px`,
            minHeight: `${props.itemHeight}px`,
            flexShrink: 0
        };

        return { flexShrink: 0 };
    });

    function measureRow(el: Element | null) {
        if (isDynamicHeight.value && el) rowVirtualizer.value.measureElement(el as HTMLElement);

    }

    function scrollToIndex(index: number, options?: { align?: 'start' | 'center' | 'end' | 'auto'; behavior?: 'auto' | 'smooth' }) {
        rowVirtualizer.value.scrollToIndex(index, options);
    }

    function scrollToOffset(offset: number, options?: { align?: 'start' | 'center' | 'end' | 'auto'; behavior?: 'auto' | 'smooth' }) {
        rowVirtualizer.value.scrollToOffset(offset, options);
    }

    defineExpose({
        width,
        first,
        rows,
        pageCount,
        currentPage,
        displayData,
        rowVirtualizer,
        virtualRows,
        totalVirtualHeight,
        scrollToIndex,
        scrollToOffset
    });
</script>

<style lang="scss" scoped>
.max-table-main-div {
    border-radius: 1rem;
    overflow: hidden !important;
    max-height: 100%;
    width: 100%;
    height: 100%;
    border: 1px solid var(--background-300) !important;
    position: relative;

    :deep(.p-datatable) {
        height: 100%;
        display: flex;
        flex-direction: column;

        .p-datatable-table-container {
            height: 100%;
            background-color: transparent;
            display: grid;
            padding: 0;
            overflow: auto;

            table {
                padding: 0 !important;
                display: grid !important;
                grid-template-rows: 40px 1fr;
                height: 100% !important;
                width: 100% !important;

                thead {
                    height: 100% !important;
                    width: 100% !important;
                    z-index: 1 !important;
                    font-family: Jost, sans-serif;
                    display: grid;
                    background-color: transparent !important;

                    tr {
                        position: sticky !important;
                        height: 40px !important;
                        min-width: 100% !important;
                        display: flex;
                        padding: 0 6px !important;
                        gap: 6px;
                        background-color: var(--table-header-bg, var(--blue-800)) !important;

                        th {
                            padding: 0;
                            background-color: transparent !important;
                            color: var(--table-header-text, var(--blue-200)) !important;
                            position: relative;
                            font-weight: 400 !important;
                            flex-grow: 1;
                            border: none !important;
                            height: 100%;

                            &.max-table-th-sortable {
                                cursor: pointer;
                                user-select: none;
                                outline: none;

                                &:focus:not(:focus-visible) {
                                    outline: none;
                                }

                                &:focus-visible {
                                    outline: var(--max-focus-outline);
                                    outline-offset: -2px;
                                }
                            }

                            .p-datatable-column-header-content {
                                position: relative;
                                display: grid;
                                grid-template-columns: 1fr !important;
                                height: 100%;
                                place-items: center;
                                width: 100%;

                                .p-datatable-column-title {
                                    width: 100%;
                                    height: 100%;
                                    text-align: center;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    gap: 4px;

                                    .sort-icon-box {
                                        display: inline-flex;
                                        align-items: center;

                                        .sort-icon-neutral {
                                            opacity: 0.4;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                tbody {
                    width: 100% !important;
                    z-index: 1 !important;
                    font-family: Jost, sans-serif;
                    display: flex !important;
                    flex-direction: column;
                    overflow-y: auto;

                    tr {
                        width: 100% !important;
                        display: flex;
                        height: auto !important;
                        gap: 0 6px;
                        padding: 3px 6px !important;

                        &.max-table-virtual-spacer {
                            padding: 0 !important;
                            margin: 0 !important;
                            border: none !important;
                            pointer-events: none;
                            background: transparent !important;
                            min-height: 0 !important;
                        }

                        &:first-of-type {
                            padding-top: 6px !important;
                        }

                        &:last-of-type {
                            padding-bottom: 6px !important;
                        }

                        &.p-row-even,
                        &.max-table-row-even {
                            background-color: var(--primary-25) !important;
                        }

                        &.p-row-odd,
                        &.max-table-row-odd {
                            background-color: var(--primary-100) !important;
                        }

                        &.max-table-row-selected {
                            background-color: var(--primary-200) !important;
                        }

                        &.max-table-row-state {
                            .state-cell {
                                width: 100%;
                                padding: 24px 0 !important;
                                display: flex;
                                justify-content: center;
                                align-items: center;

                                .max-table-feedback-box {
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    gap: 12px;
                                    color: var(--background-650);
                                    font-size: 0.95rem;
                                    font-weight: 500;

                                    .max-table-spinner {
                                        width: 20px;
                                        height: 20px;
                                        border: 2px solid var(--background-300);
                                        border-top-color: var(--max-primary-500);
                                        border-radius: 50%;
                                        animation: max-table-spin 0.8s linear infinite;
                                    }
                                }
                            }
                        }

                        &.max-table-empty-row {
                            .max-table-empty-cell {
                                width: 100%;
                                padding: 24px 0 !important;
                                display: flex;
                                justify-content: center;
                                align-items: center;

                                .empty-state-box {
                                    color: var(--background-650);
                                    font-style: italic;
                                    text-align: center;
                                }
                            }
                        }

                        td {
                            flex-grow: 1;
                            padding: 0 !important;
                            display: grid;
                            place-items: center;
                            border: none !important;
                            border-radius: 0 !important;

                            .max-input-main-div {
                                grid-template-rows: 1fr !important;

                                .message-spacer,
                                .input-message {
                                    display: none !important;
                                }
                            }
                        }

                        .max-table-buttons {
                            display: flex;
                            flex-direction: row;
                            gap: 8px;
                            width: auto;
                            padding: 0 6px;
                        }
                    }
                }
            }
        }

        .max-table-paginator {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 8px 12px;
            background-color: var(--background-50);
            border-top: 1px solid var(--background-200);

            .paginator-controls {
                display: flex;
                align-items: center;
                gap: 8px;

                .paginator-btn {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    width: 28px;
                    height: 28px;
                    padding: 0;
                    border: 1px solid var(--background-300);
                    border-radius: 6px;
                    background-color: var(--background-0);
                    color: var(--background-800);
                    cursor: pointer;
                    transition: background-color 0.2s, border-color 0.2s;

                    &:disabled {
                        opacity: 0.4;
                        cursor: not-allowed;
                    }

                    &:not(:disabled):hover {
                        background-color: var(--background-100);
                        border-color: var(--background-400);
                    }
                }

                .paginator-info {
                    font-size: 0.85rem;
                    color: var(--background-700);
                    padding: 0 8px;
                }
            }
        }
    }
}

@keyframes max-table-spin {
    from {
        transform: rotate(0deg);
    }

    to {
        transform: rotate(360deg);
    }
}
</style>
