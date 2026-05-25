<template>

</template>
<script setup lang="ts">


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
