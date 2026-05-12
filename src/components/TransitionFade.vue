<template>
    <Transition name="fade">
        <slot></slot>
    </Transition>
</template>

/**
 * Componente de transição de fade.
 */
<script setup lang="ts">

</script>

<style>
    .fade-enter-active,
    .fade-leave-active {
        transition: opacity 0.2s ease;
    }

    .fade-enter-from,
    .fade-leave-to {
        opacity: 0;
        transition-delay: 0.2s;
    }
</style>
