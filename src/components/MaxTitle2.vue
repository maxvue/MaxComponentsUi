<template>
    <div class="max-title-2 select-none">
        <!-- Sem `pr-8` aqui: o MaxIcon replica os attrs no div interno (v-bind="attrs"), e o
             padding duplicado esmagava o svg (19,5px − 8 − 8 = 3,5px). O espaçamento entre
             ícone e texto é o column-gap do .max-title-2. -->
        <MaxIcon :i="resolvedIcon" v-if="resolvedIcon" :size="resolvedIconSize" class="mb-2" />
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
        subTitle?: string;
        icon?: string;
        i?: string;
        icone?: string;
        iconSize?: string | number;
        sizeIcon?: string | number;
    }>();

    const resolvedTitle = computed(() => props.title ?? props.h1);
    const resolvedSubtitle = computed(() => props.subtitle ?? props.subTitle ?? props.h2);
    const resolvedIcon = computed(() => props.icon ?? props.i ?? props.icone);
    const resolvedIconSize = computed(() => props.sizeIcon ?? props.iconSize ?? 1.3);
</script>

<style scoped lang="scss">
    .max-title-2 {
        display: grid;
        grid-template-columns: auto 1fr;
        column-gap: 8px;
        padding: 1rem 0 5px;
        width: 100%;
        place-items: center start;

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
