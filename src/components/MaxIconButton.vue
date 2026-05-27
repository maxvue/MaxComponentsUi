<template>
    <div v-bind="{...props, ...attrs}" class="icon-div ico-btn" ref="icon_ref" :style="{width: size, height: size}" :class="attrs.class ?? {}" @click.stop="props.action?.({event: $event, data: data}) ?? onClick">
        <slot>
            <MaxIcon pointer v-bind="{...props, ...attrs}" :size="size" :light="props.light" :dark="props.dark ?? 0.4" />
        </slot>
    </div>
</template>

<script setup lang="ts">
    import { computed, useAttrs } from 'vue';
    import MaxIcon from './MaxIcon.vue';
    import { goToRoute, useDefaultReset } from '@maxvue/max-use';
    import type { MaxButtonsType } from '../types';

    const attrs = useAttrs();

    const props = withDefaults(defineProps<MaxButtonsType>(), { data: {}, params: {}, query: {} });

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


        &.ico-btn {
            &:hover {
                transform: scale(1.3) !important;
            }
        }
    }
</style>
