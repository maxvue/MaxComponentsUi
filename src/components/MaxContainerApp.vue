<template>
    <div class="max-container-app container-app" v-bind="attrs">
        <slot></slot>
    </div>
</template>

<script setup lang="ts">
    import { useAttrs } from 'vue';

    const attrs = useAttrs();
</script>

<style lang="scss" scoped>
    .container-app {
        display: grid;
        overflow: hidden;
        width: 100%;
        height: 100vh;
        height: 100dvh;
        box-sizing: border-box;
        grid-template-columns: auto 1fr;
        background-color: var(--layout-shell-bg, #003048) !important;

        &[screen='mobile'] {
            grid-template-columns: 1fr;
        }
    }
</style>
