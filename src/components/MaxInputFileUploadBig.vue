<template>
    <div ref="drop_zone_ref" :class="`input-upload-file-big-main-div ${isOverDropZone ? 'in-drop' : 'not-in-drop'}`" @click="onAreaClick" >
        <!-- Área principal clicável -->
        <div class="upload-area" v-if="!uploading && !showError">
            <slot>
                <MaxIcon i="lets-icons:upload-light" size="3" />
                <div v-if="label" v-html="label"></div>
            </slot>
        </div>

        <!-- Estado de upload em progresso -->
        <div v-else-if="uploading" class="upload-state">
            <slot name="uploading">
                <div class="screen-animation">
                    <DotLottieVue style="height: 300px; width: 300px;" background="red" autoplay loop src="https://lottie.host/1c897063-7dec-4b92-b8db-ecd2cd67f48e/ofrND79jXr.lottie" />
                </div>
            </slot>
        </div>

        <!-- Estado de erro -->
        <div v-else-if="showError" class="upload-state">
            <slot name="error">
                <div class="screen-animation">
                    <DotLottieVue style="height: 300px; width: 300px;" background="red" autoplay src="https://lottie.host/b1aebee5-5e8b-4008-acd5-fc651795bbf6/ghW5oHG5ml.lottie" />
                    <div class="screen-animation-label">
                        Erro ao enviar o arquivo.
                    </div>
                </div>
            </slot>
        </div>
    </div>
</template>
<script setup lang="ts">
    import { defineAsyncComponent, ref, watch } from 'vue';
    import { useFileDialog, useDropZone } from '@maxvue/max-use';
    import MaxIcon from './MaxIcon.vue';

    // Async: dotlottie (player WASM ~1,2 MB) — só carrega quando a animação de upload aparece
    const DotLottieVue = defineAsyncComponent(() => import('@lottiefiles/dotlottie-vue').then((m) => m.DotLottieVue));

    const props = withDefaults(defineProps<{
        /** Tipos de arquivo aceitos (ex: '.pdf, .jpg, .png') */
        accept?: string;
        /** Permitir múltiplos arquivos */
        multiple?: boolean;
        /** Desabilitar o componente */
        disabled?: boolean;
        /** Rótulo descritivo */
        label?: string;
        /** Callback chamado ao selecionar arquivos */
        onSelect?: (event: { files: File[] }) => void;
        /** Callback chamado após upload concluído */
        onUpload?: () => void;
        /** Indicar externamente que está em upload */
        uploading?: boolean;
    }>(), {
        accept: '.pdf, .jpg, .jpeg, .png, .doc, .docx',
        multiple: true,
        disabled: false,
        label: '',
        uploading: false
    });

    const showError = ref(false);
    const drop_zone_ref = ref<HTMLElement | null>(null);

    watch(showError, (val) => {
        if (val) setTimeout(() => { showError.value = false; }, 3000);

    });

    // Configura o drop zone para arrastar e soltar arquivos
    const { isOverDropZone } = useDropZone(drop_zone_ref as any, {
        onDrop: onFilesDropped,
        multiple: true,
        preventDefaultForUnhandled: false
    });

    // Configura o file dialog para selecionar arquivos via clique
    const { open, reset, onChange } = useFileDialog({
        accept: props.accept,
        multiple: props.multiple,
        directory: false
    });

    // Quando arquivos são selecionados via file dialog
    onChange((fileList: FileList | null) => {
        if (fileList && fileList.length > 0) {
            const filesArray = Array.from(fileList);
            handleFiles(filesArray);
            reset();
        }
    });

    /** Processa os arquivos selecionados ou arrastados */
    function handleFiles(files: File[]) {
        if (props.onSelect) props.onSelect({ files });

    }

    /** Callback quando arquivos são soltos na drop zone */
    function onFilesDropped(files: File[] | null) {
        if (props.disabled || !files || files.length === 0) return;
        handleFiles(files);
    }

    /** Abre o file dialog ao clicar na área */
    function onAreaClick() {
        if (!props.disabled) open();

    }
</script>
<style lang="scss">
    .input-upload-file-big-main-div {
        height: 100%;
        width: 100%;
        border-radius: calc(1rem - 5px);
        outline: 1px dashed var(--background-600);
        background-color: var(--background-0);
        position: relative;
        cursor: pointer;
        display: grid;
        place-items: center;
        transition: outline-color 0.2s, background-color 0.2s;

        &.not-in-drop {
            &:hover {
                outline: 2px dashed var(--blue-700);

                .upload-area {
                    .max-icon, .label-file-upload {
                        color: var(--blue-700) !important;
                    }
                }
            }
        }

        &.in-drop {
            outline: 3px dashed var(--blue-700);
            background-color: var(--background-100);
        }

        .upload-area {
            display: grid;
            place-items: center;
            text-align: center;
            gap: 10px;
            color: var(--background-600);
            font-size: 1rem;
            font-weight: 300;
            width: 100%;
            height: 100%;
            padding: 1rem;
        }

        .upload-state {
            display: grid;
            place-items: center;
            width: 100%;
            height: 100%;
        }

        .screen-animation {
            display: grid;
            place-items: center;

            .screen-animation-label {
                font-size: 1.2rem;
                font-weight: 500;
                color: var(--red-600);
            }
        }
    }
</style>
