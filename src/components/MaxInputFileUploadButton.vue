<template>
    <div class="input-upload-file-button-main-div">
        <MaxInputFileUpload v-bind="attrs" :modelValue="(attrs.modelValue as any)" class="no-style" customUpload :onUpload="onUpload">
            <slot>
                <div class="slot-main-div">
                    <Icon :i="attrs.ico ?? attrs.icon ?? attrs.i ?? 'material-symbols:upload-rounded'" size="1.4" />
                    <div v-if="props.label" pl-10 class="input-file-button-label">{{ props.label }}</div>
                </div>
            </slot>
        </MaxInputFileUpload>
    </div>
</template>
<script setup lang="ts">
    import { useAttrs } from 'vue';
    import MaxInputFileUpload from './MaxInputFileUpload.vue';

    const props = defineProps<{
        /** Rótulo textual do botão */
        label?: string;
    }>();

    const attrs = useAttrs();

    const emit = defineEmits(['upload']);

    const onUpload = (files: any) => {
        emit('upload', files);
    };
</script>

<style lang="scss">
    .input-upload-file-button-main-div {
        position: absolute;
        height: 100%;
        width: 30px;

        .input-upload-file-main-div {
            height: 100%;
            width: 100%;
            border-radius: calc(1rem - 5px);
            padding-left: 0;
            background-color: var(--background-0);
            position: relative;

            .p-fileupload {
                display: grid;
                grid-template-columns: auto 1fr;
                place-items: center;
                border: none;
                max-height: 100% !important;
                background-color: transparent;
                padding: 0 10px;
                position: relative;

                .slot-main-div {
                    display: grid;
                    place-items: center;
                    grid-template-columns: 1fr auto;

                    .input-file-button-label {
                        color: var(--background-0);
                        font-size: 0.9rem;
                    }
                }

                .p-fileupload-header {
                    padding: 0;
                    display: grid;
                    grid-template-columns: auto auto 1fr;
                    height: 100%;
                    gap: 0;

                    span {
                        display: none;
                    }
                }

                .p-fileupload-file, .chose-icon-div {
                    display: none;
                }

                .label-file-upload {
                    transform: translateY(1px);
                    display: grid;
                    place-items: center !important;
                    height: auto;
                    color: var(--background-600);
                    gap: 10px;
                    text-align: center;
                    font-size: 1rem;

                }
            }

            .p-fileupload-content {
                height: 100%;
                display: grid;
                grid-template-rows: 1fr auto;
                gap: 0;
                place-items: center;
                padding: 0 !important;
                width: 100%;
                font-size: 0.95rem;
                font-weight: 300 !important;
                color: var(--text-c);
                cursor: pointer;
                border: none !important;
                position: absolute;
                border-radius: calc(1rem - 5px);

                &:hover {
                    .icon-div, .label-file-upload {
                        color: var(--blue-700) !important;
                    }
                }
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

                // grid-template-columns: auto;
                width: auto;


                .files-icons {
                    display: flex;
                    width: auto;
                    gap: 18px;
                    padding: 0 10px;
                    height: 50px;

                    .icon-div {
                        height: calc(100% - 20px);
                        padding-top: 5px;
                    }

                    .file-icon {
                        position: relative;
                        width: 35px;
                        text-align: center;
                        display: grid;
                        gap: 0;
                        place-items: center;
                        padding-bottom: 5px;

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
                            height: calc(100%);
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
    }
</style>
