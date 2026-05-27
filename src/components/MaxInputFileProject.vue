<template>
    <div :class="`input-project-div ${isOverDropZone ? 'in-drop' : 'not-in-drop'}`" ref="drop_zone_ref" relative>
        <MaxIconButton class="open-files-btn"  :hoverScale="1.06" @click.stop="() => open()">
            <div class="open-files" pointer >
                <div class="instruction">
                    Insira fotos dos documentos ou Documentos em PDF aqui
                    <br />
                    para registrar os dados automaticamente.
                </div>
                <div>Clique aqui ou arraste e solte os documentos para carregar.</div>
                <MaxIcon icon="material-symbols:folder-open" size="4" color-gray />
            </div>
        </MaxIconButton>
        <div class="file-list">
            <div v-for="file in temp_files" :key="file.id" class="file-item" pointer>
                <div relative class="icons-file">
                    <Icon :i="fileIcon(file)" size="2" />
                    <MaxLoaderIcon i="loading" size="2" style="position: absolute; top: 0;" class="loading-icon" v-if="file.to_request_ai && !file.data_ai"/>
                    <div class="ai-icon" v-if="file.data_ai !== null" >
                        <MaxIcon i="material-icon-theme:gemini-ai" size="0.9" color-blue-700 />
                    </div>
                </div>
            </div>
        </div>
        <div class="make-form">
            <div v-for="button in props.buttons">
                <MaxButton i="hugeicons:ai-file" light="0.7" label="Preencher" :action="button.action" :data="button" />
            </div>
        </div>
    </div>
