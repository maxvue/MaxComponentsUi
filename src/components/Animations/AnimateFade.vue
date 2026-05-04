<template>
    <AnimatePresence multiple :mode="'wait'">
        <Motion as="div" :initial="{ opacity: 0 }" :animate="{ opacity: 1 }" :exit="{ opacity: 0 }" v-if="props.show" :transition="{ duration: Number(props.duration ?? 0.15), ease: 'easeInOut' }">
            <slot></slot>
        </Motion>
        <Motion as="div" :initial="{ opacity: 0 }" :animate="{ opacity: 1 }" :exit="{ opacity: 0 }" v-else-if="!props.show && props.loading === true" :transition="{ duration: Number(props.duration ?? 0.15), ease: 'easeInOut' }" flex>
            <Loader absolute flex :style="{ backgroundColor: props.transparent === true ? 'transparent' : '' }" :label="props.label ?? null" />
        </Motion>
        <Motion as="div" :initial="{ opacity: 0 }" :animate="{ opacity: 1 }" :exit="{ opacity: 0 }" v-else-if="!props.show && props.error === true" :transition="{ duration: Number(props.duration ?? 0.15), ease: 'easeInOut' }" flex grid-center>
            <div grid center>
                <Icon :i="props.errorIcon ?? 'wordpress:caution'" size="4" v-if="props.errorIcon"/>
                <div style="color: var(--background-650);">
                    {{ props.errorMessage }}
                </div>
            </div>
        </Motion>
    </AnimatePresence>
</template>

<script setup lang="ts">
    import { AnimatePresence } from 'motion-v';
    import { Motion } from 'motion-v';

    const props = withDefaults(defineProps<{
        duration?: number;
        show?: boolean;
        loading?: boolean;
        label?: string;
        loadingIcon?: string;
        error?: boolean;
        errorIcon?: string;
        errorMessage?: string;
        errorMsg?: string;
        showTooltip?: boolean;
        transparent?: boolean;
    }>(), {
        showTooltip: true
    });
</script>
