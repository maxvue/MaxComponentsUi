<template>
    <Transition name="slide-vertical-animation">
        <slot></slot>
    </Transition>
</template>

<script setup lang="ts">
</script>

<style>
    .slide-vertical-animation-enter-active {
        animation: slide-up-in 0.3s ease-out forwards;
    }

    .slide-vertical-animation-leave-active {
        animation: slide-down-out 0.3s ease-in forwards;
    }

    @keyframes slide-up-in {
        from {
            opacity: 0;
            transform: translateY(150px); /* Começa abaixo */
        }

        to {
            opacity: 1;
            transform: translateY(0); /* Sobe para a posição normal */
        }
    }

    @keyframes slide-down-out {
        from {
            opacity: 1;
            transform: translateY(0); /* Começa na posição normal */
        }

        to {
            opacity: 0;
            transform: translateY(150px); /* Desce para desaparecer */
        }
    }
</style>