</template>
<script setup lang="ts">
    import { type Ref, watch, computed } from 'vue';
    import { getRoute, useDropZone } from '@maxvue/max-use';
    import { useFileDialog } from '@maxvue/max-use';
    import { ref } from 'vue';
    import MaxIcon from './MaxIcon.vue';
    import MaxButton from './MaxButton.vue';
    import { DBFile } from '../types/index.js';
    import { isBlank, ulid, size } from '@maxvue/max-use';
    import MaxLoaderIcon from './MaxLoaderIcon.vue';
    import type { MaxButtonsType } from '../types/index.js';
    import axios from 'axios';
    import { goToRoute } from '@maxvue/max-use';
    import MaxIconButton from './MaxIconButton.vue';

    const props = withDefaults(defineProps<{ files: DBFile[]; uploadData?: any; auto?: boolean; url?: string; route?:string; ready?: boolean; uploadRoute?: string; buttons?: MaxButtonsType[] }>(), { files: () => [], buttons: () => [], auto: true });

    const temp_files = ref<DBFile[]>(props.files);

    watch(() => props.files, (files) => {
        temp_files.value = files;
    }, { deep: true, immediate: true });

    const count_files = computed(() => size(temp_files.value));
    const files_to_upload = computed(() => temp_files.value.filter((file: DBFile) => ! file.in_server) );
    const count_to_upload = computed(() => size(files_to_upload.value));


    watch(count_files, () => temp_files.value.forEach((file: DBFile) => convertItem(file)), { deep: true, immediate: true });

    function convertItem (item: DBFile) {
        item.id ??= ulid();
        item.name ??= item.file_name ?? item.label_file_name;
        item.extension ??= item.name?.split('.')?.pop() ?? null;
        item.blob ??= new Blob([ item as any ], { type: item.type });
        item.objectURL ??= URL.createObjectURL(item.blob);
        item.src ??= item.objectURL;
        item.file_bloob ??= item.objectURL;
        item.message_type ??= checkFileType(item.extension) ?? 'document';
        item.in_server ??= false;
        item.to_request_ai ??= ! item.in_server;
    };

    function checkFileType (extension: string | null): string | null {
        if (isBlank(extension) || extension === 'svg') return null;
        else if (extension === 'jpg' || extension === 'jpeg' || extension === 'png' || extension === 'gif' || extension === 'webp' || extension === 'bmp') return 'image';
        else if (extension === 'mp3' || extension === 'ogg' || extension === 'aac' || extension === 'wav' || extension === 'flac' || extension === 'wma' || extension === 'm4a') return 'audio';
        else if (extension === 'mp4' || extension === 'avi' || extension === 'mov' || extension === 'webm' || extension === 'mkv' || extension === 'flv' || extension === '3gp' || extension === 'wmv' || extension === 'mpg' || extension === 'mpeg') return 'video';
        else if (extension === 'docx' || extension === 'doc' || extension === 'pdf' || extension === 'txt' || extension === 'pptx' || extension === 'ppt' || extension === 'xlsx' || extension === 'xls' || extension === 'csv') return 'document';

        return null;
    }

    function fileIcon (file: DBFile): string | null {

        const file_names = [file?.file_name?.toLowerCase() ?? '', file?.name?.toLowerCase() ?? '', file?.label_file_name?.toLowerCase() ?? ''];

        for (const name of file_names){
            if (name && name.includes('cnh') || name.includes('identidade')|| name.includes('rg') || name.includes('carteira') ) return 'mdi:identification-card';
            return 'mdi:identification-card';
        }

        return 'mdi:file';
    }


    // REFS
    const drop_zone_ref: Ref = ref(null);

    const { isOverDropZone } = useDropZone(drop_zone_ref as any, {
        onDrop,
        multiple: true,
        preventDefaultForUnhandled: false
    });

    const { open, reset, onChange } = useFileDialog({
        directory: false
    });

    onChange((files: any) => {
        if (files && size(files) > 0){
            temp_files.value = [...temp_files.value, ...(files ?? [])];
            reset();
        }
    });

    watch(count_to_upload, () => {
        if (props.auto && count_to_upload.value > 0) sendFile(files_to_upload.value);

    });


    const sendFile = (files: any) => {
        if (! props.uploadRoute && !props.url && !props.route) return;

        const route_url = props.url
            ?? (props.route ? getRoute(props.route) ?? props.route : null)
            ?? (props.uploadRoute ? getRoute(props.uploadRoute) ?? props.uploadRoute : null);

        if (!route_url) return;

        // Criando o FormData
        const formData = new FormData();

        const data = props.uploadData ?? {};

        // Adicionando os dados ao FormData
        for (const key in data) if (Object.prototype.hasOwnProperty.call(data, key)) {
            const value = data[key];
            if (typeof value === 'object' && value !== null) formData.append(key, JSON.stringify(value));
            else formData.append(key, value);
        }


        files = { files: files['files'] ?? files };

        // Adicionando os arquivos ao FormData
        files['files'].forEach((fileItem: any, index: number) => {
            const file = fileItem;
            file['target'] = null;
            file['blob'] ??= new Blob([file], { type: file.type });
            file['objectURL'] ??= URL.createObjectURL(file.blob);
            formData.append(`files[${index}]`, file.blob, file.name);
        });

        const token: string = document.head.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
        axios.post(route_url, formData, {
            headers: {
                Accept: 'application/json',
                'X-CSRF-TOKEN': token,
                'X-Requested-With': 'XMLHttpRequest'
            },
            withCredentials: true
        }).catch( (error) => console.error('Erro ao enviar arquivo. ', error));
    };

    function onDrop(files: File[] | null) {
        // if (files) emit('files-selected', files);
    }

    const onClick = (event: any, button: MaxButtonsType) => {
        if (button.route) {
            goToRoute(button.route, { ...(button.params ?? {}), ...(button.data ?? {}), ...(button.query ?? {}) });
            return;
        }

        if (button.action) {
            const data = { ...(button.data ?? {}), ...(button.query ?? {}), ...(button.params ?? {}) };
            button.action({ event: event, data: data });
            return;
        }
    };
</script>

<style lang="scss">
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
            color: var(--background-600);

            .instruction {
                text-align: center;
            }

            .icon-div {
                color: var(--background-600);
            }
        }

        &.not-in-drop {
            &:hover {
                outline: 3px dashed var(--background-600);

                .open-files {
                    color: var(--background-750);

                    .icon-div {
                        color: var(--background-750);
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
                color: var(--background-650);
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

        .icons-file {
            display: grid;
            place-items: center;

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
