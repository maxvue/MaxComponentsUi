<template>
    <div v-if="is_open">
        <div class="viewPDF" :style="{opacity: opacity}">
            <div class="space" @click="closePDF" />
            <div class="meio">
                <Transition>
                    <div class="loading" v-if="isLoading" @click="closePDF">
                        <div class="conjunto">
                            <div class="texto">Loading</div>
                            <div class="circle">
                                <MaxBaseSpinner style="width: 50px; height: 50px;" strokeWidth="7" animationDuration=".5s" aria-label="Custom ProgressSpinner" />
                            </div>
                            <div class="percent">{{ percent }}%</div>
                        </div>
                    </div>
                </Transition>

                <div class="pdfDiv">
                    <VuePdfEmbed :annotation-layer="false" :textLayer="false" :source="props.file" :width="size.width" :height="size.height" @rendered="rendered" @loaded="loaded" @progress="progressPdf">
                        <template #before-page="slotProps">
                            <div class="header-page">Página {{ slotProps.page }} de {{ total }}</div>
                        </template>
                    </VuePdfEmbed>
                </div>
            </div>
            <div class="space" @click="closePDF" />
        </div>
        <div class="pdf-div-bar-tools">
            <MaxButton icon="iconamoon:zoom-out-light" flex text @click="Zoom('out')" />
            <MaxButton icon="lucide:zoom-in" flex text @click="Zoom('in')" />
            <MaxButton icon="ic:round-close" flex text @click="closePDF" />
        </div>
    </div>
</template>

/**
 * Componente visualizador de PDF.
 * Exibe um modal em tela cheia com ferramentas de zoom e paginação.
 */
<script setup lang="ts">
    import { useWindowSize } from '@maxvue/max-use';
    import { defineAsyncComponent, ref, watch } from 'vue';
    import MaxBaseSpinner from './base/MaxBaseSpinner.vue';
    import MaxButton from './MaxButton.vue';

    // Async: vue-pdf-embed pesa ~2,6 MB (814 KB gzip) — só carrega quando um PDF é exibido
    const VuePdfEmbed = defineAsyncComponent(() => import('vue-pdf-embed'));

    const { width: screen_width, height: screen_height } = useWindowSize();

    const props = defineProps({
        /** URL ou fonte do arquivo PDF */
        file: { default: '' }
    });

    const size = ref({ width: screen_width.value, height: screen_height.value });
    const Zoom = (value: string) => {
        const amount = 0.05;
        if (value === 'out') size.value.width = size.value.width * (1 - amount);
        else if (value === 'in') size.value.width = size.value.width * (1 + amount);
    };

    const is_open = ref(false);
    const opacity = ref(0);
    const total = ref(0);
    const percent = ref(0);
    const isLoading = ref(true);

    function rendered() {
        isLoading.value = false;
        opacity.value = 0.9;
    }

    function loaded(event: any) {
        total.value = event.numPages;
        opacity.value = 1;
    }

    function progressPdf(event: any) {
        percent.value = Math.round((event.loaded / event.total) * 100);
        if (percent.value > 99) percent.value = 98;
    }

    function closePDF() {
        opacity.value = 0;
        setTimeout(() => {
            is_open.value = false;
        }, 500);
    }

    watch(() => props.file, () => {
        opacity.value = 0;
        isLoading.value = true;
        percent.value = 0;
        total.value = 0;
        is_open.value = true;
    });
</script>

<style scoped lang="scss">
    .viewPDF {
        opacity: 0;
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background-color: rgb(0 0 0 / 90%);
        transition: opacity 0.6s ease;
        overflow: auto;
        display: grid;
        grid-template-columns: 1fr calc(0.6 * 100vw) 1fr;
        place-items: start center;
        backdrop-filter: blur(10px);

        .space {
            width: 100%;
            height: 100%;
        }

        .loading {
            display: grid;
            place-items: center;
            height: 100vh;
            width: 100%;

            .texto {
                color: rgb(255 255 255 / 50%);
            }

            .percent {
                width: 100%;
                text-align: center;
                color: rgb(255 255 255 / 50%);
                transform: translateY(-39px) translateX(-2px);
                font-size: 0.8rem;
            }
        }

        .pdfDiv {
            padding: calc(100vh * 0.05);

            .header-page {
                width: 100%;
                text-align: center;
                padding: 30px 0 10px;
                color: rgb(200 200 200);
            }
        }
    }

    .pdf-div-bar-tools {
        background-color: var(--background-750);
        width: auto;
        height: 60px;
        padding: 0 10px;
        gap: 10px;
        position: fixed;
        top: 30px;
        left: 30px;
        display: grid;
        place-items: center;
        grid-template-columns: 1fr 1fr 1fr;
        border-radius: 10px;
    }

    .v-enter-active,
    .v-leave-active {
        transition: opacity 0.5s ease;
    }

    .v-enter-from,
    .v-leave-to {
        opacity: 0;
    }
</style>
