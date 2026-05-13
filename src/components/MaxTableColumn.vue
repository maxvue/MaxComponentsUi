<template>

 
</template>

<script setup lang="ts">
    import Column from 'primevue/column';
    import { ref } from 'vue';
    import { useElementSize } from '@maxvue/max-use';

    const el = ref('el');
    const { width } = useElementSize(el as any);

</script>


<style lang="scss">
.max-table-main-div {
    border-radius: 1rem;
    overflow: hidden !important;
    max-height: 100%;
    width: calc(100% - 4px);
    height: calc(100% - 4px);
    border: 1px solid var(--background-300) !important;
    position: relative;

    .p-datatable {
        height: 100%;

        .p-datatable-table-container {
            height: 100%;
            background-color: transparent;
            display: grid;
            padding: 0;

            table {
                padding: 0 !important;
                display: grid !important;
                grid-template-rows: 40px 1fr;
                height: 100% !important;
                width: 100% !important;

                thead {
                    height: 100% !important;
                    width: 100% !important;
                    z-index: 1 !important;
                    font-family: Jost, sans-serif;
                    display: grid;
                    background-color: transparent !important;

                    tr {
                        position: sticky !important;
                        height: 40px !important;
                        min-width: 100% !important;
                        display: flex;
                        padding: 0 6px !important;
                        gap: 6px;
                        background-color: var(--blue-800) !important;

                        th {
                            padding: 0;
                            background-color: transparent !important;
                            color: var(--blue-200) !important;
                            position: relative;
                            font-weight: 400 !important;
                            flex-grow: 1;
                            border: none !important;

                            .p-datatable-column-header-content {
                                position: relative;
                                display: grid;
                                grid-template-columns: 1fr !important;
                                height: 100%;
                                place-items: center;
                                width: 100%;

                                .p-datatable-column-title {
                                    width: 100%;
                                    height: 100%;
                                    text-align: center;
                                    display: grid;
                                    place-items: center;
                                }
                            }
                        }
                    }
                }

                // LINHAS COM OS DADOS
                tbody {
                    width: 100% !important;
                    z-index: 1 !important;
                    font-family: Jost, sans-serif;
                    display: grid;

                    tr {
                        width: 100% !important;
                        display: flex;
                        height: auto !important;
                        padding: 0 6px !important;
                        gap: 6px;

                        // LINHA IMPAR
                        &.p-row-even {
                            background-color: var(--primary-25) !important;
                        }

                        // LINHA PAR
                        &.p-row-odd {
                            background-color: var(--primary-100) !important;
                        }

                        td {
                            flex-grow: 1;
                            padding: 0 !important;
                            display: grid;
                            place-items: center;

                            .max-input-main-div {
                                grid-template-rows: 1fr !important;

                                .message-spacer, .input-message {
                                    display: none !important;
                                }
                            }
                        }

                        .max-table-buttons {
                            display: flex;
                            flex-direction: row;
                            gap: 5px;
                            width: 100%;

                            .icon-div {
                                flex-grow: 1;
                            }
                        }
                    }
                }
            }
        }
    }
}
</style>
