<template>
    <div ref="rootRef" class="input-upload-file-main-div" :class="{ 'is-dragover': isOverDropZone }" v-bind="attrs">
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
                    <div class="flex" gap-30>
                        <div class="max-spinner" role="status" aria-label="Loading"></div>
                        <div>Carregando arquivos</div>
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
                <div v-for="(file, index) in modelValue" :key="file.id || index" class="file-icon" @click="$emit('file-click', file)">
                    <Icon icon="ph:file-pdf-light" v-if="getFileExtension(file?.file_name || '') === 'pdf'" size="1.8" p0 />
                    <Icon icon="ph:file-jpg-light" v-if="['jpg', 'jpeg'].includes(getFileExtension(file?.file_name || ''))" size="1.8" p0 />
                    <Icon icon="ph:file-png-light" v-if="getFileExtension(file?.file_name || '') === 'png'" size="1.8" />
                    <Icon icon="fa:check-circle" class="file-check" size="0.7" />
                    <img :src="file?.thumbnail ? `/media/thumbnails/${file.thumbnail}` : file?.src" alt="Image" v-show="!file.file_name" />
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
        }>(),
        { uploadData: () => ({}), label: '', responseField: 'file' }
    );

    const modelValue = defineModel<any[]>({ default: () => [] });

    const files = ref<any[]>([]);
    const uploading = ref(false);
    const showError = ref(false);

    const emit = defineEmits(['file-click', 'upload-error', 'upload', 'select']);

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
</script>

<style lang="scss">
    .input-upload-file-main-div {
        &:not(.no-style) {
            height: 100%;
            width: 100%;
            border-radius: calc(1rem - 5px);
            padding-left: 0;
            position: relative;

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
                        color: var(--background-400);
                        cursor: not-allowed;
                    }
                }

                .label-file-upload {
                    transform: translateY(1px);
                    display: grid;
                    place-items: center start !important;
                    height: auto;
                    color: var(--background-600);
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
                color: var(--text-c);
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
                    color: var(--background-600) !important;
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
                display: grid;
                width: auto;
                pointer-events: none;

                .files-icons {
                    display: flex;
                    width: auto;
                    gap: 18px;
                    padding: 0 10px;
                    height: 30px;
                    pointer-events: auto;

                    .icon-div {
                        height: calc(100% - 20px);
                        padding-top: 5px;
                    }

                    .file-icon {
                        position: relative;
                        width: 35px;
                        height: 30px;
                        text-align: center;
                        display: grid;
                        gap: 0;
                        place-items: center;
                        cursor: pointer;

                        &:hover {
                            .icon-div {
                                color: var(--blue-600) !important;
                            }
                        }

                        .file-check {
                            position: absolute;
                            color: green !important;
                            top: 0;
                            left: -2px;
                            width: 16px;
                            height: 16px;
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
