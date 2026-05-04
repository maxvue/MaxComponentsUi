<template>
    <Popover ref="element" :closeOnEscape="true" class="model-popover-main-div" :dismissable="false" v-bind="attrs">
        <div class="content-popover-item">
            <div :class="`close-background ${attrs.noBackground !== undefined ? 'no-bg' : ''} `" style="overflow: hidden;" />
            <div class="content-popover-item-slot" ref="content">
                <slot></slot>
            </div>
        </div>
    </Popover>
</template>

<script setup lang="ts">
    const attrs = useAttrs();

</script>

<style lang="scss">
    .model-popover-main-div {
        .p-popover {
            // border: none !important;
            border-radius: 1rem !important;
            box-shadow: unset !important;
            border: unset !important;
        }

        .model-popover-main-div {
            margin: 0 !important;
        }

        .content-popover-item {
            z-index: 1 !important;

            .content-popover-item-slot {
                position: relative;
                z-index: 99999 !important;
                background-color: var(--background-0) !important;
                width: 100%;
                height: calc(100% + 10px) !important;
                min-width: 100px;
                min-height: 100px;
                border-radius: 0.7rem;
                padding: 1rem;
                box-shadow: 0 0 10px 0 rgb(0 0 0 / 10%);
                border: 1px solid var(--background-200) !important;
            }

            .close-background {
                position: fixed;
                width: 100vw;
                height: 100vh;
                overflow: hidden;
                background-color: rgb(0 0 0);
                opacity: 0;
                z-index: 0 !important;
                transition: opacity 0.3s ease;
                transform: scale(3);

                &.openneds {
                    opacity: 0.3;
                }
            }
        }

        .p-popover-content {
            padding: 0 !important;
            background-color: transparent !important;
            height: 100% !important;
            min-height: 100px !important;
            width: 100% !important;
            border: none;
        }

        .no-bg {
            display: none !important;
        }
    }
</style>
