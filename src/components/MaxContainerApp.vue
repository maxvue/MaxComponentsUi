<template>
    <div class="container-app" v-bind="attrs">
        <slot></slot>
    </div>
</template>

<script setup lang="ts">
    import { useAttrs } from 'vue';

    const attrs = useAttrs();
</script>

<style lang="scss">
    .container-app {
        display: grid;
        overflow: hidden;
        width: 100%;
        height: 100vh;
        height: 100dvh;
        box-sizing: border-box;
        grid-template-columns: auto 1fr;
        background-color: var(--blue-850) !important;

        &[screen='mobile'] {
            grid-template-columns: 1fr;
        }
    }
</style>
