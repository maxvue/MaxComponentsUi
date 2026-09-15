<template>
    <div :class="`max-input-file-project input-project-div ${isOverDropZone ? 'in-drop' : 'not-in-drop'}`" ref="drop_zone_ref">
        <MaxIconButton
            class="open-files-btn"
            :hoverScale="1.06"
            :disabled="props.disabled"
            aria-label="Carregar documentos"
            @click="() => open()"
        >
            <div class="open-files">
                <div class="instruction">
                    Insira fotos dos documentos ou Documentos em PDF aqui
                    <br />
                    para registrar os dados automaticamente.
                </div>
                <div>Clique aqui ou arraste e solte os documentos para carregar.</div>
                <MaxIcon icon="material-symbols:folder-open" size="4" class="folder-icon" />
            </div>
        </MaxIconButton>
        <div class="file-list">
            <div v-for="file in temp_files" :key="file.id" class="file-item">
                <div class="icons-file">
                    <MaxIcon :icon="fileIcon(file)" size="2" />
                    <MaxLoaderIcon i="loading" size="2" class="loading-icon" v-if="file.to_request_ai && !file.data_ai"/>
                    <div class="ai-icon" v-if="file.data_ai !== null" >
                        <MaxIcon i="material-icon-theme:gemini-ai" size="0.9" class="gemini-icon" />
                    </div>
                </div>
            </div>
        </div>
        <div class="make-form">
            <div v-for="button in props.buttons">
                <MaxButton i="hugeicons:ai-file" light="0.7" label="Preencher" :action="button.action" :data="button" />
            </div>
        </div>
        <div class="sr-only" aria-live="polite" role="status">{{ statusAnnouncement }}</div>
    </div>
