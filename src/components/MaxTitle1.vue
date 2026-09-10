<template>
    <div class="max-title-1 max-title-2" :class="{ center: center }">
        <!-- Sem `pr-8` aqui: o MaxIcon replica os attrs no div interno (v-bind="attrs"), e o
             padding duplicado esmagava o svg. O espaçamento fica no column-gap do wrapper. -->
        <MaxIcon :i="resolvedIcon" v-if="resolvedIcon" :size="resolvedIconSize" class="title-icon" />
        <div>
            <div v-if="resolvedTitle" class="t1-main-text">{{ resolvedTitle }}</div>
            <div v-if="resolvedSubtitle" class="t2-main-text" v-html="resolvedSubtitle"></div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { computed } from 'vue';
    import { sanitizeHtml } from '../helpers/sanitizeHtml';

    const props = defineProps<{
        center?: boolean;
        h1?: string;
        title?: string;
        h2?: string;
        subtitle?: string;
        subTitle?: string;
        icon?: string;
        i?: string;
        icone?: string;
        iconSize?: string | number;
        sizeIcon?: string | number;
    }>();

    const resolvedTitle = computed(() => props.title ?? props.h1);
    const rawSubtitle = computed(() => props.subtitle ?? props.subTitle ?? props.h2);
    const resolvedSubtitle = computed(() => (rawSubtitle.value ? sanitizeHtml(rawSubtitle.value) : ''));
    const resolvedIcon = computed(() => props.icon ?? props.i ?? props.icone);
    const resolvedIconSize = computed(() => props.sizeIcon ?? props.iconSize ?? 1.3);
</script>

<style lang="scss" scoped>
    .max-title-1,
    .max-title-2 {
        display: grid;
        grid-template-columns: auto 1fr;
        column-gap: 8px;
        place-items: center start;
        padding: 10px 0 0;
        width: 100%;
        color: var(--background-700);

        .title-icon {
            margin-bottom: 0.5rem;
        }

        .t1-main-text {
            font-weight: 500;
            font-size: 1.125rem;
            text-transform: uppercase;
            padding: 0 !important;
            color: var(--background-775);
        }

        .t2-main-text {
            font-size: 0.875rem;
            font-weight: 400;
            padding: 0 !important;
            color: var(--background-750) !important;
        }

        &.center {
            display: grid;
            place-items: center;
        }
    }
</style>
