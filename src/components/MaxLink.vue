<template>
    <router-link :to="{ name: attrs.route_name }">
        <slot></slot>
    </router-link>
</template>

<script setup lang="ts">
    const attrs = useAttrs();
</script>
