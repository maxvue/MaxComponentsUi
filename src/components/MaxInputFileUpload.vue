<template>
    <div ref="rootRef" class="max-input-file-upload input-upload-file-main-div" :class="{ 'is-dragover': isOverDropZone }" v-bind="attrs">
        <input
            ref="nativeInputRef"
            type="file"
            class="max-file-native-input"
            style="display: none;"
            :name="(attrs.name as string) ?? 'file'"
            :accept="(attrs.accept as string) ?? '.pdf, .jpg, .jpeg, .png, .doc, .docx'"
            :multiple="(attrs.multiple as boolean) ?? true"
            :disabled="attrs.disabled ?? false"
            @change="onNativeInputChange"
        />

        <div class="p-fileupload" :disabled="attrs.disabled ?? false">
            <button
                type="button"
                class="p-button p-fileupload-choose"
                :disabled="attrs.disabled ?? false"
                :aria-label="uploading ? 'Carregando arquivos' : 'Escolher arquivos para envio'"
                @click.stop="triggerChoose"
            >
                <div class="chose-icon-div">
                    <Icon icon="line-md:loading-loop" size="2" v-if="uploading" />
                    <Icon icon="quill:folder-open" size="2" v-else />
                </div>
            </button>

            <button
                type="button"
                class="p-button"
                v-if="showUploadButton"
                v-tooltip="'Enviar arquivo'"
                aria-label="Enviar arquivos selecionados"
                @click.stop="startUpload(files)"
            >
                <div class="chose-icon-div">
                    <Icon icon="ic:baseline-file-upload" size="2" />
                </div>
            </button>

            <div class="p-fileupload-content">
                <div
                    @click.stop="triggerChoose"
                    class="label-file-upload"
                    v-if="(files.length > 0 || modelValue.length > 0) && !uploading && !showError && (attrs.uploading === false || attrs.uploading === undefined)"
                >
                    <slot>
                        <span class="text">{{ displayLabel }}</span>
                    </slot>
                </div>
                <div v-else-if="uploading || attrs.uploading">
                    <div class="upload-loading-state">
                        <div class="max-spinner" role="status" aria-label="Loading"></div>
                        <div class="upload-loading-text">Carregando arquivos</div>
                    </div>
                </div>
                <div v-else-if="showError">
                    <slot name="error">
                        Ocorreu um erro ao fazer o upload.
                    </slot>
                </div>
                <div
                    @click.stop="triggerChoose"
                    class="label-file-upload"
                    v-else-if="files.length === 0 && (attrs.uploading === false || attrs.uploading === undefined)"
                >
                    <slot>
                        <span class="text">{{ displayLabel }}</span>
                    </slot>
                    <slot name="error" v-if="showError">
                        Ocorreu um erro ao fazer o upload.
                    </slot>
                </div>
            </div>
        </div>

        <div class="file-upload-content-div" :disabled="attrs.disabled ?? false">
            <div class="files-icons" v-if="modelValue.length > 0">
                <div
                    v-for="(file, index) in modelValue"
                    :key="file.id || index"
                    class="file-icon"
                    role="button"
                    :tabindex="attrs.disabled ? -1 : 0"
                    :aria-label="`Visualizar arquivo ${getFileName(file)}`"
                    v-tooltip="getFileTooltip(file)"
                    @click="$emit('file-click', file)"
                    @keydown.enter.prevent="$emit('file-click', file)"
                    @keydown.space.prevent="$emit('file-click', file)"
                >
                    <button
                        v-if="props.removable && !attrs.disabled"
                        type="button"
                        class="file-remove-btn"
                        aria-label="Remover arquivo"
                        @click.stop="removeFile(index, file)"
                    >
                        <Icon icon="solar:close-circle-bold" size="0.9" />
                    </button>

                    <img
                        :src="file?.thumbnail ? `/media/thumbnails/${file.thumbnail}` : file?.src"
                        :alt="getFileName(file)"
                        class="file-thumb"
                        v-if="file?.thumbnail || (file?.src && !file.file_name)"
                    />
                    <Icon
                        :icon="resolveFileIcon(getFileName(file))"
                        size="1.8"
                        v-else
                    />

                    <Icon icon="fa:check-circle" class="file-check" size="0.7" />

                    <div class="file-info-label" v-if="props.showMetadata">
                        <span class="file-name-text">{{ getFileName(file) }}</span>
                        <span class="file-size-text" v-if="formatFileSize(file?.size)">{{ formatFileSize(file?.size) }}</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { ref, computed, watch, useAttrs, onBeforeUnmount } from 'vue';
    import { useDropZone } from '@maxvue/max-use';

    /**
     * Componente avançado para upload de arquivos.
     * Suporta múltiplos arquivos, pré-visualização (thumbnails), progresso de upload e integração com backend.
     */
    const attrs: any = useAttrs();
    const rootRef = ref<HTMLElement | null>(null);
    const nativeInputRef = ref<HTMLInputElement | null>(null);

    const props = withDefaults(
        defineProps<{
            /** Token CSRF para autenticação no upload */
            token?: string;
            /** Dados adicionais para enviar via FormData no upload */
            uploadData?: Record<string, any>;
            /** Rótulo descritivo do campo */
            label?: string;
            /** Campo da resposta da API que contém os dados do arquivo (vazio para usar a resposta completa) */
            responseField?: string;
            /** Permite remover arquivos já selecionados da lista */
            removable?: boolean;
            /** Exibe metadados (nome e tamanho) dos arquivos */
            showMetadata?: boolean;
        }>(),
        {
            uploadData: () => ({}),
            label: '',
            responseField: 'file',
            removable: true,
            showMetadata: true
        }
    );

    const modelValue = defineModel<any[]>({ default: () => [] });

    const files = ref<any[]>([]);
    const uploading = ref(false);
    const showError = ref(false);

    const emit = defineEmits<{
        'file-click': [file: any];
        'upload-error': [error: any];
        'upload': [event: any];
        'select': [event: any];
        'delete': [payload: { file: any; index: number }];
        'remove-file': [payload: { file: any; index: number }];
    }>();

    const showUploadButton = computed(() => attrs.showUploadButton !== undefined && attrs.showUploadButton !== false);

    const displayLabel = computed(() => {
        const isDisabled = attrs.disabled !== undefined && attrs.disabled !== false;
        if (isDisabled) return attrs['label-disabled'] ?? attrs.labelDisabled ?? attrs.label_disabled ?? props.label;
        return props.label;
    });

    watch(showError, (val) => {
        if (val) setTimeout(() => {
            showError.value = false;
            files.value = [];
        }, 3000);
    });

    const triggerChoose = () => {
        if (attrs.disabled) return;
        if (nativeInputRef.value) nativeInputRef.value.click();

    };

    const onNativeInputChange = (event: Event) => {
        const target = event.target as HTMLInputElement;
        if (target.files && target.files.length > 0) handleSelectedFiles(Array.from(target.files));

    };

    const { isOverDropZone } = useDropZone(rootRef as any, {
        onDrop: (dropped) => {
            if (attrs.disabled) return;
            if (dropped && dropped.length) handleSelectedFiles(dropped);
        }
    });

    const handleSelectedFiles = (selected: any[]) => {
        onSelectHandler({ files: selected });
        if (attrs.auto ?? true) startUpload(selected);

    };

    const onSelectHandler = (event: any) => {
        uploading.value = true;
        files.value = event?.files ?? [];
        emit('select', event);
        if (attrs.onSelect) attrs.onSelect(event);
    };

    let currentXhr: XMLHttpRequest | null = null;

    const startUpload = (toSend: any[]) => {
        if (!toSend || !toSend.length) return;
        const url = (attrs.url as string) ?? '';
        if (!url) return;

        const xhr = new XMLHttpRequest();
        currentXhr = xhr;

        const formData = new FormData();
        const fieldName = (attrs.name as string) ?? 'file';
        if (attrs.multiple ?? true) toSend.forEach((f) => formData.append(fieldName, f, f.name));
        else formData.append(fieldName, toSend[0], toSend[0].name);


        xhr.withCredentials = true;
        xhr.open('POST', url, true);

        onBeforeUpload({ xhr, formData });

        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) onUploadHandler({ xhr });
            else onError({ xhr });

            currentXhr = null;
        };

        xhr.onerror = () => {
            onError({ xhr });
            currentXhr = null;
        };

        xhr.send(formData);
    };

    onBeforeUnmount(() => {
        currentXhr?.abort();
    });

    const onUploadHandler = (event: any) => {
        uploading.value = false;
        emit('upload', event);
        if (attrs.onUpload) attrs.onUpload(event);

        try {
            if (event?.xhr?.response) {
                const response = JSON.parse(event.xhr.response);
                const fileData = props.responseField ? response[props.responseField] : response;
                if (fileData) modelValue.value = [...modelValue.value, fileData];
            }
        } catch (e) {
            console.error('MaxInputFileUpload: Erro ao processar resposta de upload', e);
        }
    };

    const onError = (event: any) => {
        showError.value = true;
        uploading.value = false;
        emit('upload-error', event);
        if (attrs.onError) attrs.onError(event);
    };

    const onBeforeUpload = (event: any) => {
        if (event.xhr) {
            if (props.token) event.xhr.setRequestHeader('X-CSRF-TOKEN', props.token);

            for (const key in props.uploadData) event.formData.append(key, props.uploadData[key]);

            if (files.value.length > 0 && files.value[0]?.name) {
                const extension = files.value[0].name.split('.').pop();
                event.formData.append('extension', extension);
            }
        }
    };

    const getFileExtension = (fileName: string) => (fileName ? fileName.split('.').pop()?.toLowerCase() : '') || '';

    const getFileName = (file: any): string => {
        if (typeof file === 'string') return file;
        return file?.name ?? file?.file_name ?? file?.fileName ?? 'Arquivo sem nome';
    };

    const formatFileSize = (bytes?: number): string => {
        if (!bytes || bytes <= 0 || isNaN(bytes)) return '';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const resolveFileIcon = (fileName: string): string => {
        const ext = getFileExtension(fileName);
        if (ext === 'pdf') return 'ph:file-pdf-light';
        if (['jpg', 'jpeg'].includes(ext)) return 'ph:file-jpg-light';
        if (ext === 'png') return 'ph:file-png-light';
        if (['doc', 'docx'].includes(ext)) return 'ph:file-doc-light';
        if (['xls', 'xlsx', 'csv'].includes(ext)) return 'ph:file-xls-light';
        if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return 'ph:file-zip-light';
        if (['txt', 'md'].includes(ext)) return 'ph:file-text-light';
        return 'ph:file-light';
    };

    const getFileTooltip = (file: any): string | null => {
        if (!props.showMetadata) return null;
        const name = getFileName(file);
        const size = formatFileSize(file?.size);
        return size ? `${name} (${size})` : name;
    };

    const removeFile = (index: number, file: any) => {
        if (attrs.disabled) return;
        const updated = [...modelValue.value];
        updated.splice(index, 1);
        modelValue.value = updated;
        emit('delete', { file, index });
        emit('remove-file', { file, index });
    };
</script>

<style lang="scss" scoped>
    .input-upload-file-main-div {
        &:not(.no-style) {
            height: 100%;
            width: 100%;
            border-radius: calc(1rem - 5px);
            padding-left: 0;
            position: relative;

            .upload-loading-state {
                display: flex;
                align-items: center;
                gap: 30px;

                .upload-loading-text {
                    font-size: 0.9rem;
                    color: var(--background-750);
                }
            }

            .max-spinner {
                width: 20px;
                height: 20px;
                border: 2px solid var(--background-300, #e2e8f0);
                border-top-color: var(--primary-500, #3b82f6);
                border-radius: 50%;
                display: inline-block;
                animation: max-spinner-rotate 1s linear infinite;
            }

            .p-fileupload {
                display: grid;
                grid-template-columns: auto 1fr;
                place-items: center;
                border: none;
                height: 100% !important;
                gap: 1rem;
                background-color: transparent;
                padding: 0 10px;
                position: relative;

                .p-button {
                    display: grid;
                    place-items: center;
                    padding: 0;
                    height: 30px;
                    width: 30px;
                    background-color: var(--primary-c, #3b82f6) !important;
                    border: none;
                    opacity: 1;
                    color: var(--text-b, #fff);
                    cursor: pointer;
                    z-index: 1;

                    span {
                        display: none;
                    }

                    &:hover {
                        background-color: var(--primary-mouse, #2563eb) !important;
                        border: none;
                        color: var(--icon-mouse, #fff);
                    }

                    svg {
                        transform: scale(0.75);
                    }
                }

                &[disabled],
                &[disabled='true'] {
                    .label-file-upload {
                        font-weight: 400;
                        color: var(--background-650);
                        cursor: not-allowed;
                    }
                }

                .label-file-upload {
                    transform: translateY(1px);
                    display: grid;
                    place-items: center start !important;
                    height: auto;
                    color: var(--background-700);
                    cursor: pointer;

                    &:hover {
                        color: var(--blue-700) !important;
                    }
                }
            }

            .p-fileupload-content {
                height: 30px;
                display: grid;
                grid-template-rows: auto;
                gap: 0;
                place-items: center start;
                padding: 0 0 0 60px !important;
                width: 100%;
                font-size: 0.9rem;
                font-weight: 300 !important;
                color: var(--background-700);
                cursor: pointer;
                border: none !important;
                position: absolute;
                border-radius: calc(1rem - 5px);
            }

            .p-button {
                width: auto !important;
                height: auto !important;
                min-width: 0 !important;
                min-height: 0 !important;
                padding: 0 !important;

                &[disabled] {
                    .chose-icon-div {
                        display: none;
                    }
                }
            }

            .chose-icon-div {
                width: 40px;
                height: 30px;
                padding: 0 5px;

                .icon-div {
                    color: var(--background-650) !important;
                }

                &:hover {
                    .icon-div {
                        color: var(--blue-700) !important;
                    }
                }
            }

            .file-upload-content-div {
                position: absolute;
                top: 0;
                height: 100%;
                right: 0;
                display: flex;
                align-items: center;
                width: auto;
                pointer-events: none;

                .files-icons {
                    display: flex;
                    align-items: center;
                    width: auto;
                    gap: 14px;
                    padding: 0 10px;
                    height: 100%;
                    pointer-events: auto;

                    .file-icon {
                        position: relative;
                        min-width: 36px;
                        height: 32px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        cursor: pointer;
                        transition: transform 0.15s ease;

                        &:focus-visible {
                            outline: 2px solid var(--max-primary-500, #00768e);
                            outline-offset: 2px;
                            border-radius: 4px;
                        }

                        &:hover {
                            .icon-div {
                                color: var(--blue-600, #2563eb) !important;
                            }

                            .file-remove-btn {
                                opacity: 1;
                                transform: scale(1);
                            }
                        }

                        .file-thumb {
                            max-width: 32px;
                            max-height: 32px;
                            object-fit: cover;
                            border-radius: 4px;
                        }

                        .file-check {
                            position: absolute;
                            color: var(--max-success-500, #10b981) !important;
                            bottom: -2px;
                            left: -2px;
                            width: 14px;
                            height: 14px;
                            background: var(--background-0, #fff);
                            border-radius: 50%;
                        }

                        .file-remove-btn {
                            position: absolute;
                            top: -6px;
                            right: -6px;
                            background: transparent;
                            border: none;
                            padding: 0;
                            cursor: pointer;
                            color: var(--max-danger-500, #ef4444);
                            opacity: 0.8;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            z-index: 2;
                            transition: all 0.15s ease;

                            &:hover {
                                color: var(--red-700, #b91c1c);
                                transform: scale(1.15);
                            }

                            &:focus-visible {
                                outline: 2px solid var(--max-primary-500, #00768e);
                                outline-offset: 1px;
                                border-radius: 50%;
                            }
                        }

                        .file-info-label {
                            display: none;
                        }
                    }
                }
            }
        }

        &.is-dragover {
            outline: 2px dashed var(--primary-500);
        }
    }

    @keyframes max-spinner-rotate {
        from {
            transform: rotate(0deg);
        }

        to {
            transform: rotate(360deg);
        }
    }
</style>
