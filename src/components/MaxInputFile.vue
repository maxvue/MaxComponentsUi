<template>
    <div class="input-file-main-div" v-bind="attrs">
        <slot name="button" flex>
            <div class="input-file-content" v-if="!isOverDropZone">
                <div class="input-file-content-icon-label">
                    <Icon i="lets-icons:upload-light" size="3"/>
                    <div class="input-file-content-label" v-html="attrs.label ?? 'Clique aqui, arraste e solte, <br>ou cole (CTRL + V) arquivos para carregar.'"></div>
                </div>
            </div>
            <div ref="dropZoneRef" :class="`drop-zone-div ${isOverDropZone ? 'dropping' : ''}`">
                <div class="drop-zone-div-content">
                    <Icon i="tabler:drag-drop" size="2.6" />
                    <div>Solte aqui seus arquivos para enviar.</div>
                </div>
            </div>
        </slot>
        <slot name="filesPreview" flex >
            <div  class="files-list-mini" v-if="temp_value.length > 0 && sizePreview === 'mini' ">
                <div v-for="(file, index) in temp_value" :key="`preview-${index}`">
                    <Icon i="mdi:file-outline" size="1.5"/>
                </div>
            </div>
            <div class="files-list-preview" v-else>
                <div v-for="(file, index) in temp_value" :key="`preview-${index}`" class="files-list-preview-content">
                    <img v-if="file.type && file.type.startsWith('image/')" :src="(file as any)?.src" />
                    <div class="file-standard">
                        <Icon i="mdi:file-outline" size="3"/>
                        <div class="file-standard-info">
                            <strong>Arquivo:</strong>: {{file.name}}
                        </div>
                        <div class="file-standard-info">
                            <strong>Tamanho:</strong> {{ (file.size / 1024).toFixed(2) }} KB <br>
                        </div>
                    </div>
                    <div class="trash-icon-remove-clipboard" pr4 pt4 @click="deleteItem(index)">
                        <Icon i="tabler:trash"  size="1.3" hover-blue-icon  />
                    </div>
                </div>
            </div>
        </slot>
    </div>
</template>
<script setup lang="ts">
    import type { Ref } from 'vue';
    import { useEventListener } from '@vueuse/core';
    import { useDropZone } from '@vueuse/core';
    import { ref, computed, watch, useAttrs } from 'vue';
    const attrs: any = useAttrs();

    const props = withDefaults(
        defineProps<{
            modelValue: File[];
            label?: string;
        }>(),
        { modelValue: () => [] }
    );
    const emit = defineEmits(['update:modelValue']);
    const temp_value: Ref<File[]> = ref(props.modelValue);

    const isVisibleFiles = computed(() => attrs.noView === undefined && attrs.noPreview === undefined);
    const sizePreview = computed(() => attrs.sizeFiles ?? attrs.sizePreview ?? attrs.size_files ?? attrs.size_preview ?? '');
    const dropZoneRef = ref(null);

    const feedbackMessage = ref('Pressione Ctrl+V para colar um arquivo ou uma imagem (print).');

    watch(temp_value, (val) => {
        emit('update:modelValue', val);
    });

    watch(() => props.modelValue, (val) => {
        temp_value.value = val;
    });

    const deleteItem = (indexRemove: number) => {
        temp_value.value = temp_value.value.filter((_, index) => index !== indexRemove);
    };

    const handlePaste = (event: ClipboardEvent) => {
        if (!event.clipboardData) return;
        const filesFound: File[] = [];
        const items = event.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (item.kind === 'file' && item.type.startsWith('image/')) {
                const file = item.getAsFile();
                if (file) {
                    const namedFile: any = new File([file], `pasted-image-${Date.now()}.${file.type.split('/')[1]}`, { type: file.type });
                    namedFile.src = URL.createObjectURL(namedFile);
                    filesFound.push(namedFile);
                }
            }
        }

        if (filesFound.length === 0 && event.clipboardData.files.length > 0) filesFound.push(...Array.from(event.clipboardData.files));

        if (filesFound.length > 0) {
            event.preventDefault();
            temp_value.value = [...temp_value.value, ...filesFound];
            feedbackMessage.value = `${filesFound.length} item(s) colado(s) com sucesso!`;
        }
    };

    useEventListener(window, 'paste', handlePaste);

    const { isOverDropZone } = useDropZone(dropZoneRef, {
        onDrop,
        multiple: true,
        preventDefaultForUnhandled: false
    });

    function onDrop(files: File[] | null) {
        if (files && files.length > 0) temp_value.value = [...temp_value.value, ...files];

    }
</script>

<style lang="scss">
    .input-file-main-div {
        display: grid;
        place-items: center;
        grid-template-columns: 1fr;
        position: relative;
        width: 100%;
        height: 100%;
        cursor: pointer;

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
                color: var(--background-600);
            }
        }
    }
</style>
