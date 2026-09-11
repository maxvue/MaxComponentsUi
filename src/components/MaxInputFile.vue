<template>
    <div
        class="input-file-main-div"
        tabindex="0"
        role="region"
        aria-label="Área de envio de arquivos"
        v-bind="attrs"
        @click="triggerChoose"
        @keydown.enter.prevent="triggerChoose"
        @keydown.space.prevent="triggerChoose"
        @paste="handlePaste"
    >
        <input
            ref="nativeInputRef"
            type="file"
            class="max-input-file-hidden"
            multiple
            tabindex="-1"
            aria-hidden="true"
            @click.stop
            @change="onNativeInputChange"
            @paste="handlePaste"
        />

        <slot name="button">
            <div class="input-file-content" v-if="!isOverDropZone">
                <div class="input-file-content-icon-label">
                    <MaxIcon icon="lets-icons:upload-light" size="3" />
                    <div
                        class="input-file-content-label"
                        v-html="displayLabel"
                    ></div>
                </div>
            </div>
            <div ref="dropZoneRef" :class="`drop-zone-div ${isOverDropZone ? 'dropping' : ''}`">
                <div class="drop-zone-div-content">
                    <MaxIcon icon="tabler:drag-drop" size="2.6" />
                    <div>Solte aqui seus arquivos para enviar.</div>
                </div>
            </div>
        </slot>

        <slot name="filesPreview">
            <template v-if="isVisibleFiles && temp_value.length > 0">
                <div class="files-list-mini" v-if="sizePreview === 'mini'">
                    <div v-for="(file, index) in temp_value" :key="`preview-mini-${index}`">
                        <MaxIcon icon="mdi:file-outline" size="1.5" />
                    </div>
                </div>
                <div class="files-list-preview" v-else>
                    <div
                        v-for="(file, index) in temp_value"
                        :key="`preview-${index}`"
                        class="files-list-preview-content"
                    >
                        <img
                            v-if="file.type && file.type.startsWith('image/')"
                            :src="getFilePreviewUrl(file)"
                            alt="Preview"
                        />
                        <div class="file-standard" v-else>
                            <MaxIcon icon="mdi:file-outline" size="3" />
                            <div class="file-standard-info">
                                <strong>Arquivo:</strong> {{ file.name }}
                            </div>
                            <div class="file-standard-info">
                                <strong>Tamanho:</strong> {{ (file.size / 1024).toFixed(2) }} KB
                            </div>
                        </div>
                        <div
                            class="trash-icon-remove-clipboard"
                            @click.stop="deleteItem(index)"
                        >
                            <MaxIcon icon="tabler:trash" size="1.3" />
                        </div>
                    </div>
                </div>
            </template>
        </slot>
    </div>
</template>

