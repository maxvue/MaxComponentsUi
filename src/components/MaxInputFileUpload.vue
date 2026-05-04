<template>
    <div class="input-upload-file-main-div" v-bind="attrs">
        <FileUpload name="file" v-bind="attrs" :disabled="attrs.disabled ?? false" :accept="attrs.accept ?? '.pdf, .jpg, .jpeg, .png, .doc, .docx'" :auto="attrs.auto ?? true" :multiple="attrs.multiple ?? true"  :showCancelButton="false" :showUploadButton="attrs.showUploadButton !== undefined && attrs.showUploadButton !== false" :withCredentials="true" @error="onError" @before-send="onBeforeUpload" @upload="attrs.onUpload ?? attrs.upload ?? onUpload" @select="attrs.onSelect ?? attrs.select ?? onSelect">
            <template #content="{ files, uploadedFiles }">
                <div @click.stop="openFolder" class="label-file-upload" v-if="(files.length > 0 || uploadedFiles.length > 0) && !uploading && !show_error && (attrs.uploading === false || attrs.uploading === undefined)">
                    <slot>
                        <span class="text" v-if="attrs.disabled !== undefined && attrs.disabled !== false">{{ attrs['label-disabled'] ?? attrs.labelDisabled ?? attrs.label_disabled ?? label }}</span>
                        <span class="text" v-else>{{ label ?? '' }}</span>
                    </slot>
                </div>
                <div v-else-if="uploading || attrs.uploading">
                    <div class="flex" gap-30>
                        <ProgressSpinner style="width: 20px; height: 20px;" animationDuration="2s" />
                        <div>Carregando arquivos</div>
                    </div>
                </div>
                <div v-else-if="show_error">
                    <slot name="error">
                        Ocorreu um erro ao fazer o upload.
                    </slot>
                </div>
            </template>
            <template #empty>
                <div @click.stop="openFolder" class="label-file-upload" v-if="files.length === 0 && (attrs.uploading === false || attrs.uploading === undefined)">
                    <slot>
                        <span class="text" v-if="attrs.disabled !== undefined && attrs.disabled !== false">{{ attrs['label-disabled'] ?? attrs.labelDisabled ?? attrs.label_disabled ?? label }}</span>
                        <span class="text" v-else>{{ label ?? '' }}</span>
                    </slot>
                    <slot name="error" v-if="show_error">
                        Ocorreu um erro ao fazer o upload.
                    </slot>
                </div>
            </template>
            <template #chooseicon>
                <div class="chose-icon-div">
                    <Icon icon="line-md:loading-loop" size="2" v-if="uploading"/>
                    <Icon icon="quill:folder-open" size="2" :id="`btn_open_${id}`" v-else />
                </div>
            </template>'
            <template #uploadicon>
                <div class="chose-icon-div" v-tooltip="'Enviar arquivo'">
                    <Icon icon="ic:baseline-file-upload" size="2" />
                </div>
            </template>
            <template #cancelicon>
                <div class="chose-icon-div">
                    <Icon icon="icons8:cancel" size="2" />
                </div>
            </template>
            <template #fileremoveicon>
                <div>
                    ok
                </div>
            </template>
            <template #filelabel>
                <div>ok2</div>
            </template>
        </FileUpload>
        <div class="file-upload-content-div" :disabled="attrs.disabled ?? false">
            <div class="files-icons" v-if="files_uploaded.length > 0">
                <div v-for="(file, index) in files_uploaded" :key="file.id" class="file-icon" @click="$emit('file-click', file)">
                    <icon i="ph:file-pdf-light" v-if="extension(file?.file_name) === 'pdf'" size="1.8" p0/>
                    <icon i="ph:file-jpg-light" v-if="extension(file?.file_name) === 'jpg' || file?.file_name?.split('.')?.pop() === 'jpeg'" size="1.8" p0 />
                    <icon i="ph:file-png-light" v-if="extension(file?.file_name) === 'png'" size="1.8" />
                    <icon i="fa:check-circle" class="file-check" size="0.7" />
                    <img :src="file?.thumbnail ? `/media/thumbnails/${file.thumbnail}` : file?.src" alt="Image" v-show="!file.file_name" />
                </div>
            </div>
        </div>
    </div>
