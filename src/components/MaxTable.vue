<template>
    <div class="max-table-main-div" :style="tableStyle">
        <div class="max-table p-datatable" :class="{ 'max-table-scrollable': props.scrollable, 'p-datatable-scrollable': props.scrollable }">
            <div class="max-table-container max-table-table-container p-datatable-table-container" :style="scrollContainerStyle">
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
                                <td class="max-table-td max-table-cell p-datatable-cell state-cell">
                                    <slot name="loading">
                                        <div class="max-table-feedback-box">
                                            <div class="max-table-spinner" role="status" aria-label="Carregando"></div>
                                            <span>{{ props.loadingMessage }}</span>
                                        </div>
                                    </slot>
                                </td>
                            </tr>
                            <tr v-else-if="props.empty" class="max-table-row-state max-table-empty-row">
                                <td class="max-table-td max-table-cell p-datatable-cell state-cell">
                                    <slot name="empty">
                                        <div class="max-table-feedback-box">
                                            <span>{{ props.emptyMessage }}</span>
                                        </div>
                                    </slot>
                                </td>
                            </tr>
                            <template v-else>
                                <slot />
                                <tr v-if="slots.buttons" class="max-table-th max-table-column-buttons max-table-column p-column" :style="`width: ${width}px; max-width: ${width}px;`">
                                    <td class="max-table-td max-table-cell p-datatable-cell">
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
                                        'max-table-header-cell',
                                        col.class,
                                        col.headerClass,
                                        {
                                            'max-table-th-sortable': col.sortable,
                                            'max-table-header-cell-sortable': col.sortable
                                        }
                                    ]"
                                    :style="getColumnStyle(col)"
                                    :aria-sort="getAriaSort(col)"
                                    :aria-label="getHeaderAriaLabel(col)"
                                    @click="onThClick(col, $event)"
                                    @keydown.enter.prevent.stop="onThKeydown(col, $event)"
                                    @keydown.space.prevent.stop="onThKeydown(col, $event)"
                                    scope="col"
                                >
                                    <button
                                        v-if="col.sortable"
                                        type="button"
                                        class="max-table-header-button"
                                        @click.stop="onHeaderClick(col, $event)"
                                        @keydown.enter.prevent.stop="onHeaderKeydown(col, $event)"
                                        @keydown.space.prevent.stop="onHeaderKeydown(col, $event)"
                                        :aria-label="getSortButtonAriaLabel(col)"
                                    >
                                        <div class="max-table-column-header-content p-datatable-column-header-content">
                                            <div class="max-table-column-title p-datatable-column-title">
                                                <component v-if="col.headerSlot" :is="col.headerSlot" :column="col" />
                                                <template v-else>
                                                    <span>{{ col.header }}</span>
                                                </template>
                                                <span class="sort-icon-box" aria-hidden="true">
                                                    <svg v-if="sortField === col.field && sortOrder === 1" class="sort-icon-svg" viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" aria-hidden="true">
                                                        <path d="m18 15-6-6-6 6" />
                                                    </svg>
                                                    <svg v-else-if="sortField === col.field && sortOrder === -1" class="sort-icon-svg" viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" aria-hidden="true">
                                                        <path d="m6 9 6 6 6-6" />
                                                    </svg>
                                                    <svg v-else class="sort-icon-svg sort-icon-neutral" viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" aria-hidden="true">
                                                        <path d="m7 15 5 5 5-5M7 9l5-5 5 5" />
                                                    </svg>
                                                </span>
                                            </div>
                                        </div>
                                    </button>
                                    <div v-else class="max-table-column-header-content p-datatable-column-header-content">
                                        <div class="max-table-column-title p-datatable-column-title">
                                            <component v-if="col.headerSlot" :is="col.headerSlot" :column="col" />
                                            <template v-else>
                                                <span>{{ col.header }}</span>
                                            </template>
                                        </div>
                                    </div>
                                    <button
                                        v-if="props.filterDisplay === 'menu' && (col.filter || col.filterSlot)"
                                        type="button"
                                        class="max-table-filter-menu-button"
                                        :class="{ 'is-filtered': hasFilterValue(col.field) }"
                                        @click.stop="toggleFilterMenu(col, $event)"
                                        :aria-label="'Filtrar ' + getHeaderAriaLabel(col)"
                                        aria-haspopup="dialog"
                                        :aria-expanded="activeMenuCol === col.field"
                                    >
                                        <svg class="filter-icon-svg" viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" stroke-width="2" fill="none" aria-hidden="true">
                                            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                                        </svg>
                                    </button>
                                </th>
                                <th
                                    v-if="slots.buttons"
                                    class="max-table-th max-table-th-buttons max-table-column p-column"
                                    :style="buttonsColumnStyle"
                                    scope="col"
                                    :aria-label="props.headerButton?.trim() || 'Ações'"
                                >
                                    <div class="max-table-column-header-content p-datatable-column-header-content">
                                        <div class="max-table-column-title p-datatable-column-title">
                                            <span>{{ props.headerButton ?? '' }}</span>
                                        </div>
                                    </div>
                                </th>
                            </tr>

                            <!-- LINHA DE FILTROS DE COLUNA (MODO ROW) -->
                            <tr v-if="props.filterDisplay !== 'menu' && hasRowFilters" class="max-table-filter-row">
                                <th
                                    v-for="col in resolvedColumns"
                                    :key="'filter-' + (col.field || col.header || 'col')"
                                    class="max-table-th max-table-filter-cell"
                                    :style="getColumnStyle(col)"
                                    scope="col"
                                    :aria-label="'Filtro de ' + getHeaderAriaLabel(col)"
                                >
                                    <template v-if="col.filterSlot">
                                        <component
                                            :is="col.filterSlot"
                                            :field="col.field"
                                            :filterModel="getFilterModel(col.field)"
                                            :filterCallback="(val: any) => onFilterInputChange(col.field, val)"
                                        />
                                    </template>
                                    <template v-else-if="col.filter && col.field">
                                        <div class="max-table-filter-input-wrapper">
                                            <input
                                                type="text"
                                                class="max-table-filter-input"
                                                :value="getFilterInputValue(col.field)"
                                                @input="onFilterInput(col.field, $event)"
                                                :placeholder="col.filterPlaceholder || props.filterPlaceholder"
                                                :aria-label="'Filtrar por ' + getHeaderAriaLabel(col)"
                                            />
                                            <button
                                                v-if="col.showClearButton !== false && hasFilterValue(col.field)"
                                                type="button"
                                                class="max-table-filter-clear-button"
                                                @click.stop="clearColumnFilter(col.field)"
                                                :aria-label="'Limpar filtro de ' + getHeaderAriaLabel(col)"
                                            >
                                                <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="2" fill="none" aria-hidden="true">
                                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                                </svg>
                                            </button>
                                        </div>
                                    </template>
                                </th>
                                <th
                                    v-if="slots.buttons"
                                    class="max-table-th max-table-filter-cell max-table-filter-buttons-cell"
                                    :style="buttonsColumnStyle"
                                    scope="col"
                                    aria-label="Ações"
                                ></th>
                            </tr>
                        </thead>

                        <tbody ref="tbodyRef">
                            <!-- 1. Loading (prioridade absoluta) -->
                            <tr v-if="props.loading" class="max-table-row-state max-table-loading-row">
                                <td :colspan="resolvedColumns.length + (slots.buttons ? 1 : 0)" class="max-table-td max-table-cell p-datatable-cell state-cell">
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
                                            props.stripedRows !== false ? (virtualRow.index % 2 === 0 ? 'max-table-row-even p-row-even' : 'max-table-row-odd p-row-odd') : '',
                                            {
                                                'max-table-row-selected': isRowSelected(displayData[virtualRow.index]),
                                                'max-table-row-interactive': isRowInteractive
                                            }
                                        ]"
                                        :style="virtualRowStyle"
                                        :tabindex="isRowInteractive ? 0 : undefined"
                                        :aria-selected="props.selectionMode ? (isRowSelected(displayData[virtualRow.index]) ? 'true' : 'false') : undefined"
                                        @click="handleRowClick(displayData[virtualRow.index], virtualRow.index, $event)"
                                        @keydown="handleRowKeydown(displayData[virtualRow.index], virtualRow.index, $event)"
                                    >
                                        <td
                                            v-for="col in resolvedColumns"
                                            :key="col.field || col.header || 'td'"
                                            :class="['max-table-td', 'max-table-cell', 'p-datatable-cell', col.class]"
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

                                        <td v-if="slots.buttons" class="max-table-td max-table-td-buttons max-table-cell p-datatable-cell" :style="buttonsColumnStyle">
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
                                            props.stripedRows !== false ? (index % 2 === 0 ? 'max-table-row-even p-row-even' : 'max-table-row-odd p-row-odd') : '',
                                            {
                                                'max-table-row-selected': isRowSelected(row),
                                                'max-table-row-interactive': isRowInteractive
                                            }
                                        ]"
                                        :tabindex="isRowInteractive ? 0 : undefined"
                                        :aria-selected="props.selectionMode ? (isRowSelected(row) ? 'true' : 'false') : undefined"
                                        @click="handleRowClick(row, index, $event)"
                                        @keydown="handleRowKeydown(row, index, $event)"
                                    >
                                        <td
                                            v-for="col in resolvedColumns"
                                            :key="col.field || col.header || 'td'"
                                            :class="['max-table-td', 'max-table-cell', 'p-datatable-cell', col.class]"
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

                                        <td v-if="slots.buttons" class="max-table-td max-table-td-buttons max-table-cell p-datatable-cell" :style="buttonsColumnStyle">
                                            <div class="max-table-buttons" ref="el">
                                                <slot name="buttons" :data="row" :index="index" />
                                            </div>
                                        </td>
                                    </tr>
                                </template>
                            </template>

                            <!-- 3. Empty state quando empty===true ou displayData estiver vazio -->
                            <tr v-else class="max-table-row-state max-table-empty-row">
                                <td :colspan="resolvedColumns.length + (slots.buttons ? 1 : 0)" class="max-table-empty-cell max-table-td max-table-cell p-datatable-cell state-cell">
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

            <!-- POPOVER DE FILTRO (MODO MENU) -->
            <div
                v-if="activeMenuCol"
                class="max-table-filter-popover"
                :style="menuPopoverStyle"
                @click.stop
            >
                <div class="filter-popover-header">
                    <span>Filtrar {{ getMenuColHeader() }}</span>
                    <button type="button" class="filter-popover-close" @click.stop="closeFilterMenu" aria-label="Fechar">
                        <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>
                <div class="filter-popover-body">
                    <div class="filter-popover-operator">
                        <label>Condição</label>
                        <select v-model="menuMatchMode" class="filter-popover-select">
                            <option value="contains">Contém</option>
                            <option value="startsWith">Começa com</option>
                            <option value="endsWith">Termina com</option>
                            <option value="equals">Igual</option>
                            <option value="notEquals">Diferente</option>
                            <option value="gt">Maior que</option>
                            <option value="gte">Maior ou igual</option>
                            <option value="lt">Menor que</option>
                            <option value="lte">Menor ou igual</option>
                        </select>
                    </div>
                    <div class="filter-popover-input-box">
                        <input
                            type="text"
                            v-model="menuFilterValue"
                            class="max-table-filter-menu-input"
                            placeholder="Valor do filtro..."
                            @keydown.enter.prevent="applyMenuFilter"
                        />
                    </div>
                    <div class="filter-popover-actions">
                        <button type="button" class="max-table-filter-clear-btn" @click.stop="clearMenuFilter">Limpar</button>
                        <button type="button" class="max-table-filter-apply-btn" @click.stop="applyMenuFilter">Aplicar</button>
                    </div>
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
        getCurrentInstance,
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
        onRowClick?: any;
        filters?: Record<string, any>;
        filterDisplay?: 'row' | 'menu';
        globalFilterFields?: string[];
        filterDebounce?: number;
        filterPlaceholder?: string;
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
        filter?: boolean;
        filterField?: string;
        filterPlaceholder?: string;
        filterMatchMode?: string;
        showClearButton?: boolean;
        showFilterMenu?: boolean;
        bodySlot?: any;
        headerSlot?: any;
        filterSlot?: any;
        filterHeaderSlot?: any;
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
        itemHeight: undefined,
        filterDisplay: 'row',
        filterDebounce: 300,
        filterPlaceholder: 'Filtrar...'
    });

    const emit = defineEmits<{
        'update:first': [first: number];
        'update:rows': [rows: number];
        'update:selection': [selection: any];
        'update:modelValue': [value: any];
        'update:filters': [filters: Record<string, any>];
        'page': [event: { page: number; first: number; rows: number; pageCount: number }];
        'row-click': [event: { originalEvent: MouseEvent; data: any; index: number }];
        'sort': [event: { sortField: string; sortOrder: 1 | -1 | 0 }];
        'filter': [event: { filters: Record<string, any>; filteredValue?: any[] }];
    }>();

    defineSlots<{
        default?(): any;
        header?(): any;
        loading?(): any;
        empty?(): any;
        buttons?(props: { data: any; index: number }): any;
        footer?(): any;
        [key: string]: any;
    }>();

    const attrs = useAttrs();
    const slots = useSlots() as Record<string, any>;
    const instance = getCurrentInstance();

    const hasRowClickListener = computed(() => {
        const vnodeProps = instance?.vnode?.props;
        return Boolean(
            props.onRowClick
                || vnodeProps?.['onRow-click']
                || vnodeProps?.['onRowClick']
                || attrs['onRow-click']
                || attrs['onRowClick']
        );
    });

    const isRowInteractive = computed(() => {
        return Boolean(props.selectionMode || hasRowClickListener.value);
    });

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
            let filterSlot: any = null;
            let filterHeaderSlot: any = null;
            if (children && typeof children === 'object') {
                if (typeof children.body === 'function') bodySlot = children.body;
                else if (typeof children.default === 'function') bodySlot = children.default;

                if (typeof children.header === 'function') headerSlot = children.header;
                if (typeof children.filter === 'function') filterSlot = children.filter;
                if (typeof children.filterHeader === 'function') filterHeaderSlot = children.filterHeader;
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
                filter: colProps.filter !== undefined && colProps.filter !== false,
                filterField: colProps.filterField || colProps['filter-field'],
                filterPlaceholder: colProps.filterPlaceholder || colProps['filter-placeholder'],
                filterMatchMode: colProps.filterMatchMode || colProps['filter-match-mode'],
                showClearButton: colProps.showClearButton !== false && colProps['show-clear-button'] !== false,
                showFilterMenu: colProps.showFilterMenu !== false && colProps['show-filter-menu'] !== false,
                bodySlot,
                headerSlot,
                filterSlot,
                filterHeaderSlot
            });
        }
        return columns;
    }

    let cachedColumns: ResolvedColumn[] = [];

    /** Colunas resolvidas a partir de props ou do default slot */
    const resolvedColumns = computed<ResolvedColumn[]>(() => {
        if (Array.isArray(props.columns) && props.columns.length > 0) {
            cachedColumns = props.columns.map((col) => ({
                ...col,
                sortable: col.sortable !== undefined && col.sortable !== false,
                filter: col.filter !== undefined && col.filter !== false,
                bodySlot: (slots as any)[col.slot ?? col.field ?? ''],
                filterSlot: (slots as any)[`filter-${col.field}`] ?? (slots as any)[col.filterSlot ?? '']
            }));
            return cachedColumns;
        }

        if (!slots.default) {
            cachedColumns = [];
            return [];
        }
        cachedColumns = extractColumnsFromVNodes(slots.default());
        return cachedColumns;
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

    let keyboardTriggerPending = false;

    function getHeaderAriaLabel(col: ResolvedColumn): string {
        return col.header?.trim() || col.field?.trim() || 'Coluna';
    }

    function getSortButtonAriaLabel(col: ResolvedColumn): string {
        const name = col.header?.trim() || col.field?.trim();
        return name || 'Ordenar coluna';
    }

    function onHeaderKeydown(col: ResolvedColumn, event: KeyboardEvent) {
        if (event.key === 'Enter' || event.key === ' ' || event.code === 'Space') {
            keyboardTriggerPending = true;
            onHeaderClick(col);
            setTimeout(() => {
                keyboardTriggerPending = false;
            }, 0);
        }
    }

    function onThKeydown(col: ResolvedColumn, event: KeyboardEvent) {
        if ((event.target as HTMLElement)?.closest?.('.max-table-header-button')) return;
        if (event.key === 'Enter' || event.key === ' ' || event.code === 'Space') {
            keyboardTriggerPending = true;
            onHeaderClick(col);
            setTimeout(() => {
                keyboardTriggerPending = false;
            }, 0);
        }
    }

    function onThClick(col: ResolvedColumn, event: MouseEvent) {
        if ((event.target as HTMLElement)?.closest?.('.max-table-header-button')) return;
        if (keyboardTriggerPending) return;
        onHeaderClick(col, event);
    }

    function onHeaderClick(col: ResolvedColumn, event?: MouseEvent) {
        if (!col.sortable || !col.field) return;
        if (keyboardTriggerPending && event) return;

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

    /** Estado e Reatividade de Filtros */
    const localFilters = ref<Record<string, any>>({ ...(props.filters ?? {}) });
    watch(() => props.filters, (newFilters) => {
        if (newFilters) localFilters.value = { ...newFilters };
        else localFilters.value = {};

    }, { deep: true });

    const hasRowFilters = computed<boolean>(() => {
        return resolvedColumns.value.some((col) => col.filter || col.filterSlot);
    });

    const activeMenuCol = ref<string | null>(null);
    const menuMatchMode = ref<string>('contains');
    const menuFilterValue = ref<any>('');
    const menuPopoverStyle = ref<Record<string, string>>({});

    function normalizeString(val: any): string {
        if (val === null || val === undefined) return '';
        return String(val)
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
    }

    function testFilterMatch(rowValue: any, filterValue: any, matchMode: string = 'contains'): boolean {
        if (filterValue === null || filterValue === undefined || filterValue === '') return true;

        if (rowValue === null || rowValue === undefined) return matchMode === 'notEquals';


        const normRow = normalizeString(rowValue);
        const normFilter = normalizeString(filterValue);

        switch (matchMode) {
            case 'startsWith':
                return normRow.startsWith(normFilter);
            case 'endsWith':
                return normRow.endsWith(normFilter);
            case 'equals':
                if (typeof rowValue === 'number' && !isNaN(Number(filterValue))) return rowValue === Number(filterValue);

                return normRow === normFilter;
            case 'notEquals':
                if (typeof rowValue === 'number' && !isNaN(Number(filterValue))) return rowValue !== Number(filterValue);

                return normRow !== normFilter;
            case 'in':
                if (Array.isArray(filterValue)) return filterValue.some((item) => normalizeString(item) === normRow || item === rowValue);

                return normRow.includes(normFilter);
            case 'gt':
                return Number(rowValue) > Number(filterValue);
            case 'gte':
                return Number(rowValue) >= Number(filterValue);
            case 'lt':
                return Number(rowValue) < Number(filterValue);
            case 'lte':
                return Number(rowValue) <= Number(filterValue);
            case 'contains':
            default:
                return normRow.includes(normFilter);
        }
    }

    function getFilterEntry(field?: string): { value: any; matchMode: string } {
        if (!field) return { value: null, matchMode: 'contains' };
        const raw = localFilters.value[field];
        if (raw !== null && typeof raw === 'object' && 'value' in raw) return {
            value: raw.value,
            matchMode: raw.matchMode || 'contains'
        };

        return {
            value: raw,
            matchMode: 'contains'
        };
    }

    function hasFilterValue(field?: string): boolean {
        if (!field) return false;
        const entry = getFilterEntry(field);
        return entry.value !== null && entry.value !== undefined && entry.value !== '';
    }

    function getFilterInputValue(field?: string): string {
        if (!field) return '';
        const entry = getFilterEntry(field);
        if (entry.value === null || entry.value === undefined) return '';
        return String(entry.value);
    }

    function getFilterModel(field?: string) {
        if (!field) return { value: null, matchMode: 'contains' };
        const entry = getFilterEntry(field);
        return {
            value: entry.value,
            matchMode: entry.matchMode
        };
    }

    const debounceTimers: Record<string, any> = {};

    function triggerFilterUpdate() {
        const updatedFilters = { ...localFilters.value };
        emit('update:filters', updatedFilters);

        if (props.lazy) emit('filter', {
            filters: updatedFilters,
            filteredValue: rawData.value
        });
        else {
            emit('filter', {
                filters: updatedFilters,
                filteredValue: filteredData.value
            });
            if (first.value > 0 && currentPage.value >= pageCount.value) {
                first.value = 0;
                emit('update:first', 0);
            }
        }
    }

    function setFilterValue(field: string | undefined, val: any, matchMode?: string) {
        if (!field) return;
        const current = localFilters.value[field];
        const mode = matchMode || (current && typeof current === 'object' && current.matchMode ? current.matchMode : 'contains');

        localFilters.value[field] = {
            value: val,
            matchMode: mode
        };

        triggerFilterUpdate();
    }

    function onFilterInputChange(field: string | undefined, val: any, matchMode?: string) {
        setFilterValue(field, val, matchMode);
    }

    function onFilterInput(field: string | undefined, event: Event) {
        if (!field) return;
        const target = event.target as HTMLInputElement;
        const val = target.value;
        const debounceMs = props.filterDebounce ?? 300;

        if (debounceMs <= 0) setFilterValue(field, val);
        else {
            if (debounceTimers[field]) clearTimeout(debounceTimers[field]);
            debounceTimers[field] = setTimeout(() => {
                setFilterValue(field, val);
            }, debounceMs);
        }
    }

    function clearColumnFilter(field?: string) {
        if (!field) return;
        if (debounceTimers[field]) clearTimeout(debounceTimers[field]);
        const current = localFilters.value[field];
        if (typeof current === 'object' && current !== null && 'value' in current) localFilters.value[field] = {
            ...current,
            value: null
        };
        else localFilters.value[field] = null;

        triggerFilterUpdate();
    }

    function toggleFilterMenu(col: ResolvedColumn, event: MouseEvent) {
        if (!col.field) return;
        if (activeMenuCol.value === col.field) {
            closeFilterMenu();
            return;
        }

        activeMenuCol.value = col.field;
        const entry = getFilterEntry(col.field);
        menuFilterValue.value = entry.value ?? '';
        menuMatchMode.value = entry.matchMode || col.filterMatchMode || 'contains';

        const target = event.currentTarget as HTMLElement;
        if (target) {
            const rect = target.getBoundingClientRect();
            menuPopoverStyle.value = {
                position: 'fixed',
                top: `${rect.bottom + 4}px`,
                left: `${Math.max(10, rect.left - 100)}px`,
                zIndex: '1000'
            };
        }
    }

    function getMenuColHeader(): string {
        if (!activeMenuCol.value) return '';
        const col = resolvedColumns.value.find((c) => c.field === activeMenuCol.value);
        return col ? getHeaderAriaLabel(col) : '';
    }

    function closeFilterMenu() {
        activeMenuCol.value = null;
    }

    function applyMenuFilter() {
        if (activeMenuCol.value) {
            setFilterValue(activeMenuCol.value, menuFilterValue.value, menuMatchMode.value);
            closeFilterMenu();
        }
    }

    function clearMenuFilter() {
        if (activeMenuCol.value) {
            menuFilterValue.value = '';
            clearColumnFilter(activeMenuCol.value);
            closeFilterMenu();
        }
    }

    /** Dados filtrados */
    const filteredData = computed<any[]>(() => {
        const list = Array.isArray(rawData.value) ? [...rawData.value] : [];
        if (props.lazy) return list;

        const activeFilterEntries = Object.entries(localFilters.value).filter(([_, val]) => {
            if (val === null || val === undefined || val === '') return false;
            if (typeof val === 'object' && (val.value === null || val.value === undefined || val.value === '')) return false;
            return true;
        });

        if (activeFilterEntries.length === 0) return list;

        let globalTerm: any = null;
        if (localFilters.value.global !== undefined) {
            const g = localFilters.value.global;
            globalTerm = typeof g === 'object' && g !== null && 'value' in g ? g.value : g;
        }

        const hasGlobalFilter = globalTerm !== null && globalTerm !== undefined && globalTerm !== '';
        let globalFields: string[] = [];
        if (hasGlobalFilter) if (Array.isArray(props.globalFilterFields) && props.globalFilterFields.length > 0) globalFields = props.globalFilterFields;
        else if (cachedColumns.length > 0) globalFields = cachedColumns.map((c) => c.filterField || c.field).filter(Boolean) as string[];
        else if (list.length > 0) globalFields = Object.keys(list[0]);


        return list.filter((row) => {
            if (hasGlobalFilter) {
                const matchesGlobal = globalFields.some((field) => {
                    const val = getFieldValue(row, field);
                    return testFilterMatch(val, globalTerm, 'contains');
                });
                if (!matchesGlobal) return false;
            }

            for (const [key, filterRaw] of activeFilterEntries) {
                if (key === 'global') continue;

                const filterVal = typeof filterRaw === 'object' && filterRaw !== null && 'value' in filterRaw ? filterRaw.value : filterRaw;
                if (filterVal === null || filterVal === undefined || filterVal === '') continue;

                const matchMode = typeof filterRaw === 'object' && filterRaw !== null && filterRaw.matchMode ? filterRaw.matchMode : 'contains';
                const rowVal = getFieldValue(row, key);

                if (!testFilterMatch(rowVal, filterVal, matchMode)) return false;

            }

            return true;
        });
    });

    /** Dados ordenados */
    const sortedData = computed<any[]>(() => {
        const list = Array.isArray(filteredData.value) ? [...filteredData.value] : [];
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

    watch(filteredData, () => {
        if (!props.lazy && first.value > 0 && currentPage.value >= pageCount.value) {
            first.value = 0;
            emit('update:first', 0);
        }
    });

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

    function isInteractiveElement(target: HTMLElement | null, currentTarget: HTMLElement | null): boolean {
        if (!target || !currentTarget || target === currentTarget) return false;
        let el: HTMLElement | null = target;
        while (el && el !== currentTarget) {
            const tag = el.tagName?.toUpperCase();
            if (tag === 'BUTTON' || tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA' || tag === 'A') return true;
            const role = el.getAttribute('role');
            if (role === 'button' || role === 'link' || role === 'checkbox' || role === 'switch') return true;
            el = el.parentElement;
        }
        return false;
    }

    function toggleRowSelection(row: any) {
        if (!props.selectionMode) return;
        if (props.selectionMode === 'single') {
            const isSelected = isRowSelected(row);
            emit('update:selection', isSelected ? null : row);
        } else if (props.selectionMode === 'multiple') {
            const currentSelection = Array.isArray(props.selection) ? [...props.selection] : [];
            const isSelected = isRowSelected(row);
            let newSelection: any[];
            if (isSelected) newSelection = currentSelection.filter((item: any) => {
                if (props.dataKey && row?.[props.dataKey] !== undefined) return item?.[props.dataKey] !== row[props.dataKey];
                return item !== row && item?.id !== row?.id;
            });
            else newSelection = [...currentSelection, row];

            emit('update:selection', newSelection);
        }
    }

    function handleRowClick(row: any, index: number, event: MouseEvent) {
        if (isInteractiveElement(event.target as HTMLElement, event.currentTarget as HTMLElement)) return;
        emit('row-click', {
            originalEvent: event,
            data: row,
            index
        });
        if (props.selectionMode === 'single') emit('update:selection', row);
        else if (props.selectionMode === 'multiple') toggleRowSelection(row);
    }

    function handleRowKeydown(row: any, index: number, event: KeyboardEvent) {
        if (isInteractiveElement(event.target as HTMLElement, event.currentTarget as HTMLElement)) return;

        if (event.key === 'Enter' && hasRowClickListener.value) {
            event.preventDefault();
            emit('row-click', {
                originalEvent: event as any,
                data: row,
                index
            });
        } else if (event.key === ' ' && props.selectionMode) {
            event.preventDefault();
            toggleRowSelection(row);
        }
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
@use '../themes/table-anatomy' as table;

.max-table-main-div {
    @include table.table-container;

    border-radius: 1rem;
    overflow: hidden !important;
    max-height: 100%;
    width: 100%;
    height: 100%;
    border: 1px solid var(--max-table-border-color, var(--background-300)) !important;
    position: relative;

    :deep(.max-table) {
        height: 100%;
        display: flex;
        flex-direction: column;

        .max-table-container {
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
                    font-family: inherit;
                    display: grid;
                    background-color: transparent !important;

                    tr {
                        @include table.table-header-row;

                        th {
                            @include table.table-header-cell;

                            &.max-table-th-sortable {
                                cursor: pointer;
                                user-select: none;
                                outline: none;
                            }

                            .max-table-header-button {
                                width: 100%;
                                height: 100%;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                background: transparent;
                                border: none;
                                padding: 0;
                                margin: 0;
                                color: inherit;
                                font: inherit;
                                cursor: pointer;
                                outline: none;

                                &:focus:not(:focus-visible) {
                                    outline: none;
                                }

                                &:focus-visible {
                                    outline: var(--max-focus-outline, 2px solid var(--max-primary-500, #00768e));
                                    outline-offset: -2px;
                                }
                            }

                            .max-table-column-header-content {
                                position: relative;
                                display: grid;
                                grid-template-columns: 1fr !important;
                                height: 100%;
                                place-items: center;
                                width: 100%;

                                .max-table-column-title {
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

                                .max-table-filter-menu-button {
                                    display: inline-flex;
                                    align-items: center;
                                    justify-content: center;
                                    width: 20px;
                                    height: 20px;
                                    padding: 0;
                                    margin-left: 4px;
                                    border: none;
                                    background: transparent;
                                    border-radius: 4px;
                                    cursor: pointer;
                                    color: var(--background-500, #64748b);
                                    transition: color 0.15s ease, background-color 0.15s ease;

                                    &:hover {
                                        background-color: var(--background-100, #f1f5f9);
                                        color: var(--max-primary-500, #00768e);
                                    }

                                    &.is-filtered {
                                        color: var(--max-primary-500, #00768e);
                                    }
                                }
                            }
                        }

                        &.max-table-filter-row {
                            border-top: 1px solid var(--background-200, #e2e8f0);
                            background-color: var(--background-50, #f8fafc);

                            th.max-table-filter-cell {
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                padding: 4px 6px;
                                box-sizing: border-box;

                                .max-table-filter-input-wrapper {
                                    position: relative;
                                    display: flex;
                                    align-items: center;
                                    width: 100%;

                                    .max-table-filter-input {
                                        width: 100%;
                                        height: 26px;
                                        padding: 2px 22px 2px 8px;
                                        font-size: 0.8rem;
                                        border-radius: 4px;
                                        border: 1px solid var(--background-300, #cbd5e1);
                                        background-color: var(--background-0, #fff);
                                        color: var(--background-900, #0f172a);
                                        outline: none;
                                        box-sizing: border-box;
                                        transition: border-color 0.15s ease;

                                        &:focus {
                                            outline: var(--max-focus-outline, 2px solid var(--max-primary-500, #00768e));
                                            border-color: var(--max-primary-500, #00768e);
                                        }
                                    }

                                    .max-table-filter-clear-button {
                                        position: absolute;
                                        right: 4px;
                                        display: inline-flex;
                                        align-items: center;
                                        justify-content: center;
                                        width: 16px;
                                        height: 16px;
                                        padding: 0;
                                        border: none;
                                        background: transparent;
                                        color: var(--background-500, #64748b);
                                        cursor: pointer;
                                        border-radius: 50%;

                                        &:hover {
                                            color: var(--max-danger-500, #ef4444);
                                            background-color: var(--background-100, #f1f5f9);
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
                    font-family: inherit;
                    display: flex !important;
                    flex-direction: column;
                    overflow-y: auto;

                    tr {
                        @include table.table-body-row;

                        &.max-table-virtual-spacer {
                            padding: 0 !important;
                            margin: 0 !important;
                            border: none !important;
                            pointer-events: none;
                            background: transparent !important;
                            min-height: 0 !important;
                        }

                        @include table.table-row-zebra;

                        &.max-table-row-interactive {
                            cursor: pointer;

                            &:focus:not(:focus-visible) {
                                outline: none;
                            }

                            &:focus-visible {
                                outline: var(--max-focus-outline, 2px solid var(--max-primary-500, #00768e));
                                outline-offset: -2px;
                            }
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
                                    color: var(--background-700);
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
                                    color: var(--background-700);
                                    font-style: italic;
                                    text-align: center;
                                }
                            }
                        }

                        td {
                            @include table.table-cell-base;

                            place-items: center;

                            @include table.table-cell-input-feedback;
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

        .max-table-filter-popover {
            position: fixed;
            z-index: 1000;
            min-width: 220px;
            padding: 12px;
            border-radius: 6px;
            background-color: var(--background-0, #fff);
            border: 1px solid var(--background-300, #cbd5e1);
            box-shadow: 0 4px 12px rgb(0 0 0 / 15%);

            .filter-popover-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 8px;
                font-weight: 600;
                font-size: 0.85rem;
                color: var(--background-800, #1e293b);

                .filter-popover-close {
                    background: transparent;
                    border: none;
                    cursor: pointer;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--background-500, #64748b);
                    padding: 2px;
                    border-radius: 4px;

                    &:hover {
                        color: var(--background-800, #1e293b);
                        background-color: var(--background-100, #f1f5f9);
                    }
                }
            }

            .filter-popover-body {
                display: flex;
                flex-direction: column;
                gap: 8px;

                .filter-popover-operator {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;

                    label {
                        font-size: 0.75rem;
                        color: var(--background-600, #475569);
                    }

                    .filter-popover-select {
                        width: 100%;
                        height: 28px;
                        padding: 2px 6px;
                        font-size: 0.8rem;
                        border-radius: 4px;
                        border: 1px solid var(--background-300, #cbd5e1);
                        background-color: var(--background-0, #fff);
                        color: var(--background-900, #0f172a);
                        outline: none;

                        &:focus {
                            outline: var(--max-focus-outline, 2px solid var(--max-primary-500, #00768e));
                        }
                    }
                }

                .filter-popover-input-box {
                    .max-table-filter-menu-input {
                        width: 100%;
                        height: 28px;
                        padding: 2px 8px;
                        font-size: 0.8rem;
                        border-radius: 4px;
                        border: 1px solid var(--background-300, #cbd5e1);
                        background-color: var(--background-0, #fff);
                        color: var(--background-900, #0f172a);
                        outline: none;
                        box-sizing: border-box;

                        &:focus {
                            outline: var(--max-focus-outline, 2px solid var(--max-primary-500, #00768e));
                        }
                    }
                }

                .filter-popover-actions {
                    display: flex;
                    justify-content: flex-end;
                    gap: 8px;
                    margin-top: 4px;

                    .max-table-filter-clear-btn {
                        padding: 4px 10px;
                        font-size: 0.8rem;
                        border-radius: 4px;
                        border: 1px solid var(--background-300, #cbd5e1);
                        background-color: var(--background-100, #f1f5f9);
                        color: var(--background-700, #334155);
                        cursor: pointer;

                        &:hover {
                            background-color: var(--background-200, #e2e8f0);
                        }
                    }

                    .max-table-filter-apply-btn {
                        padding: 4px 10px;
                        font-size: 0.8rem;
                        border-radius: 4px;
                        border: none;
                        background-color: var(--max-primary-500, #00768e);
                        color: #fff;
                        cursor: pointer;

                        &:hover {
                            background-color: var(--max-primary-600, #005f77);
                        }
                    }
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

@media (prefers-reduced-motion: reduce) {
    .max-table-wrapper .max-table-container table tbody tr.max-table-loading-row .max-table-spinner {
        animation-duration: 4s;
    }
}
</style>