<script setup lang="ts">
    import { ref, computed, watch, useAttrs, onBeforeUnmount } from 'vue';
    import { useDropZone } from '@maxvue/max-use';
    import MaxIcon from './MaxIcon.vue';
    import { sanitizeHtml } from '../helpers/sanitizeHtml';

    /**
     * Componente de seleção de arquivos com drag-and-drop, drop zone e suporte a colagem (Ctrl+V).
     */
    const attrs = useAttrs();

    const props = withDefaults(
        defineProps<{
            /** Lista de arquivos selecionados (v-model) */
            modelValue?: File[];
            /** Texto descritivo na zona de drop */
            label?: string;
        }>(),
        {
            modelValue: () => []
        }
    );

    const emit = defineEmits<{
        (e: 'update:modelValue', value: File[]): void;
    }>();

    const nativeInputRef = ref<HTMLInputElement | null>(null);
    const dropZoneRef = ref<HTMLDivElement | null>(null);
    const temp_value = ref<File[]>([...props.modelValue]);

    // Mapa de Object URLs geradas para pré-visualização de imagens, garantindo cleanup em onBeforeUnmount
    const previewUrlMap = new Map<File, string>();

    const displayLabel = computed((): string => {
        const rawLabel = props.label
            ?? (typeof attrs['label'] === 'string' ? attrs['label'] : undefined)
            ?? 'Clique aqui, arraste e solte seus arquivos para enviar ou <b>Cole com Ctrl+V</b>';
        return sanitizeHtml(String(rawLabel));
    });

    const isVisibleFiles = computed((): boolean => {
        const noView = attrs['no-view'] ?? attrs['noView'];
        const noPreview = attrs['no-preview'] ?? attrs['noPreview'];
        const hasNoView = noView !== undefined && noView !== false && noView !== 'false';
        const hasNoPreview = noPreview !== undefined && noPreview !== false && noPreview !== 'false';
        return !hasNoView && !hasNoPreview;
    });

    const sizePreview = computed((): string => {
        const size = attrs['size-files'] ?? attrs['size-preview'] ?? attrs['sizeFiles'] ?? attrs['sizePreview'];
        return typeof size === 'string' ? size : '';
    });

    const getFilePreviewUrl = (file: File): string => {
        if (previewUrlMap.has(file)) return previewUrlMap.get(file)!;
        const url = URL.createObjectURL(file);
        previewUrlMap.set(file, url);
        return url;
    };

    const cleanupFileUrl = (file: File) => {
        const url = previewUrlMap.get(file);
        if (url) {
            URL.revokeObjectURL(url);
            previewUrlMap.delete(file);
        }
    };

    const cleanupAllUrls = () => {
        for (const url of previewUrlMap.values()) URL.revokeObjectURL(url);
        previewUrlMap.clear();
    };

    onBeforeUnmount(() => {
        cleanupAllUrls();
    });

    watch(
        () => props.modelValue,
        (val) => {
            temp_value.value = val ? [...val] : [];
        },
        { deep: true }
    );

    const updateFiles = (newFiles: File[]) => {
        temp_value.value = newFiles;
        emit('update:modelValue', newFiles);
    };

    const addFiles = (filesToAdd: File[]) => {
        if (!filesToAdd.length) return;
        updateFiles([...temp_value.value, ...filesToAdd]);
    };

    const deleteItem = (indexRemove: number) => {
        const removedFile = temp_value.value[indexRemove];
        if (removedFile) cleanupFileUrl(removedFile);
        const updated = temp_value.value.filter((_, index) => index !== indexRemove);
        updateFiles(updated);
    };

    const triggerChoose = (event?: Event) => {
        if (event?.target === nativeInputRef.value) return;
        nativeInputRef.value?.click();
    };

    const onNativeInputChange = (event: Event) => {
        const target = event.target as HTMLInputElement;
        if (target.files && target.files.length > 0) addFiles(Array.from(target.files));
        target.value = '';
    };

    const handlePaste = (event: ClipboardEvent) => {
        if (!event.clipboardData) return;
        const filesFound: File[] = [];
        const items = event.clipboardData.items;

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (item.kind === 'file') {
                const file = item.getAsFile();
                if (file) {
                    const ext = file.type ? file.type.split('/')[1] || 'bin' : 'bin';
                    const fileName = file.name && file.name !== 'image.png' && file.name !== 'blob'
                        ? file.name
                        : `pasted-${Date.now()}.${ext}`;
                    const namedFile = new File([file], fileName, { type: file.type });
                    filesFound.push(namedFile);
                }
            }
        }

        if (filesFound.length === 0 && event.clipboardData.files.length > 0) filesFound.push(...Array.from(event.clipboardData.files));

        if (filesFound.length > 0) {
            event.preventDefault();
            addFiles(filesFound);
        }
    };

    const { isOverDropZone } = useDropZone(dropZoneRef, {
        onDrop: (files: File[] | null) => {
            if (files && files.length > 0) addFiles(files);
        },
        multiple: true,
        preventDefaultForUnhandled: false
    });
</script>

<style lang="scss" scoped>
    .max-input-file-hidden {
        display: none !important;
    }

    .input-file-main-div {
        display: grid;
        place-items: center;
        grid-template-columns: 1fr;
        position: relative;
        width: 100%;
        height: 100%;
        cursor: pointer;

        &:focus-visible {
            outline: none;
            box-shadow: var(--max-focus-ring);
            border-radius: 1rem;
        }

        .input-file-content {
            position: absolute;
            width: 100%;
            height: 100%;
            display: grid;
            place-items: center;
            border: 1px dashed var(--background-500);
            border-radius: 1rem;
            grid-template-rows: 130px 1fr;

            .input-file-content-icon-label {
                display: grid;
                place-items: center;

                .input-file-content-label {
                    width: 100%;
                    text-align: center;
                    font-size: 0.85rem;
                    color: var(--background-650);
                }
            }
        }

        .files-list-mini {
            display: grid;
            grid-template-columns: repeat(15, 1fr);
            width: 100%;
            margin-top: 10px;
            place-items: center;
        }

        .files-list-preview {
            display: grid;
            grid-template-columns: auto auto auto;
            width: 100%;
            gap: 10px;
            position: relative;
            place-items: center;

            .files-list-preview-content {
                width: 100% !important;
                min-height: 100px;
                display: grid;
                position: relative;
                border-radius: 1rem;
                border: 1px solid var(--background-400);

                .file-standard {
                    padding: 6px 10px;
                    display: grid;

                    .file-standard-info {
                        white-space: nowrap;
                        font-size: 0.8rem;
                        overflow: hidden;
                        text-overflow: ellipsis;
                    }
                }

                .trash-icon-remove-clipboard {
                    position: absolute;
                    top: 3px;
                    right: 3px;
                    padding-top: 4px;
                    padding-right: 4px;
                    cursor: pointer;
                }

            }

        }

        .drop-zone-div {
            position: absolute;
            height: calc(100% - 2px);
            width: calc(100% - 2px);
            margin: 1px;
            display: grid;
            place-items: center;
            opacity: 0;
            border: 1px dashed var(--background-700);
            border-radius: 1rem;

            .drop-zone-div-content {
                display: grid;
                place-items: center;
            }

            &.dropping {
                opacity: 1;
                background-color: var(--background-200);
                color: var(--background-700);
            }
        }
    }
</style>
