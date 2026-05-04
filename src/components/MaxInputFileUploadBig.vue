<template>
    <div class="input-upload-file-big-main-div">
        <MaxInputFileUpload v-bind="attrs" :modelValue="(attrs.modelValue as any)" class="no-style" customUpload >
            <slot>
                <Icon i="lets-icons:upload-light" size="1.5"/>
                <div v-html="attrs.label"></div>
            </slot>
            <template #uploading>
                <slot name="uploading">
                    <div class="screen-animation">
                        <DotLottieVue style="height: 300px; width: 300px;"   background="red" autoplay loop src="https://lottie.host/1c897063-7dec-4b92-b8db-ecd2cd67f48e/ofrND79jXr.lottie" />
                    </div>
                </slot>
            </template>
            <template #error>
                <slot name="error">
                    <div class="screen-animation">
                        <DotLottieVue style="height: 300px; width: 300px;"   background="red" autoplay src="https://lottie.host/b1aebee5-5e8b-4008-acd5-fc651795bbf6/ghW5oHG5ml.lottie" />
                        <div class="screen-animation-label">
                            Erro ao enviar o arquivo.
                        </div>
                    </div>
                </slot>
            </template>
        </MaxInputFileUpload>
    </div>
</template>
<script setup lang="ts">
    import { DotLottieVue } from '@lottiefiles/dotlottie-vue';
    const attrs = useAttrs();
</script>

<style lang="scss">
    .input-upload-file-big-main-div {
        height: 100%;
        width: 100%;

        .input-upload-file-main-div {
            height: 100%;
            width: 100%;
            border-radius: calc(1rem - 5px);
            padding-left: 0;
            outline: 1px dashed var(--background-600);
            background-color: var(--background-0);
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

        .item-thumbnail {
            max-width: 300px;
            display: grid;
            place-items: center;
            gap: 8px;

            .file-image {
                padding: 10px 10px 0;
                position: relative;

                .file-image-img-div {
                    max-height: 160px;
                    overflow: hidden;
                    border: 1px solid var(--background-300);
                    border-radius: 7px;
                }

                .not-found {
                    height: 300px;
                    width: 270px;
                    display: grid;
                    place-items: center;
                }

                .open-file {
                    position: absolute;
                    top: 10px;
                    left: 10px;
                    width: calc(100% - 20px);
                    height: calc(100% - 10px);
                    display: grid;
                    place-items: center;
                    cursor: pointer;
                    background-color: rgb(0 0 0);
                    opacity: 0;
                    transition: opacity 0.2s;
                    border-radius: 7px;

                    &:hover {
                        opacity: 0.5;
                    }

                    .icon-div {
                        color: var(--background-0) !important;
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
            height: 100%;
            border-radius: calc(1rem - 5px);
            outline: 3px dashed var(--blue-700);
        }

        .screen-animation {
            display: grid;
            place-items: center;

            .screen-animation-label {
                font-size: 1.2rem;
                font-weight: 500;
                color: var(--red-600);
            }
        }
    }
</style>
