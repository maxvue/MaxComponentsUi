<template>
    <div :class="`max-title-2 ${center}`" v-bind="attrs">
        <MaxIcon :i="icon ?? 'line-md:plus-circle'" v-if="icon" size="1.5" class="mb-2" pr-8 />
        <div v-if="title" class="text-lg font-medium uppercase t1-main-text">{{ title }}</div>
        <div v-if="subtitle" class="text-sm t2-main-text" v-html="subtitle"></div>
    </div>
</template>

<script setup lang="ts">
    import { computed, useAttrs } from 'vue';

    const attrs = useAttrs();
    const center = computed(() => (attrs.center !== undefined ? 'center' : ''));

    const title = computed(() => attrs['h1'] ?? attrs['title']);
    const subtitle = computed(() => attrs['h2'] ?? attrs['subtitle']);
    const icon = computed(() => attrs.icon ?? attrs.i ?? attrs.icone );
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
