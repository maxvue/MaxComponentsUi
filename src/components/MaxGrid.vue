<template>
    <div class="max-grid-cols" >
        <slot></slot>
    </div>
</template>

/**
 * Sistema de grid flexível para organizar componentes.
 * Utiliza flexbox com wrap e gap padronizado.
 */
<script setup lang="ts">

</script>

<style lang="scss">
    .max-grid-cols {
        display: flex;
        flex-wrap: wrap;
        gap: 13px 8px;
        padding-top: 14px;
        background-color: red !important;
    }
</style>
