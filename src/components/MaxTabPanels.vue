<template>
    <div class="max-tab-panels">
        <slot></slot>
    </div>
</template>

<script setup lang="ts">
    import { injectTabsContext } from '../helpers/tabsContext';

    // Valida que o componente esta dentro de um <MaxTabs>.
    injectTabsContext('MaxTabPanels');
</script>

<style lang="scss" scoped>
    .max-tab-panels {
        padding: 1rem 0;
        flex: 1 1 0;
        min-height: 0;
        overflow-y: auto;
        box-sizing: border-box;
    }
</style>
