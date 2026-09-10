<template>
    <Transition name="fade">
        <slot></slot>
    </Transition>
</template>

<script setup lang="ts">
    /**
     * Componente de transição de fade.
     */
</script>

<style lang="scss" scoped>
    :global(.fade-enter-active),
    :global(.fade-leave-active) {
        transition: opacity 0.2s ease;
    }

    :global(.fade-enter-from),
    :global(.fade-leave-to) {
        opacity: 0;
        transition-delay: 0.2s;
    }
</style>