</template>
<script setup lang="ts">
    import { type Ref, watch, onBeforeUnmount, ref } from 'vue';
    import { getRoute, useDropZone, useFileDialog, isBlank, ulid, size } from '@maxvue/max-use';
    import MaxIcon from './MaxIcon.vue';
    import MaxButton from './MaxButton.vue';
    import type { DBFile, UploadFileStatus, MaxButtonsType } from '../types/index.js';
    import MaxLoaderIcon from './MaxLoaderIcon.vue';
    import axios from 'axios';
    import MaxIconButton from './MaxIconButton.vue';

    const props = withDefaults(
        defineProps<{
            files: DBFile[];
            uploadData?: any;
            auto?: boolean;
            url?: string;
            route?: string;
            ready?: boolean;
            uploadRoute?: string;
            buttons?: MaxButtonsType[];
            disabled?: boolean;
        }>(),
        {
            files: () => [],
            buttons: () => [],
            auto: true,
            disabled: false
        }
    );

    const emit = defineEmits<{
        'files-selected': [files: File[]];
        'upload-success': [payload: { files: any[]; response: any }];
        'upload-error': [payload: { files: any[]; error: any }];
    }>();

    export type { UploadFileStatus };

    const temp_files = ref<DBFile[]>([]);
    const fileStatusMap = ref(new Map<string, UploadFileStatus>());
    const created_urls = new Set<string>();
    const activeControllers = new Set<AbortController>();
    const statusAnnouncement = ref('');
    const isUnmounted = ref(false);

    const cleanupRemovedUrls = (currentFiles: DBFile[]) => {
        const localPending = temp_files.value.filter((f) => {
            const status = fileStatusMap.value.get(f.id);
            return status === 'queued' || status === 'uploading';
        });
        const activeUrls = new Set([...currentFiles, ...localPending].map((f) => f.objectURL).filter(Boolean));
        for (const url of Array.from(created_urls)) if (!activeUrls.has(url)) {
            URL.revokeObjectURL(url);
            created_urls.delete(url);
        }
    };

    function checkFileType(extension: string | null): string | null {
        if (isBlank(extension) || extension === 'svg') return null;
        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(extension!)) return 'image';
        if (['mp3', 'ogg', 'aac', 'wav', 'flac', 'wma', 'm4a'].includes(extension!)) return 'audio';
        if (['mp4', 'avi', 'mov', 'webm', 'mkv', 'flv', '3gp', 'wmv', 'mpg', 'mpeg'].includes(extension!)) return 'video';
        if (['docx', 'doc', 'pdf', 'txt', 'pptx', 'ppt', 'xlsx', 'xls', 'csv'].includes(extension!)) return 'document';
        return null;
    }

    function fileIcon(file: DBFile): string {
        const file_names = [file?.file_name?.toLowerCase() ?? '', file?.name?.toLowerCase() ?? '', file?.label_file_name?.toLowerCase() ?? ''];
        for (const name of file_names) if (name && (name.includes('cnh') || name.includes('identidade') || name.includes('rg') || name.includes('carteira'))) return 'mdi:identification-card';

        return 'mdi:file';
    }

    function normalizeFile(item: any, isInitialServer = false): DBFile {
        const cloned: any = { ...item };
        cloned.id = item.id || ulid();
        cloned.name = item.name || item.file_name || item.label_file_name || '';
        cloned.extension = item.extension || cloned.name?.split('.')?.pop() || null;

        if (!cloned.src && !cloned.thumbnail) {
            if (!cloned.blob) cloned.blob = item instanceof Blob ? item : new Blob([item as any], { type: item.type });

            if (!cloned.objectURL) {
                cloned.objectURL = URL.createObjectURL(cloned.blob);
                created_urls.add(cloned.objectURL);
            }
            cloned.src = cloned.objectURL;
            cloned.file_bloob = cloned.objectURL;
        }

        cloned.message_type = cloned.message_type || checkFileType(cloned.extension) || 'document';
        cloned.in_server = item.in_server ?? isInitialServer;
        cloned.to_request_ai = item.to_request_ai ?? (!cloned.in_server);

        const initialStatus: UploadFileStatus = cloned.in_server ? 'succeeded' : 'queued';
        if (!fileStatusMap.value.has(cloned.id)) fileStatusMap.value.set(cloned.id, initialStatus);

        return cloned as DBFile;
    }

    watch(
        () => props.files,
        (files) => {
            const incoming = files || [];
            cleanupRemovedUrls(incoming);

            const localPending = temp_files.value.filter((f) => {
                const status = fileStatusMap.value.get(f.id);
                return status === 'queued' || status === 'uploading';
            });

            const normalizedIncoming = incoming.map((f) => {
                const existing = temp_files.value.find((t) => t.id === f.id);
                if (existing) {
                    existing.in_server = f.in_server ?? true;
                    existing.data_ai = f.data_ai ?? existing.data_ai;
                    existing.to_request_ai = f.to_request_ai ?? existing.to_request_ai;
                    return existing;
                }
                return normalizeFile(f, f.in_server ?? true);
            });

            const incomingIds = new Set(normalizedIncoming.map((f) => f.id));
            const remainingLocal = localPending.filter((f) => !incomingIds.has(f.id));

            temp_files.value = [...normalizedIncoming, ...remainingLocal];
        },
        { deep: true, immediate: true }
    );

    const scheduleUpload = () => {
        if (!props.auto) return;
        const queued = temp_files.value.filter((f) => fileStatusMap.value.get(f.id) === 'queued');
        if (queued.length > 0) sendFile(queued).catch((err) => {
            // Erro automático capturado; emissão e estado 'failed' são gerenciados em sendFile
            return err;
        });

    };

    function ingestFiles(files: File[] | null) {
        if (isUnmounted.value || props.disabled || !files || files.length === 0) return;
        const fileList = Array.from(files);
        const normalized = fileList.map((f) => normalizeFile(f, false));
        temp_files.value = [...temp_files.value, ...normalized];
        statusAnnouncement.value = `${fileList.length} arquivo(s) selecionado(s)`;
        emit('files-selected', fileList);
        scheduleUpload();
    }

    // REFS
    const drop_zone_ref: Ref = ref(null);

    const { isOverDropZone } = useDropZone(drop_zone_ref as any, {
        onDrop: (files: File[] | null) => {
            ingestFiles(files);
        },
        multiple: true,
        preventDefaultForUnhandled: false
    });

    const { open, reset, onChange } = useFileDialog({
        directory: false
    });

    onChange((files: any) => {
        if (files && size(files) > 0) {
            ingestFiles(Array.from(files));
            reset();
        }
    });

    const sendFile = async (filesArg?: any): Promise<any> => {
        if (isUnmounted.value) return;
        if (!props.uploadRoute && !props.url && !props.route) return;

        const route_url = props.url
            ?? (props.route ? getRoute(props.route) ?? props.route : null)
            ?? (props.uploadRoute ? getRoute(props.uploadRoute) ?? props.uploadRoute : null);

        if (!route_url) return;

        let targetList: DBFile[] = [];
        if (filesArg) {
            const raw = filesArg.files ?? filesArg;
            const list = Array.isArray(raw) ? raw : [raw];
            targetList = list
                .map((item) => {
                    if (typeof item === 'string') return temp_files.value.find((f) => f.id === item);

                    if (item && item.id) return temp_files.value.find((f) => f.id === item.id) ?? item;

                    return item;
                })
                .filter(Boolean) as DBFile[];
        } else targetList = temp_files.value.filter((f) => fileStatusMap.value.get(f.id) === 'queued');


        // Filter out any already uploading or succeeded
        targetList = targetList.filter((f) => {
            const st = fileStatusMap.value.get(f.id);
            return st !== 'uploading' && st !== 'succeeded';
        });

        if (targetList.length === 0) return;

        // Mark as uploading
        targetList.forEach((f) => fileStatusMap.value.set(f.id, 'uploading'));

        const formData = new FormData();
        const data = props.uploadData ?? {};

        for (const key in data) if (Object.prototype.hasOwnProperty.call(data, key)) {
            const value = data[key];
            if (typeof value === 'object' && value !== null) formData.append(key, JSON.stringify(value));
            else formData.append(key, value);
        }


        const send_urls: string[] = [];
        targetList.forEach((fileItem: any, index: number) => {
            const file = fileItem;
            file.target = null;
            if (!file.blob) file.blob = file instanceof Blob ? file : new Blob([file], { type: file.type });

            if (!file.objectURL) {
                file.objectURL = URL.createObjectURL(file.blob);
                send_urls.push(file.objectURL);
            }
            formData.append(`files[${index}]`, file.blob, file.name);
        });

        const token = typeof document !== 'undefined'
            ? document.head?.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
            : '';

        const controller = new AbortController();
        activeControllers.add(controller);

        try {
            const response = await axios.post(route_url, formData, {
                headers: {
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': token,
                    'X-Requested-With': 'XMLHttpRequest'
                },
                withCredentials: true,
                signal: controller.signal
            });

            if (isUnmounted.value) return;

            targetList.forEach((f) => {
                f.in_server = true;
                f.to_request_ai = false;
                fileStatusMap.value.set(f.id, 'succeeded');
            });
            statusAnnouncement.value = `Upload de ${targetList.length} arquivo(s) concluído com sucesso`;
            emit('upload-success', { files: targetList, response: response?.data });
            return response;
        } catch (error: any) {
            if (isUnmounted.value) return;
            if (axios.isCancel && axios.isCancel(error)) return;
            if (error?.name === 'AbortError' || error?.name === 'CanceledError' || (axios.isAxiosError && axios.isAxiosError(error) && error.code === 'ERR_CANCELED')) return;

            targetList.forEach((f) => fileStatusMap.value.set(f.id, 'failed'));
            statusAnnouncement.value = `Erro no upload de ${targetList.length} arquivo(s)`;
            emit('upload-error', { files: targetList, error });
            console.error('Erro ao enviar arquivo. ', error);
            throw error;
        } finally {
            activeControllers.delete(controller);
            send_urls.forEach((url) => URL.revokeObjectURL(url));
        }
    };

    const retry = (fileIds?: string[]) => {
        if (isUnmounted.value) return Promise.resolve(undefined);
        const idSet = fileIds ? new Set(fileIds) : null;
        const failed = temp_files.value.filter((f) =>
            fileStatusMap.value.get(f.id) === 'failed' && (!idSet || idSet.has(f.id))
        );
        if (failed.length === 0) return Promise.resolve(undefined);
        failed.forEach((f) => fileStatusMap.value.set(f.id, 'queued'));
        return sendFile(failed);
    };

    onBeforeUnmount(() => {
        isUnmounted.value = true;
        for (const controller of activeControllers) controller.abort();

        activeControllers.clear();

        for (const url of Array.from(created_urls)) URL.revokeObjectURL(url);
        created_urls.clear();
    });

    defineExpose({
        temp_files,
        sendFile,
        retry,
        fileStatusMap,
        ingestFiles
    });
