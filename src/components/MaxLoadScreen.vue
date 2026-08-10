<template>
    <div class="max-load-screen">
        <div v-if="size(loading.items) > 0">
            <div v-for="(target, key) in loading.targets" :key="key" class="load-screen-target-item" :target="key">
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

<style lang="scss">
    .load-screen-target-item {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw !important;
        height: 100vh !important;
    }
</style>
