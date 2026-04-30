<template>
    <Transition name="fade">
        <slot></slot>
    </Transition>
</template>

<script lang="ts">


</script>

<style>
    .fade-enter-active,
    .fade-leave-active {
        transition: opacity 0.5s ease;
    }

    .fade-enter-from,
    .fade-leave-to {
        opacity: 0;
        transition-delay: 0.3s;
    }
</style>
