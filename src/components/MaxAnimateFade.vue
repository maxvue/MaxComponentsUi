<template>
    <Transition name="max-animate-fade" :mode="props.mode" :appear="props.appear">
        <slot v-if="isVisible"></slot>
    </Transition>
</template>

<script setup lang="ts">
    import { computed } from 'vue';

    export interface MaxAnimateFadeProps {
        /** Controla a visibilidade do elemento animado quando embutido */
        show?: boolean;
        /** Duração da transição em segundos ou formato CSS (ex.: 0.3 ou '300ms') */
        duration?: number | string;
        /** Modo da transição Vue ('out-in' | 'in-out' | undefined) */
        mode?: 'out-in' | 'in-out';
        /** Dispara transição na montagem inicial */
        appear?: boolean;
    }

    const props = withDefaults(defineProps<MaxAnimateFadeProps>(), {
        show: undefined,
        duration: '0.2s',
        mode: undefined,
        appear: false
    });

    const isVisible = computed(() => (props.show !== undefined ? Boolean(props.show) : true));

    const duration_css = computed(() => {
        if (typeof props.duration === 'number') return `${props.duration}s`;

        return props.duration || '0.2s';
    });
</script>

<style lang="scss" scoped>
:global(.max-animate-fade-enter-active),
:global(.max-animate-fade-leave-active) {
    transition: opacity v-bind('duration_css') ease;
}

:global(.max-animate-fade-enter-from),
:global(.max-animate-fade-leave-to) {
    opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
    :global(.max-animate-fade-enter-active),
    :global(.max-animate-fade-leave-active) {
        transition: none !important;
    }
}
</style>
