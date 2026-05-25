<template>
    <div :class="`input-project-div ${isOverDropZone ? 'in-drop' : 'not-in-drop'}`" ref="drop_zone_ref" >
        <div class="open-files" pointer>
            <div class="instruction">
                Insira fotos dos documentos ou Documentos em PDF aqui
                <br />
                para registrar os dados automaticamente.
            </div>
            <div>Clique aqui ou arraste e solte os documentos para carregar.</div>
            <MaxIcon icon="material-symbols:folder-open" size="4" color-gray />
        </div>
        <div class="file-list">
            <div v-for="file in temp_files" :key="file.id" class="file-item" pointer>
                <div v-tooltip.top="'Documento de identificação'">
                    <Icon i="mdi:identification-card" size="2" />
                </div>
            </div>
        </div>
        <div>
            <IconButton i="hugeicons:ai-file" size="1.3" v-tooltip.left="'Processar arquivos'" />
        </div>
    </div>
</template>
<script setup lang="ts">
    import { type Ref, watch, computed } from 'vue';
    import { useDropZone } from '@maxvue/max-use';
    import { useFileDialog } from '@maxvue/max-use';
    import { ref } from 'vue';
    import MaxIcon from './MaxIcon.vue';
    import { DBFile } from '../types/index.js';
    import { isBlank, ulid, size } from '@maxvue/max-use';
    import IconButton from './MaxIconButton.vue';

    const props = withDefaults(defineProps<{ files: DBFile[]; ready?: boolean; route_upload?: string }>(), { files: () => [] });

    const emit = defineEmits(['change-files']);

    const temp_files = ref<DBFile[]>(props.files);
    const count_files = computed(() => size(temp_files.value));
    const files_to_upload = computed(() => temp_files.value.filter((file: DBFile) => ! file.in_server) );
    const count_to_upload = computed(() => size(files_to_upload.value));


    watch(count_files, () => temp_files.value.forEach((file: DBFile) => convertItem(file)), { deep: true, immediate: true });

    const convertItem = (item: DBFile) => {
        item.id ??= ulid();
        item.name ??= item.file_name ?? item.label_file_name;
        item.extension ??= item.name?.split('.')?.pop() ?? null;
        item.blob ??= new Blob([ item as any ], { type: item.type });
        item.objectURL ??= URL.createObjectURL(item.blob);
        item.src ??= item.objectURL;
        item.file_bloob ??= item.objectURL;
        item.message_type ??= checkFileType(item.extension) ?? 'document';
        item.in_server ??= false;
    };

    function checkFileType (extension: string | null): string | null {
        if (isBlank(extension) || extension === 'svg') return null;
        else if (extension === 'jpg' || extension === 'jpeg' || extension === 'png' || extension === 'gif' || extension === 'webp' || extension === 'bmp') return 'image';
        else if (extension === 'mp3' || extension === 'ogg' || extension === 'aac' || extension === 'wav' || extension === 'flac' || extension === 'wma' || extension === 'm4a') return 'audio';
        else if (extension === 'mp4' || extension === 'avi' || extension === 'mov' || extension === 'webm' || extension === 'mkv' || extension === 'flv' || extension === '3gp' || extension === 'wmv' || extension === 'mpg' || extension === 'mpeg') return 'video';
        else if (extension === 'docx' || extension === 'doc' || extension === 'pdf' || extension === 'txt' || extension === 'pptx' || extension === 'ppt' || extension === 'xlsx' || extension === 'xls' || extension === 'csv') return 'document';

        return null;
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

    onChange((files) => {
        // if (files) emit('files-selected', Array.from(files));
        reset();
    });

    function onDrop(files: File[] | null) {
        // if (files) emit('files-selected', files);
    }
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
    }
</style>
