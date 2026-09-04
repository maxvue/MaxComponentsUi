<template>
    <div class="max-empty-div">
        <div class="inner">
            <slot>
                <slot name="icon">
                    <MaxIcon :icon="String(attrs.icon ?? attrs.i ?? 'ph:empty')" :size="Number(attrs.iconSize ?? 2)" />
                </slot>
                <slot name="label">
                    <div v-html="sanitizedLabel" class="label" />
                </slot>
            </slot>

        </div>
    </div>
</template>

<script setup lang="ts">
    import { computed, useAttrs } from 'vue';
    import MaxIcon from './MaxIcon.vue';
    import { sanitizeHtml } from '../helpers/sanitizeHtml';

    const attrs = useAttrs();
    const sanitizedLabel = computed(() => {
        const raw = attrs.label ?? 'Sem Registros';
        return sanitizeHtml(String(raw));
    });
</script>

<style scoped lang="scss">
    .max-empty-div {
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
            gap: 10px;

            .icon-div {
                position: relative;
                color: var(--background-500);
            }
        }
    }
</style>
