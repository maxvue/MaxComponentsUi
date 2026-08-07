<template>
    <div class="max-tab">
        <slot></slot>
    </div>
</template>

<script setup lang="ts">

</script>

<style lang="scss">
    .max-tab {
        background: none;
        border: none;
        border-bottom: 2px solid transparent;
        padding: 0.75rem 1rem;
        cursor: pointer;
        color: var(--text-color, inherit);
        white-space: nowrap;
        transition: color 0.2s ease, border-color 0.2s ease;

        &.max-tab-active {
            border-bottom-color: var(--max-primary-500);
            color: var(--max-primary-500);
        }

        &.max-tab-disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
    }

    @media (prefers-reduced-motion: reduce) {
        .max-tab {
            transition: none;
        }
    }
</style>
