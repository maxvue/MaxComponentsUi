<template>
    <slot />
</template>

<script setup lang="ts">
    defineOptions({
        name: 'MaxTableColumn'
    });

    /**
     * Componente de coluna declarativa para tabelas (MaxTable).
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
    }>();

    defineSlots<{
        default?(): any;
        body?(props: { data: any; field?: string; index?: number }): any;
        header?(props: { field?: string }): any;
        filter?(props: { field?: string }): any;
        editor?(props: { data: any; field?: string }): any;
    }>();
</script>
