<template>
    <div :class="`icon-div ico-btn ${hover ? 'hover' : ''}`" ref="icon_ref" :style="{width: size, height: size, transform: 'scale('+ (hover? props.hoverScale : 1) +')'}" @click="onClick" @mouseenter="hover = true" @mouseleave="hover = false">
        <slot>
            <MaxIcon pointer :icon="props.icon" :i="props.i" :dark="props.dark" :light="props.light" :checked="props.checked" :plus="props.plus" :rotate="props.rotate" :flip="props.flip" :size="size" />
        </slot>
    </div>
</template>

<script setup lang="ts">
    import { computed, ref, useAttrs } from 'vue';
    import MaxIcon from './MaxIcon.vue';
    import { goToRoute, useDefaultReset } from '@maxvue/max-use';
    import type { MaxButtonsType } from '../types';

    const attrs = useAttrs();

    const hover = ref(false);

    const props = withDefaults(defineProps<MaxButtonsType>(), { data: {}, params: {}, query: {}, hoverScale: 1.2 });

    const data = computed(() => ({ ...(props.data ?? {}), ...(props.query ?? {}), ...(props.params ?? {}) }));

    const size = computed(() => 16 * Number(props.size ?? 1) + 'px');

    const emit = defineEmits<{
        action: [value: boolean];
    }>();

    const executing = ref(false);

    const onClick = async (event: MouseEvent) => {
        if (executing.value) return;
        executing.value = true;
        try {
            if (props.route) {
                goToRoute(props.route, data.value);
                return;
            }

            if (props.action) {
                await props.action({ event: event, data: data.value });
                return;
            }

            emit('action', true);
        } finally {
            executing.value = false;
        }
    };
</script>

<style lang="scss">
    .icon-div {
        display: grid;
        place-items: center;
        width: auto;
        height: 100%;
        max-width: 100%;
        max-height: 100%;
        transition: transform 0.3s ease, color 0.2s ease-in-out;
        position: relative;
    }
</style>
