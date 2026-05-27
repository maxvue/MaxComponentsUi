<template>
    <div v-bind="{...props, ...attrs}" :class="`icon-div ico-btn ${hover ? 'hover' : ''}`" ref="icon_ref" :style="{width: size, height: size, transform: 'scale('+ (hover? 1.1 : 1) +')' : 'scale(1)'}" @click="props.action ? props.action({event: $event, data: data}) : onClick" @mouseenter="hover = true" @mouseleave="hover = false">
        <slot>
            <MaxIcon pointer v-bind="{...props, ...attrs}" :size="size" :light="props.light" :dark="props.dark ?? 0.4" />
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

    const props = withDefaults(defineProps<MaxButtonsType>(), { data: {}, params: {}, query: {}, class: {}, hoverScale: 1.1 });

    const data = computed(() => ({ ...(props.data ?? {}), ...(props.query ?? {}), ...(props.params ?? {}) }));

    const size = computed(() => 16 * Number(props.size ?? 1) + 'px');

    const emit = defineEmits<{
        action: [value: boolean];
    }>();

    const executing = useDefaultReset<boolean>(false, 200);

    const onClick = (event: any) => {
        if (! executing.value) {
            executing.value = true;

            if (props.route) {
                goToRoute(props.route, { ...(props.params ?? {}), ...(props.data ?? {}), ...(props.query ?? {}) });
                return;
            }

            if (props.action) {
                props.action({ event: event, data: data.value });
                return;
            }

            emit('action', true);
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
