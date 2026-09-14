<template>
    <div class="max-load-screen">
        <div v-if="size(loading.items) > 0">
            <div
                v-for="(target, key) in loading.targets"
                :key="key"
                class="load-screen-target-item"
                :class="{ 'is-global': target.target === 'body', 'is-local': target.target !== 'body' }"
                :target="key"
            >
                <MaxLoadScreenTarget :target="target" />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { size } from '@maxvue/max-use';
    import MaxLoadScreenTarget from './MaxLoadScreenTarget.vue';
    import { useLoadingStore } from '../stores/useLoading.Store';

    const loading = useLoadingStore();
</script>

<style lang="scss" scoped>
    .max-load-screen {
        pointer-events: none;

        .load-screen-target-item {
            display: contents;
        }
    }
</style>
