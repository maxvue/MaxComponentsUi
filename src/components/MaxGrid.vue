<template>
    <div class="max-grid-cols" >
        <div class="label-grid" v-if="props.label" :class="props.labelCenter ? 'label-center' : ''">
            {{ props.label }}
        </div>
        <slot></slot>
    </div>
</template>

/**
 * Sistema de grid flexível para organizar componentes.
 * Utiliza flexbox com wrap e gap padronizado.
 */
<script setup lang="ts">

    const props = defineProps<{
        label?: string | null;
        labelCenter?: boolean;
    }>();

</script>

<style lang="scss">
.max-grid-cols {
    display: flex;
    flex-wrap: wrap;
    gap: 13px 8px;
    padding-top: 14px;
    position: relative;

    .label-grid {
        position: absolute;
        top: -10px;
        left: 20px;
        background-color: var(--background-0);
        padding: 0 10px;
        font-size: 0.8rem;
        color: var(--background-600);

        &.label-center {
            transform: translateX(-50%) !important;
            left: calc(50%) !important;
        }
    }
}
</style>
