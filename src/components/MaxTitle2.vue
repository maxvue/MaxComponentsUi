<template>
    <div class="max-title-2 select-none">
        <MaxIcon :i="resolvedIcon" v-if="resolvedIcon" size="1.5" class="mb-2" pr-8 />
        <div>
            <div v-if="resolvedTitle" class="text-h1">{{ resolvedTitle }}</div>
            <div v-if="resolvedSubtitle" class="text-h2" v-html="resolvedSubtitle"></div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { computed } from 'vue';

    const props = defineProps<{
        h1?: string;
        title?: string;
        h2?: string;
        subtitle?: string;
        icon?: string;
        i?: string;
        icone?: string;
    }>();

    const resolvedTitle = computed(() => props.h1 ?? props.title);
    const resolvedSubtitle = computed(() => props.h2 ?? props.subtitle);
    const resolvedIcon = computed(() => props.icon ?? props.i ?? props.icone);
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