</script>

<style lang="scss" scoped>
    .input-project-div {
        width: 100%;
        height: 300px;
        position: relative;
        outline: 3px dashed var(--background-300);
        border-radius: 0.8rem;
        display: grid;
        place-items: center;

        .open-files {
            display: grid;
            place-items: center;
            text-align: center;
            gap: 5px;
            color: var(--background-700);
            cursor: pointer;

            .instruction {
                text-align: center;
            }

            .folder-icon {
                color: var(--background-500);
            }

            .icon-div {
                color: var(--background-700);
            }
        }

        &.not-in-drop {
            &:hover {
                outline: 3px dashed var(--background-600);

                .open-files {
                    color: var(--background-775);

                    .icon-div {
                        color: var(--background-775);
                    }
                }
            }
        }

        &.in-drop {
            outline: 3px dashed var(--background-600);
            background-color: var(--background-200);
        }

        .check-list-upload-files {
            position: absolute;
            top: 0.5rem;
            left: 1rem;

            .item {
                display: grid;
                grid-template-columns: auto 1fr;
                place-items: center start;
                gap: 0.5rem;
                height: 30px;
                color: var(--background-700);
                font-size: 0.9rem;
            }
        }

        .icon-make-ai {
            width: 32px;
            height: 32px;
            position: absolute;
            bottom: 10px;
            right: 10px;
        }

        .file-list {
            .file-item {
                cursor: pointer;
            }
        }

        .icons-file {
            position: relative;
            display: grid;
            place-items: center;
            width: 29px;
            height: 29px;

            .loading-icon {
                position: absolute;
                top: unset !important;
                color: var(--background-200) !important;
                left: unset !important;
            }
        }

        .ai-icon {
            width: 15.5px;
            height: 15.5px;
            background-color: var(--background-200);
            display: grid;
            place-items: center;
            position: absolute;
            bottom: -3px;
            right: -5px;
            border-radius: 50%;
            border: 1px solid var(--background-400);

            .gemini-icon {
                color: var(--blue-700);
            }

            svg {
                width: 10px !important;
                height: 10px !important;
            }
        }

        .make-form {
            position: absolute;
            right: 10px;
            bottom: 10px;
        }
    }

    .open-files-btn {
        width: 100% !important;
        height: 100% !important;
    }
</style>
