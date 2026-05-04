<template>
    <div :class="`e-t1 ${center}`" v-bind="attrs">
        <div v-if="attrs.h1" class="text-lg font-medium uppercase t1-main-text">{{ attrs.h1 }}</div>
        <div v-if="attrs.h2" class="text-sm t2-main-text" >{{ attrs.h2 }}</div>
    </div>
</template>

<script setup lang="ts">
    const attrs = useAttrs();
    const center = computed(() => (attrs.center !== undefined ? 'center' : ''));
</script>

<style lang="scss" scoped>
    .e-t1 {
        padding: 10px 0 0;
        width: 100%;
        color: var(--background-700);

        .t1-main-text {
            font-weight: 500;
            font-size: 1.2rem;
            padding: 0 !important;
        }

        .t2-main-text {
            font-size: 0.95rem;
            font-weight: 400;
            padding: 0 !important;
            color: var(--background-700) !important;
        }

        &.center {
            display: grid;
            place-items: center;
        }
    }
</style>
