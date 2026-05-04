<template>
    <div class="empty-main-div">
        <div class="inner">
            <slot>
                <slot name="icon">
                    <Icon :icon="attrs.icon ?? 'ph:empty'" :size="attrs.iconSize ?? 2" />
                </slot>
                <slot name="label">
                    <div v-html="attrs.label" v-if="attrs.label" />
                </slot>
            </slot>

        </div>
    </div>
</template>

<script setup lang="ts">
    const attrs = useAttrs();
</script>

<style scoped lang="scss">
    .empty-main-div {
        background-color: var(--background-100);
        width: 100%;
        height: 100%;
        border-radius: 0.7rem;
        display: grid;
        place-items: center;
        color: var(--background-500);
        border: 1px solid var(--background-200);

        &[transparent] {
            background-color: transparent !important;
            border: none !important;
        }

        &[nospace] {
            position: absolute;
            top: 0;
            left: 0;
        }

        .inner {
            display: grid;
            place-items: center;
            text-align: center;
            gap: 1.5rem;

            .icon-div {
                position: relative;
                color: var(--background-500);
            }
        }
    }
</style>
