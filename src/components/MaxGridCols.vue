<template>
    <div class="grid-cols" v-bind="attrs">
        <slot></slot>
    </div>
</template>

<script setup lang="ts">
    import { useAttrs } from 'vue';

    const attrs: any = useAttrs();
</script>

<style lang="scss" scoped>
    .grid-cols {
        display: grid;
        place-items: center;
        height: auto;
        position: relative;
        grid-template-columns: repeat(24, 1fr);
        width: 100%;
        gap: 15px 10px;
    }
</style>
