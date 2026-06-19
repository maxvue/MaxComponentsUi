<template>
    <div class="max-title-2" :class="{ center: center }">
        <MaxIcon :i="resolvedIcon ?? 'line-md:plus-circle'" v-if="resolvedIcon" size="1.5" class="mb-2" pr-8 />
        <div>
            <div v-if="resolvedTitle" class="text-lg font-medium uppercase t1-main-text">{{ resolvedTitle }}</div>
            <div v-if="resolvedSubtitle" class="text-sm t2-main-text" v-html="resolvedSubtitle"></div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { computed } from 'vue';

    const props = defineProps<{
        center?: boolean;
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

<style lang="scss" scoped>
    .max-title-2 {
        display: grid;
        grid-template-columns: auto 1fr;
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
