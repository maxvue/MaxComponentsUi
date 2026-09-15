<!-- LoadingComponent.vue -->
<template>
    <div
        v-if="isVisible"
        class="max-loader-ai loader-main-div-ai"
        v-bind="resolvedAttrs"
    >
        <div class="items">
            <DotLottieVue style="height: 400px; width: 400px;" autoplay loop src="https://lottie.host/c6ad8a06-43b7-4f0e-876e-634d1f4bb58d/o6vjcixeiy.lottie" />
            <div v-if="attrs.label" class="item-label">{{ attrs.label }}</div>
        </div>
        <div class="background-ai"></div>
    </div>
</template>

<script setup lang="ts">
    import { computed, defineAsyncComponent, useAttrs } from 'vue';

    defineOptions({
        inheritAttrs: false
    });

    const attrs = useAttrs();

    const isVisible = computed(() => {
        if (attrs.show === false || attrs.show === 'false') return false;
        return true;
    });

    const resolvedAttrs = computed(() => {
        const { show: _show, ...rest } = attrs;
        const defaults: Record<string, any> = {
            'role': 'status',
            'aria-live': 'polite',
            'aria-busy': 'true'
        };
        if (attrs.label && !attrs['aria-label']) defaults['aria-label'] = String(attrs.label);

        return {
            ...defaults,
            ...rest
        };
    });

    // Async: dotlottie (player WASM ~1,2 MB) — só carrega quando o loader de IA aparece
    const DotLottieVue = defineAsyncComponent(() => import('@lottiefiles/dotlottie-vue').then((m) => m.DotLottieVue));
</script>

<style lang="scss" scoped>
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
                color: var(--background-700);
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
            color: var(--background-775);
        }
    }

    :global(.LoadScreen + .container #conteudo) {
        filter: blur(2px);
    }
</style>
