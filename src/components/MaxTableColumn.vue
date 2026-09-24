<template>
    <slot />
</template>

<script setup lang="ts">
    defineOptions({
        name: 'MaxTableColumn'
    });

    /**
     * Componente de coluna declarativa para tabelas (MaxTable).
     *
     * Define a anatomia canônica de coluna `.max-table-column`, materializando:
     * - Células de cabeçalho: `.max-table-th`, `.max-table-header-cell` (compatibilidade legada: `.p-column`)
     * - Células de dados: `.max-table-td`, `.max-table-cell` (compatibilidade legada: `.p-datatable-cell`)
     */
    defineProps<{
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
        filterMatchMode?: 'contains' | 'startsWith' | 'endsWith' | 'equals' | 'notEquals' | 'in' | 'lt' | 'lte' | 'gt' | 'gte' | string;
        showClearButton?: boolean;
        showFilterMenu?: boolean;
    }>();

    defineSlots<{
        default?(): any;
        body?(props: { data: any; field?: string; index?: number }): any;
        header?(props: { field?: string }): any;
        filter?(props: { field?: string; filterModel: any; filterCallback: (val: any) => void }): any;
        filterHeader?(props: { field?: string }): any;
        editor?(props: { data: any; field?: string }): any;
    }>();
</script>
