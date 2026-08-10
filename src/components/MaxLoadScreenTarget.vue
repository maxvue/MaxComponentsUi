<template>
    <div v-if="isMounted && size(props.target.items ?? {}) > 0" class="max-load-screen-target">
        <Teleport :to="props.target.target" :disabled="!isMounted">
            <div v-if="size(props.target.items ?? {}) > 0" class="load-screen">
                <slot>
                    <div class="load-screen-messages">
                        <div v-for="(item, index) in props.target.items" :key="index" class="load-screen-message-item" :index="index">
                            <DotLottieVue v-if="item.lottie_icon" style="height: 400px; width: 400px;" autoplay loop :src="item.lottie_icon" />
                            <MaxIcon v-if="item.icon" :icon="item.icon" :size="item.icon_size ?? 3" color-white-0 />
                            <MaxLoaderIcon v-if="item.status === 'loading'" style="width: 24px; height: 24px;" />
                            <MaxDoneIcon v-else-if="item.status === 'done'" i="material-symbols:check-circle-outline-rounded" size="1.5" />
                            <MaxWaitIcon v-else-if="item.status === 'waiting'" i="eos-icons:hourglass" color-background-0 size="1.5" />
                            <MaxErrorIcon v-else-if="item.status === 'error'" i="mdi:error" size="1.5" />
                            <MaxIcon v-else i="fluent:border-none-24-filled" color-green-300 size="1.5" />
                            <div>
                                {{ item.message }}
                            </div>
                        </div>
                    </div>
                </slot>
            </div>
        </Teleport>
    </div>
</template>

<script setup lang="ts">
    import { ref, onMounted, defineAsyncComponent } from 'vue';
    import { size } from '@maxvue/max-use';
    import MaxIcon from './MaxIcon.vue';
    import MaxDoneIcon from './MaxDoneIcon.vue';
    import MaxWaitIcon from './MaxWaitIcon.vue';
    import MaxErrorIcon from './MaxErrorIcon.vue';
    import MaxLoaderIcon from './MaxLoaderIcon.vue';
    import type { LoadingTarget } from '../types/app';

    // Async: o dotlottie (~1,2 MB) só é carregado quando um item traz lottie_icon.
    const DotLottieVue = defineAsyncComponent(() => import('@lottiefiles/dotlottie-vue').then((m) => m.DotLottieVue));

    const props = defineProps<{
        /** Alvo de renderização com seus itens de carregamento. */
        target: LoadingTarget;
    }>();

    /**
     * O Teleport só pode resolver o seletor de destino depois da montagem;
     * antes disso o conteúdo permanece oculto.
     */
    const isMounted = ref(false);

    onMounted(() => isMounted.value = true);
</script>

<style lang="scss">
    .load-screen {
        position: absolute;
        top: 0;
        left: 0;
        display: grid;
        width: 100%;
        height: 100%;
        backdrop-filter: blur(4px);
        place-items: center;
        z-index: 999999 !important;

        &::after {
            content: '';
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background-color: rgb(0 0 0 / 10%);
            z-index: 2 !important;
        }

        .load-screen-messages {
            display: flex;
            flex-direction: column;
            gap: 10px;
            min-width: 500px;
            padding: 1rem;
            border: 2px solid rgb(0 0 0 / 10%);
            border-radius: 1rem;
            background-color: rgb(255 255 255 / 65%);
            z-index: 10000 !important;

            .load-screen-message-item {
                display: grid;
                grid-template-columns: 20px 1fr;
                gap: 1rem;
                color: var(--background-700);
                place-items: center start;
            }
        }
    }

    .max-load-screen-target {
        width: 100%;
        height: 100%;
    }
</style>
