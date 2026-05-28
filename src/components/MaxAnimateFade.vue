<template>
    <slot></slot>
</template>

<script setup lang="ts">
    import { useAttrs } from 'vue';

    const attrs = useAttrs();
</script>
