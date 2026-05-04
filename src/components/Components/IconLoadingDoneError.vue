<template>
    <div class="icon-loading-done-error-main-div">
        <div v-if="attrs.status === 'done'" class="icon-div-popover">
            <lord-icon src="https://cdn.lordicon.com/qgtkfluv.json" trigger="in" stroke="light" state="in-reveal" colors="primary:#005f77,secondary:#3DA33D" :style="`width: ${size}px;height:${size}px`"></lord-icon>
        </div>
        <div v-else-if="attrs.status === 'error'" class="icons">
            <lord-icon src="https://cdn.lordicon.com/lmofuouh.json" trigger="in" stroke="light" state="in-reveal" colors="primary:#005f77,secondary:#a02f37" :style="`width: ${size}px;height:${size}px`"></lord-icon>
        </div>
        <div :class="`icons loading ${classe}`">
            <lord-icon src="https://cdn.lordicon.com/mtuudzxm.json" trigger="loop" delay="0" stroke="light" colors="primary:#005f77,secondary:#005f77" :style="`width: ${size}px;height:${size}px`"></lord-icon>
        </div>
    </div>
</template>

<script setup lang="ts">
    const attrs = useAttrs();
    const classe = computed(() => (attrs.status !== 'done' && attrs.status !== 'error' ? '' : 'mini'));
    const size = computed(() => attrs.width || attrs.height || attrs.size || 250);
</script>

<style lang="scss">
    .icon-loading-done-error-main-div {
        position: relative;

        .icons {
            width: 100%;
            height: 100%;
            display: grid;
            place-items: center;

            &.loading {
                transition: transform 0.1s;
                transform-origin: center;
                transform: scale(1);

                &.mini {
                    position: absolute;
                    top: 0;
                    left: 0;
                    transform-origin: center;
                    transform: scale(0.0001);
                }
            }
        }
    }
</style>
