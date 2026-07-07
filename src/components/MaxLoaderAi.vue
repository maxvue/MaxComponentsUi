<!-- LoadingComponent.vue -->
<template>
    <div v-bind="attrs" v-if="attrs.show !== undefined ? attrs.show : true" class="loader-main-div-ai">
        <div class="items">
            <DotLottieVue style="height: 400px; width: 400px;" autoplay loop src="https://lottie.host/c6ad8a06-43b7-4f0e-876e-634d1f4bb58d/o6vjcixeiy.lottie" />
            <div v-if="attrs.label" class="item-label">{{ attrs.label }}</div>

        </div>
        <div class="background-ai"></div>
    </div>
</template>

<script setup lang="ts">
    import { defineAsyncComponent, useAttrs } from 'vue';

    const attrs = useAttrs();

    // Async: dotlottie (player WASM ~1,2 MB) — só carrega quando o loader de IA aparece
    const DotLottieVue = defineAsyncComponent(() => import('@lottiefiles/dotlottie-vue').then((m) => m.DotLottieVue));
</script>

<style lang="scss">
    .loader-main-div-ai {
        height: 100%;
        width: 100%;
        display: grid;
        place-items: center;

        .background-ai {
            position: absolute;
            background-color: var(--background-0);
            opacity: 0.7;
            width: 100%;
            height: 100%;
        }

        .items {
            display: grid;
            place-items: center;
            grid-template-rows: 1fr auto;
            z-index: 1;

            .item-label {
                padding-top: 20px;
                color: var(--background-600);
            }
        }

        .loadScreenInner {
            display: grid;
            place-items: center;
            gap: 20px;
            font-weight: 300 !important;
            color: var(--background-100);
            text-transform: uppercase;
        }

        .icon-div {
            color: white !important;
        }
    }

    .LoadScreen + .container {
        #conteudo {
            filter: blur(2px);
        }
    }
</style>
