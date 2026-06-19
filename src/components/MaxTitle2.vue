<template>
    <div class="max-title-2 select-none" v-bind="attrs">
        <MaxIcon :i="icon ?? 'line-md:plus-circle'" v-if="icon" size="1.5" class="mb-2" pr-8 />
        <div>
            <div v-if="title" class="text-h1">{{ title }}</div>
            <div v-if="subtitle" class="text-h2" v-html="subtitle"></div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { computed, useAttrs } from 'vue';

    const attrs = useAttrs();

    const title = computed(() => attrs['h1'] ?? attrs['title']);
    const subtitle = computed(() => attrs['h2'] ?? attrs['subtitle']);
    const icon = computed(() => attrs.icon ?? attrs.i ?? attrs.icone );
</script>

<style scoped lang="scss">
    .max-title-2 {
        display: grid;
        grid-template-columns: auto 1fr;
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
