<template>
    <div class="t2 select-none" v-bind="attrs">
        <div v-if="title" class="text-h1">{{ title }}</div>
        <div v-if="subtitle" class="text-h2" v-html="subtitle"></div>
    </div>
</template>

<script setup lang="ts">
    import { computed, useAttrs } from 'vue';

    const attrs = useAttrs();

    const title = computed(() => attrs['h1'] ?? attrs['title']);
    const subtitle = computed(() => attrs['h2'] ?? attrs['subtitle']);
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
