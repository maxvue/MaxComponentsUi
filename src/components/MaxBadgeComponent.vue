<template>
    <div :class="`badge-component-main-div ${attrs.size ?? ''}`">
        <Icon v-if="attrs.icon" :i="attrs.icon" class="icon-badge" v-bind="attrs" size="1.1" />
        <Badge v-bind="attrs" :value="(attrs.label ?? attrs.msg ?? attrs.value ?? attrs.mensagem ?? attrs.text ?? attrs.txt ?? attrs.number) as any" v-if="attrs.overlay === undefined" :class="`${attrs.icon || attrs['icon-color'] || attrs['iconcolor'] || attrs['iconColor'] ? 'with-icon' : ''} ${attrs.iconValue || attrs['icon-value'] || attrs['icon-value'] ? 'with-icon-value' : ''}`" ref="badgeElem" />
        <OverlayBadge v-bind="attrs" v-else ref="badge" />
        <div class="circle-color-badge">
            <div :style="{ background: (attrs['icon-color'] ?? attrs['iconcolor'] ?? attrs['iconColor'] ?? 'none') as string }" class="circle-color-badge-text">
                {{ attrs['icon-value'] ?? '' }}
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { ref, onMounted, useAttrs } from 'vue';
    import Badge from 'primevue/badge';
    import OverlayBadge from 'primevue/overlaybadge';
    const attrs = useAttrs();
    const badgeElem = ref(null);

    onMounted(() => {
        if (badgeElem.value) {
            if (attrs['background'] || attrs['background-color'] || attrs['backgroundColor']) (badgeElem.value as any).$el.style.backgroundColor = attrs['background'] ?? attrs['background-color'] ?? attrs['backgroundColor'];

            if (attrs['font-color'] || attrs['fontcolor'] || attrs['fontColor']) (badgeElem.value as any).$el.style.color = attrs['font-color'] ?? attrs['fontcolor'] ?? attrs['fontColor'];

        }
    });
</script>

<style lang="scss">
    .badge-component-main-div {
        position: relative;
        display: grid;
        place-items: center start;
        grid-template-columns: auto 1fr;

        .p-badge {
            font-size: 0.6rem;
            font-weight: 500;
            height: 22.5px;
            text-transform: uppercase;
            display: grid;
            place-items: center;

            &.p-badge-lg {
                font-size: 0.65rem;
                font-weight: 500;
                padding: 2px 8px 0;
                height: 23px;

                &.with-icon {
                    padding-left: 25px;
                }

                &.with-icon-value {
                    padding-left: 28px !important;
                }
            }

            &.p-badge-xl {
                font-size: 0.6rem;
                font-weight: 500;
                padding: 0 6px;
                height: 20px;

                &.with-icon {
                    padding-left: 23px;
                }

                &.with-icon-value {
                    padding-left: 25px;
                }
            }

            &.with-icon, &.with-icon-value {
                padding-left: 26px;
            }
        }

        .icon-badge {
            position: absolute;
            width: 16px;
            height: 16px;
            left: 3px;
            color: var(--background-0) !important;
        }

        .circle-color-badge {
            position: absolute;
            top: 1px;
            left: 0;
            width: 21px;
            height: 100%;
            border-radius: 3px;
            display: grid;
            place-items: center;

            .circle-color-badge-text {
                width: 14px;
                height: 14px;
                border-radius: 6px;
                display: grid;
                place-items: center;
                font-size: 9px;
                color: white;
            }
        }
    }
</style>
