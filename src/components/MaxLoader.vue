<template>
    <div v-if="isVisible" class="max-loader-main-div">
        <div class="items">
            <MaxLoaderIcon />
            <div v-if="props.label" class="item-label">{{ props.label }}</div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { computed } from 'vue';
    import MaxLoaderIcon from './MaxLoaderIcon.vue';

    export interface MaxLoaderProps {
        /** Controla a visibilidade do loader */
        show?: boolean | string;
        /** Rótulo textual opcional exibido abaixo da animação */
        label?: string;
    }

    const props = withDefaults(defineProps<MaxLoaderProps>(), {
        show: true,
        label: undefined
    });

    const isVisible = computed(() => {
        if (props.show === false || props.show === 'false') return false;
        return Boolean(props.show);
    });
</script>

<style lang="scss" scoped>
    .max-loader-main-div {
        height: 100%;
        width: 100%;
        display: grid;
        place-items: center;
        color: var(--max-primary-500) !important;
        background-color: var(--background-0);

        .items {
            display: grid;
            place-items: center;
            grid-template-rows: 1fr auto;
            color: var(--background-700);

            .item-label {
                padding-top: 20px;
                color: var(--background-650);
            }
        }
    }
</style>
