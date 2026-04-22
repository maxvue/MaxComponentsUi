<template>
    <div>
        <div class="max-grid-cols" v-bind="attrs" col-gap-8 row-gap-18 pt14>
            <slot></slot>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { useAttrs } from 'vue';

    const attrs: any = useAttrs();
</script>

<style lang="scss">
    .max-grid-cols {
        display: flex;
        flex-wrap: wrap;
    }
</style>
