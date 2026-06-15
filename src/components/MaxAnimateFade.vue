<template>
    <slot></slot>
</template>

<script setup lang="ts">
    import { useAttrs } from 'vue';

    const _attrs = useAttrs();
</script>
