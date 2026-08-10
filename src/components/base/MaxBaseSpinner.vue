<template>
    <div class="max-base-spinner" role="progressbar" aria-busy="true" :aria-label="ariaLabel">
        <svg class="max-base-spinner-spin" viewBox="25 25 50 50" :style="{ animationDuration }">
            <circle
                class="max-base-spinner-circle"
                cx="50" cy="50" r="20"
                :fill="fill"
                :stroke-width="strokeWidth"
                stroke-miterlimit="10"
            />
        </svg>
    </div>
</template>

<script setup lang="ts">
    withDefaults(
        defineProps<{
            strokeWidth?: string;
            fill?: string;
            animationDuration?: string;
            ariaLabel?: string;
        }>(),
        { strokeWidth: '2', fill: 'none', animationDuration: '2s', ariaLabel: 'Carregando' }
    );
</script>

<style lang="scss" scoped>
    .max-base-spinner {
        position: relative;
        display: inline-block;
        width: 100px;
        height: 100px;

        .max-base-spinner-spin {
            width: 100%;
            height: 100%;
            transform-origin: center center;
            animation: max-base-spinner-rotate 2s linear infinite;
        }

        .max-base-spinner-circle {
            stroke-dasharray: 89, 200;
            stroke-dashoffset: 0;
            stroke: var(--max-primary-500);
            animation: max-base-spinner-dash 1.5s ease-in-out infinite;
            stroke-linecap: round;
        }
    }

    @keyframes max-base-spinner-rotate {
        100% { transform: rotate(360deg); }
    }

    @keyframes max-base-spinner-dash {
        0% { stroke-dasharray: 1, 200;   stroke-dashoffset: 0; }
        50% { stroke-dasharray: 89, 200;  stroke-dashoffset: -35px; }
        100% { stroke-dasharray: 89, 200;  stroke-dashoffset: -124px; }
    }

    @media (prefers-reduced-motion: reduce) {
        .max-base-spinner .max-base-spinner-spin,
        .max-base-spinner .max-base-spinner-circle {
            animation-duration: 4s;
        }
    }
</style>
