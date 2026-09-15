<template>
    <div v-if="is_open" class="max-pdf-view">
        <div
            class="viewPDF"
            ref="el"
            role="dialog"
            aria-modal="true"
            :aria-label="props.title || 'Visualizador de PDF'"
            :style="{opacity: opacity}"
            @keydown="trap.onKeydown"
        >
            <div class="space" aria-hidden="true" @click="closePDF" />
            <div class="meio">
                <Transition>
                    <div class="loading" v-if="isLoading && !hasError" @click="closePDF">
                        <div class="conjunto">
                            <div class="texto">Carregando documento...</div>
                            <div class="circle">
                                <div class="max-spinner" role="status" aria-label="Carregando PDF"></div>
                            </div>
                            <div class="percent">{{ percent }}%</div>
                        </div>
                    </div>
                </Transition>

                <div v-if="hasError" class="pdf-error-state" role="alert">
                    <div class="pdf-error-message">Não foi possível carregar o documento PDF.</div>
                    <div class="pdf-error-actions">
                        <MaxButton class="pdf-retry-btn" label="Tentar novamente" icon="mdi:reload" @click="retryLoadPdf" />
                        <MaxButton v-if="typeof props.file === 'string'" class="pdf-open-link" label="Abrir arquivo" icon="mdi:open-in-new" :text="true" @click="openPdfExternally" />
                    </div>
                </div>

                <div v-show="!hasError" class="pdfDiv">
                    <VuePdfEmbed v-if="is_mounted" :key="pdfKey" :annotation-layer="props.annotationLayer" :textLayer="props.textLayer" :source="props.file" :width="size.width" :height="size.height" @rendered="rendered" @loaded="loaded" @progress="progressPdf" @loading-failed="onLoadingFailed">
                        <template #before-page="slotProps">
                            <div class="header-page" role="heading" :aria-label="`Página ${slotProps.page} de ${total}`">Página {{ slotProps.page }} de {{ total }}</div>
                        </template>
                    </VuePdfEmbed>
                    <div class="pdf-fallback-link sr-only" v-if="typeof props.file === 'string' && props.file">
                        <a :href="props.file" target="_blank" rel="noopener noreferrer">Baixar ou abrir documento PDF externamente</a>
                    </div>
                </div>
            </div>

            <div class="space" aria-hidden="true" @click="closePDF" />

            <div class="pdf-div-bar-tools">
                <MaxButton
                    v-if="props.showDownloadButton && typeof props.file === 'string' && props.file"
                    icon="mdi:download"
                    aria-label="Baixar documento PDF"
                    title="Baixar documento PDF"
                    tabindex="0"
                    :text="true"
                    @click="downloadPdf"
                />
                <MaxButton icon="iconamoon:zoom-out-light" aria-label="Diminuir zoom" tabindex="0" :text="true" @click="Zoom('out')" />
                <MaxButton icon="lucide:zoom-in" aria-label="Aumentar zoom" tabindex="0" :text="true" @click="Zoom('in')" />
                <MaxButton icon="ic:round-close" aria-label="Fechar visualizador de PDF" tabindex="0" :text="true" @click="closePDF" />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    /**
     * Componente visualizador de PDF.
     * Exibe um modal em tela cheia com ferramentas de zoom e paginação.
     */
    import { useWindowSize } from '@maxvue/max-use';
    import { defineAsyncComponent, ref, watch, useTemplateRef, onBeforeUnmount, onMounted } from 'vue';
    import { useFocusTrap } from '../helpers/useFocusTrap';
    import { useScrollLock } from '../helpers/useScrollLock';
    import { useBrowserEventListener } from '../composables/useBrowserEventListener';
    import MaxButton from './MaxButton.vue';

    // Async: vue-pdf-embed pesa ~2,6 MB (814 KB gzip) — só carrega quando um PDF é exibido no cliente
    const VuePdfEmbed = defineAsyncComponent((): Promise<any> => {
        if (typeof window === 'undefined') return Promise.resolve({ render: () => null });
        return import('vue-pdf-embed');
    });

    const { width: screen_width, height: screen_height } = useWindowSize();

    const props = withDefaults(defineProps<{
        /** URL ou fonte do arquivo PDF */
        file?: any;
        /** Se deve habilitar a camada de texto para seleção e leitura acessível */
        textLayer?: boolean;
        /** Se deve habilitar a camada de anotações */
        annotationLayer?: boolean;
        /** Título acessível do documento */
        title?: string;
        /** Se deve exibir o botão de download na barra de ferramentas */
        showDownloadButton?: boolean;
    }>(), {
        file: '',
        textLayer: true,
        annotationLayer: true,
        title: 'Visualizador de PDF',
        showDownloadButton: false
    });

    const downloadPdf = () => {
        if (typeof props.file !== 'string' || !props.file) return;
        const link = document.createElement('a');
        link.href = props.file;
        link.download = props.file.split('/').pop() || 'documento.pdf';
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const el = useTemplateRef<HTMLElement>('el');
    const trap = useFocusTrap(el);
    const scroll_lock = useScrollLock();

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

    let close_timer: ReturnType<typeof setTimeout> | null = null;
    let has_scroll_lock = false;
    const is_mounted = ref(false);

    const onEscape = (event: KeyboardEvent) => {
        if (event.key === 'Escape' && is_open.value) closePDF();
    };

    useBrowserEventListener('keydown', onEscape, is_open);

    onMounted(() => {
        is_mounted.value = true;
        if (is_open.value) {
            trap.activate();
            if (!has_scroll_lock) {
                scroll_lock.lock();
                has_scroll_lock = true;
            }
        }
    });

    watch(is_open, (value) => {
        if (!is_mounted.value) return;
        if (value) {
            trap.activate();
            if (!has_scroll_lock) {
                scroll_lock.lock();
                has_scroll_lock = true;
            }
        } else {
            trap.deactivate();
            if (has_scroll_lock) {
                scroll_lock.unlock();
                has_scroll_lock = false;
            }
        }
    }, { immediate: true });

    onBeforeUnmount(() => {
        if (close_timer !== null) {
            clearTimeout(close_timer);
            close_timer = null;
        }
        trap.deactivate();
        if (has_scroll_lock) {
            scroll_lock.unlock();
            has_scroll_lock = false;
        }
    });

    const hasError = ref(false);
    const pdfKey = ref(0);

    function rendered() {
        isLoading.value = false;
        hasError.value = false;
        opacity.value = 0.9;
    }

    function loaded(event: { numPages: number }) {
        total.value = event.numPages;
        opacity.value = 1;
    }

    function progressPdf(event: { loaded: number; total: number }) {
        percent.value = Math.round((event.loaded / event.total) * 100);
        if (percent.value > 99) percent.value = 98;
    }

    function onLoadingFailed(err: any) {
        isLoading.value = false;
        hasError.value = true;
        console.error('[MaxPdfView] Falha ao carregar documento PDF:', err);
    }

    function retryLoadPdf() {
        hasError.value = false;
        isLoading.value = true;
        percent.value = 0;
        pdfKey.value++;
    }

    function openPdfExternally() {
        if (typeof props.file === 'string' && typeof window !== 'undefined') window.open(props.file, '_blank', 'noopener,noreferrer');

    }

    function closePDF() {
        opacity.value = 0;
        if (close_timer !== null) clearTimeout(close_timer);
        close_timer = setTimeout(() => {
            is_open.value = false;
            close_timer = null;
        }, 500);
    }


    watch(() => props.file, (newFile) => {
        if (!newFile) return;
        if (close_timer !== null) {
            clearTimeout(close_timer);
            close_timer = null;
        }
        opacity.value = 0;
        isLoading.value = true;
        percent.value = 0;
        total.value = 0;
        is_open.value = true;
    }, { immediate: true });

    defineExpose({
        hasError,
        isLoading,
        retryLoadPdf,
        openPdfExternally,
        closePDF,
        Zoom,
        onLoadingFailed
    });
</script>

<style lang="scss" scoped>
    .viewPDF {
        opacity: 0;
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        height: 100dvh;
        z-index: var(--max-z-index-fullscreen, var(--max-layer-fullscreen, 1400));
        box-sizing: border-box;
        background-color: rgb(0 0 0 / 90%);
        transition: opacity 0.6s ease;
        overflow: auto;
        display: grid;
        grid-template-columns: minmax(0, 1fr) min(1200px, calc(100vw - 32px)) minmax(0, 1fr);
        place-items: start center;
        backdrop-filter: blur(10px);
        padding: max(8px, env(safe-area-inset-top, 0px)) max(8px, env(safe-area-inset-right, 0px)) max(8px, env(safe-area-inset-bottom, 0px)) max(8px, env(safe-area-inset-left, 0px));

        .space {
            width: 100%;
            height: 100%;
        }

        .meio {
            width: 100%;
            max-width: min(1200px, calc(100vw - 32px));
            display: flex;
            flex-direction: column;
            align-items: center;
        }

        .loading {
            display: grid;
            place-items: center;
            min-height: 60vh;
            width: 100%;

            .texto {
                color: rgb(255 255 255 / 50%);
            }

            .circle {
                display: grid;
                place-items: center;

                .max-spinner {
                    width: 50px;
                    height: 50px;
                    border: 7px solid rgb(255 255 255 / 20%);
                    border-top-color: rgb(255 255 255 / 90%);
                    border-radius: 50%;
                    animation: max-spinner-rotate 0.5s linear infinite;
                }
            }

            .percent {
                width: 100%;
                text-align: center;
                color: rgb(255 255 255 / 50%);
                transform: translateY(-39px) translateX(-2px);
                font-size: 0.8rem;
            }
        }

        .pdf-error-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 1.25rem;
            padding: 3rem 1.5rem;
            color: var(--background-0, #fff);
            text-align: center;
            z-index: 10;

            .pdf-error-message {
                font-size: 1.1rem;
                font-weight: 500;
            }

            .pdf-error-actions {
                display: flex;
                gap: 0.75rem;
                align-items: center;
                flex-wrap: wrap;
                justify-content: center;
            }
        }

        .pdfDiv {
            padding: clamp(12px, 3vh, 32px) 0;
            width: 100%;
            box-sizing: border-box;

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
        max-width: calc(100vw - max(16px, env(safe-area-inset-left, 0px)) - max(16px, env(safe-area-inset-right, 0px)) - 16px);
        box-sizing: border-box;
        min-height: 44px;
        padding: 6px 10px;
        gap: 8px;
        position: fixed;
        top: max(16px, env(safe-area-inset-top, 0px));
        left: max(16px, env(safe-area-inset-left, 0px));
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: center;
        border-radius: 10px;
        z-index: calc(var(--max-z-index-fullscreen, var(--max-layer-fullscreen, 1400)) + 1);
        box-shadow: 0 4px 12px rgb(0 0 0 / 25%);

        :deep(.max-button) {
            display: flex;
            min-width: 36px;
            min-height: 36px;
        }
    }

    .v-enter-active,
    .v-leave-active {
        transition: opacity 0.5s ease;
    }

    .v-enter-from,
    .v-leave-to {
        opacity: 0;
    }

    @keyframes max-spinner-rotate {
        from {
            transform: rotate(0deg);
        }

        to {
            transform: rotate(360deg);
        }
    }

    @media (prefers-reduced-motion: reduce) {
        .max-spinner-rotate {
            animation-duration: 4s;
        }
    }
</style>
