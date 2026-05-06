<template>
    <div class="t2 select-none" v-bind="attrs">
        <div v-if="attrs['h1']" class="text-h1">{{ attrs['h1'] }}</div>
        <div v-if="attrs['h2']" class="text-h2" v-html="attrs['h2']"></div>
    </div>
</template>

<script setup lang="ts">
    const attrs = useAttrs();
</script>

<style scoped lang="scss">
    .t2 {
        padding: 1rem 0 5px;
        width: 100%;

        .text-h1 {
            font-weight: 500;
            text-transform: uppercase;
            font-size: 0.9rem;
            color: var(--background-750);
        }

        .text-h2 {
            font-weight: 300;
            font-size: 0.85rem;
            color: var(--background-675);
        }
    }
</style>
