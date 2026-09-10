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
</script>
