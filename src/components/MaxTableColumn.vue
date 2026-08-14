<template>
    <slot />
</template>

<script setup lang="ts">
    /**
     * Componente de coluna auxiliar para tabelas.
     */
    defineProps<{
        field?: string;
        header?: string;
        style?: any;
    }>();
</script>
