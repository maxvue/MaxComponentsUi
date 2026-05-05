<template>
    <router-link :to="{ name: props.route_name ?? props.route }">
        <slot></slot>
    </router-link>
</template>

<script setup lang="ts">
    interface Props {
        route_name?: string;
        route?: string;
    }

    const props = defineProps<Props>();

</script>
