<template>
    <div class="max-table-main-div" >
        <DataTable v-bind="attrs" stripedRows >
            <template v-for="name in slotNames" #[name]="slotProps" :key="name">
                <slot :name="name" v-bind="slotProps || {}"></slot>
            </template>
        </DataTable>
    </div>
</template>

<script setup lang="ts">
    import DataTable from 'primevue/datatable';
    import { useAttrs, useSlots, computed } from 'vue';

    const attrs = useAttrs();
    const slots = useSlots();

    const slotNames = computed<string[]>(() => Object.keys(slots || {}));
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
                position: relative !important;
                background-color: var(--background-225);

                .p-virtualscroller {
                    height: 100%;
                    max-height: 100%;
                    overflow: auto;
                }

                .p-datatable-table,
                table {
                    padding: 0 !important;
                    width: 100% !important;
                    position: relative !important;

                    .p-datatable-thead {
                        height: 40px !important;
                        z-index: 1 !important;
                        font-family: Jost, sans-serif;

                        tr {
                            background-color: transparent !important;
                            position: sticky !important;
                            top: 0;
                            height: 40px !important;

                            th {
                                font-family: Jost, sans-serif;
                                padding: 3px 0;
                                background-color: var(--blue-800) !important;
                                color: var(--blue-200) !important;
                                position: relative;
                                font-weight: 400 !important;

                                .icon-div {
                                    color: var(--blue-200);
                                }

                                &:last-of-type {
                                    width: 140px;
                                }

                                &.col-expires-at {
                                    display: grid;
                                    place-items: center;
                                    height: 40px;

                                    .p-datatable-column-header-content {
                                        grid-template-columns: auto;
                                        place-items: center;

                                        .iconOrder {
                                            width: 20px;
                                        }
                                    }
                                }

                                .p-datatable-column-header-content {
                                    position: relative;
                                    display: grid;
                                    grid-template-columns: 1fr;
                                    border: none !important;
                                    height: 100%;
                                    place-items: center start;
                                    width: 100%;

                                    .p-datatable-column-title {
                                        grid-column: 2 !important;
                                        height: auto;
                                        font-weight: 400 !important;
                                    }

                                    span {
                                        grid-column: 1;
                                        grid-row: 1;
                                    }

                                    .titulo {
                                        grid-column: 2;
                                        grid-row: 1;
                                    }

                                    .input-search-list-data-table {
                                        grid-column: span 2;
                                        width: 100%;
                                        height: 100%;
                                        grid-template-columns: auto 1fr;
                                        display: grid;
                                        place-items: center;
                                        gap: 10px;
                                        padding: 3px 10px 3px 0;

                                        .icon-filter-dashboard-data-table {
                                            color: var(--background-650) !important;
                                        }
                                    }
                                }
                            }
                        }
                    }

                    .column-name {
                        height: 100%;

                        .column-name-and-status {
                            display: grid;
                            grid-template-columns: 1fr auto;
                            place-items: center start;
                            gap: 15px;

                            .status {
                                display: grid;
                                grid-template-columns: auto 1fr;
                                gap: 5px;
                                place-items: center;
                                padding: 3px 10px;
                                border-radius: 10px;
                            }
                        }
                    }

                    // LINHAS COM OS DADOS
                    .p-datatable-tbody {
                        position: relative;

                        tr {
                            &:not(.p-datatable-empty-message) {
                                max-height: 64px !important;
                                height: 64px !important;

                                td {
                                    max-height: 64px !important;
                                    height: 64px !important;
                                }
                            }

                            // LINHA IMPAR
                            &.p-row-even {
                                background-color: var(--primary-25) !important;
                            }

                            // LINHA PAR
                            &.p-row-odd {
                                background-color: var(--primary-125) !important;
                            }

                            td {
                                position: relative;
                                max-height: 64px !important;
                                height: 64px !important;
                                border: none;
                                padding: 0;
                                cursor: pointer;

                                &:first-of-type,
                                &:last-of-type {
                                    position: relative;
                                    padding: 0 !important;

                                    .p-datatable-row-toggle-button {
                                        position: relative;
                                        color: var(--text-600) !important;
                                        width: 30px;
                                        height: 64px;
                                        display: grid;
                                        place-items: center;
                                        padding-left: 8px;
                                    }
                                }

                                .data-table-dashboard-div-expander-button {
                                    width: 40px;
                                    display: grid;
                                    place-items: center;
                                }

                                &.expander-div {
                                    .ldn {
                                        display: grid;
                                        grid-template-rows: 1fr 1fr;
                                    }
                                }

                                &.colCss {
                                    position: relative;

                                    .image-logo-css {
                                        display: grid;
                                        place-items: center;
                                        height: 100%;
                                        width: 120px;

                                        img {
                                            max-width: 80px;
                                            max-height: 36px;
                                        }
                                    }
                                }

                                &.col-obs-btns {
                                    .col-obs-div {
                                        display: grid;
                                        grid-template-columns: repeat(8, 1fr);
                                        gap: 2px;
                                        padding: 0 5px 0 0;
                                        place-items: center;
                                        height: 100%;
                                        position: relative;

                                        .ldn {
                                            display: grid;
                                            grid-template-columns: 1fr 1fr 1fr;
                                        }

                                        .col-obs-div-input-main-div {
                                            opacity: 0.6 !important;
                                        }
                                    }
                                }

                                .ldn {
                                    height: 100%;
                                    display: grid;
                                    place-items: center start;
                                }

                                .line-content {
                                    height: 64px;
                                    width: 100%;
                                    display: grid;
                                    place-items: center start;
                                    padding: 0 10px;
                                }
                            }
                        }

                        .p-datatable-row-expansion {
                            position: relative;

                            td {
                                .line-content {
                                    height: auto;
                                    position: relative;

                                    .conteudo_collapsible {
                                        padding: 0;
                                    }
                                }
                            }

                            .project-tool {
                                border: 1px solid var(--primary-200) !important;
                            }
                        }
                    }
                }
            }
        }
    }
</style>