</template>
<script setup lang="ts">
    const attrs: any = useAttrs();

    const props = withDefaults(
        defineProps<{
            modelValue: any[];
            token?: string;
            uploadData?: Record<string, any>;
            label?: string;
        }>(),
        { modelValue: () => [], uploadData: () => ({}), label: '' }
    );

    const id: string = Random();
    const files: Ref = ref([]);
    const label = ref(props.label);
    const uploading = ref(false);
    const show_error = ref(false);

    const emit = defineEmits(['update:modelValue', 'file-click', 'upload-error']);

    watch(show_error, () => {
        if (show_error.value) setTimeout(() => {
            show_error.value = false;
            files.value = [];
        }, 3000);
    });

    const files_uploaded: Ref = ref(props.modelValue);

    watch(
        () => props.modelValue,
        () => {
            files_uploaded.value = props.modelValue;
        }
    );

    watch(
        files_uploaded,
        () => {
            emit('update:modelValue', files_uploaded.value);
        },
        { deep: true }
    );

    const onSelect = (event: any) => {
        uploading.value = true;
        files.value = event.files;
    };

    const openFolder = () => {
        document.getElementById(`btn_open_${id}`)?.parentElement?.click();
    };

    const onUpload = (event: any) => {
        uploading.value = false;
        label.value = props.label ?? '';
        try {
            const serverResponse = JSON.parse(event.xhr.response);
            if(serverResponse.file) files_uploaded.value.push(serverResponse.file);
        } catch {}
    };

    const onError = (event: any) => {
        show_error.value = true;
        uploading.value = false;
        emit('upload-error', event);
    };

    const onBeforeUpload = (event: any) => {
        if (event.xhr) {
            if (props.token) event.xhr.setRequestHeader('X-CSRF-TOKEN', props.token);


            for (const key in props.uploadData) event.formData.append(key, props.uploadData[key]);


            if (files.value.length > 0) event.formData.append('extension', files.value[0].name.split('.').pop());

        }
    };

    const extension = (fileName: string) => {
        return fileName ? fileName.split('.').pop()?.toLowerCase() : '';
    };
</script>
<style lang="scss">
    .input-upload-file-main-div {
        &:not(.no-style) {
            height: 100%;
            width: 100%;
            border-radius: calc(1rem - 5px);
            padding-left: 0;
            position: relative;

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

                .p-fileupload-header {
                    padding: 0 !important;
                    display: grid;
                    grid-template-columns: auto auto 1fr;
                    height: 100%;
                    gap: 0;

                    span {
                        display: none;
                    }
                }

                .p-fileupload-file {
                    display: none;
                }

                .p-button {
                    display: grid;
                    place-items: center;
                    padding: 0;
                    height: 30px;
                    width: 30px;
                    background-color: var(--primary-c) !important;
                    border: none;
                    opacity: 1;
                    color: var(--text-b);
                    cursor: pointer;
                    z-index: 1;

                    span {
                        display: none;
                    }

                    &:hover {
                        background-color: var(--primary-mouse) !important;
                        border: none;
                        color: var(--icon-mouse);
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
                    }
                }

                &[disabled='false'] {
                    .label-file-upload {
                        font-weight: 400;
                        color: var(--background-600);

                        &:hover {
                            color: var(--blue-700) !important;
                        }
                    }
                }

                .label-file-upload {
                    transform: translateY(1px);
                    display: grid;
                    place-items: center start !important;
                    height: auto;
                    color: var(--background-600);

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

            .p-fileupload-cancel-button {
                display: none;
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


                .files-icons {
                    display: flex;
                    width: auto;
                    gap: 18px;
                    padding: 0 10px;
                    height: 30px;

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

                        &:hover {
                            .icon-div {
                                color: var(--blue-600) !important;

                                &.file-check {
                                    color: var(--green-b-800) !important;
                                }
                            }

                            .file-size {
                                color: var(--blue-600) !important;
                            }
                        }

                        .icon-div {
                            height: 30px;
                        }

                        .file-check {
                            position: absolute;
                            color: green !important;
                            top: 0;
                            left: -2px;
                            width: 16px;
                            height: 16px;
                        }

                        .file-size {
                            font-size: 9px;
                            color: var(--background-600);
                            text-align: center;
                            width: 100%;
                        }
                    }
                }
            }
        }

        .empty-file-upload {
            top: 0;
            width: 100%;
            height: 100%;
        }

        .p-fileupload-highlight {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            border-radius: calc(1rem - 5px);
        }
    }
</style>
