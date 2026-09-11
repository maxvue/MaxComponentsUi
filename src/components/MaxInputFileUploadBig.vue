<template>
    <div
        ref="drop_zone_ref"
        class="max-input-file-upload-big input-upload-file-big-main-div"
        :class="[
            isOverDropZone ? 'in-drop' : 'not-in-drop',
            props.disabled ? 'is-disabled' : ''
        ]"
        role="button"
        :tabindex="props.disabled ? -1 : 0"
        :aria-label="ariaLabelComputed"
        :aria-disabled="props.disabled ? 'true' : undefined"
        @click="onAreaClick"
        @keydown.enter.prevent="onAreaClick"
        @keydown.space.prevent="onAreaClick"
    >
        <!-- Área principal clicável -->
        <div class="upload-area" v-if="!uploading && !showError">
            <slot>
                <MaxIcon i="lets-icons:upload-light" size="3" />
                <div v-if="label">{{ label }}</div>
            </slot>
        </div>

        <!-- Estado de upload em progresso -->
        <div v-else-if="uploading" class="upload-state upload-loading-state">
            <slot name="uploading">
                <div class="screen-animation">
                    <MaxIcon icon="eos-icons:bubble-loading" size="4" class="upload-spinner" />
                    <div class="screen-animation-label">Enviando arquivos...</div>
                </div>
            </slot>
        </div>

        <!-- Estado de erro -->
        <div v-else-if="showError" class="upload-state upload-error-state" role="alert" @click.stop>
            <slot name="error">
                <div class="screen-animation">
                    <MaxIcon icon="solar:danger-triangle-bold" size="3.5" class="error-icon" />
                    <div class="screen-animation-label">
                        {{ errorMessage || 'Erro ao enviar o arquivo.' }}
                    </div>
                    <div class="screen-animation-actions">
                        <MaxButton label="Tentar novamente" size="small" variant="outlined" @click.stop="retryUpload" />
                        <MaxButton label="Descartar" size="small" text @click.stop="dismissError" />
                    </div>
                </div>
            </slot>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { ref, computed } from 'vue';
    import { useFileDialog, useDropZone } from '@maxvue/max-use';
    import MaxIcon from './MaxIcon.vue';
    import MaxButton from './MaxButton.vue';

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
        /** Mensagem descritiva de erro */
        errorMessage?: string;
    }>(), {
        accept: '.pdf, .jpg, .jpeg, .png, .doc, .docx',
        multiple: true,
        disabled: false,
        label: '',
        uploading: false,
        errorMessage: ''
    });

    const emit = defineEmits<{
        'retry': [];
        'dismiss-error': [];
    }>();

    const showError = ref(false);
    const lastFiles = ref<File[]>([]);
    const drop_zone_ref = ref<HTMLElement | null>(null);

    const ariaLabelComputed = computed(() => {
        if (props.label && props.label.trim()) return `${props.label}. Pressione Enter ou Espaço para escolher arquivos`;

        return 'Área de envio de arquivos. Pressione Enter ou Espaço para escolher arquivos para upload';
    });

    const retryUpload = () => {
        showError.value = false;
        emit('retry');
        if (lastFiles.value.length > 0 && props.onSelect) props.onSelect({ files: lastFiles.value });

    };

    const dismissError = () => {
        showError.value = false;
        emit('dismiss-error');
    };

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
        lastFiles.value = files;
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

    defineExpose({
        showError,
        retryUpload,
        dismissError
    });
</script>

<style lang="scss" scoped>
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

        &:focus-visible {
            outline: 2px solid var(--max-primary-500, #00768e);
            outline-offset: 2px;
        }

        &.is-disabled {
            cursor: not-allowed;
            opacity: 0.6;
        }

        &.not-in-drop {
            &:hover {
                outline: 2px dashed var(--max-primary-500, #00768e);

                .upload-area {
                    :deep(.max-icon),
                    .label-file-upload {
                        color: var(--max-primary-500, #00768e) !important;
                    }
                }
            }
        }

        &.in-drop {
            outline: 3px dashed var(--max-primary-500, #00768e);
            background-color: var(--background-100);
        }

        .upload-area {
            display: grid;
            place-items: center;
            text-align: center;
            gap: 10px;
            color: var(--background-650);
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
            padding: 1.5rem;

            .screen-animation {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 12px;

                :deep(.upload-spinner) {
                    color: var(--max-primary-500, #00768e);
                }

                :deep(.error-icon) {
                    color: var(--max-danger-500, #ef4444);
                }

                .screen-animation-label {
                    font-size: 1rem;
                    font-weight: 500;
                    color: var(--background-700);
                    text-align: center;
                }

                .screen-animation-actions {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-top: 4px;
                }
            }

            &.upload-error-state {
                .screen-animation {
                    .screen-animation-label {
                        color: var(--max-danger-500, #ef4444);
                    }
                }
            }
        }
    }
</style>
