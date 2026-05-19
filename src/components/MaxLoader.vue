<template>
    <div v-bind="attrs" v-if="attrs.show !== undefined ? attrs.show : true" class="max-loader-main-div">
        <div class="items">
            <LoaderIcon />
            <div v-if="attrs.label" class="item-label">{{ attrs.label }}</div>
        </div>
    </div>
</template>

<script setup lang="ts" vapor>
    import { useAttrs } from 'vue';

    const attrs: any = useAttrs();
</script>

<style lang="scss">
    .max-loader-main-div {
        height: 100%;
        width: 100%;
        display: grid;
        place-items: center;
        color: blue !important;
        background-color: var(--background-0);

        .items {
            display: grid;
            place-items: center;
            grid-template-rows: 1fr auto;
            color: var(--background-700);

            .item-label {
                padding-top: 20px;
                color: var(--background-600);
            }
        }
    }
</style>
