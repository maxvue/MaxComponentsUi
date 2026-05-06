<template>
    <div class="tabela-main-div">
        <DataTable v-model:expandedRows="expandedRows" v-bind="attrs" v-if="!attrs.loading">
            <slot></slot>
            <template #expansion="slotProps">
                <slot name="expansion" v-bind="slotProps">
                </slot>
            </template>
        </DataTable>
        <InternalLoading v-else :msg="loadingMessage" />
    </div>
</template>

/**
 * Componente de tabela estendido do PrimeVue DataTable.
 * Aplica estilos personalizados do ecossistema Max e simplifica o uso de expansão de linhas.
 */
<script setup lang="ts">
    import { useAttrs } from 'vue';
    import DataTable from 'primevue/datatable';
    const attrs = useAttrs();
    const props = defineProps({
        /** Mensagem exibida durante o carregamento */
        loadingMessage: {
            type: String,
            default: 'Carregando dados...'
        }
    });

    /** Linhas expandidas na tabela (suporta v-model) */
    const expandedRows = defineModel<any[]>({ default: () => [] });
</script>


<style lang="scss">
    .tabela-main-div {
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

                .p-datatable-table,
                table {
                    padding: 0 !important;
                    width: 100% !important;
                    position: relative !important;

                    // CABEÇALHO
                    .p-datatable-thead {
                        height: 40px;
                        z-index: 1 !important;
                        font-family: Jost, sans-serif;

                        tr {
                            background-color: transparent !important;
                            position: sticky !important;
                            top: 0;
                            width: 100%;

                            th {
                                font-family: Jost, sans-serif;
                                padding: 3px 0;
                                background-color: var(--blue-800) !important;
                                color: var(--blue-200) !important;
                                position: relative;
                                font-weight: 400 !important;

                                .icon-div {
                                    color: var(--blue-200) !important;
                                }

                                &:last-of-type {
                                    width: 140px;
                                }

                                .p-datatable-column-header-content {
                                    position: relative;
                                    display: grid;
                                    grid-template-columns: auto 1fr;
                                    border: none !important;
                                    height: 100%;
                                    place-items: center start;
                                    width: 100%;
                                    gap: 0;
                                    font-weight: 400 !important;

                                    .p-datatable-column-title {
                                        width: 100%;
                                        grid-column: 2;
                                        font-weight: 400 !important;
                                    }
                                }
                            }
                        }
                    }

                    // LINHAS COM OS DADOS
                    .p-datatable-tbody {
                        height: 64px !important;

                        tr {
                            max-height: 64px !important;
                            height: 64px !important;

                            td {
                                position: relative;
                                max-height: 64px !important;
                                height: 64px !important;

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
                            }

                            // LINHA IMPAR
                            &.p-row-even {
                                background-color: var(--background-25);
                            }

                            &.p-row-even + tr {
                                &.p-datatable-row-expansion {
                                    background-color: var(--background-25);
                                }
                            }

                            // LINHA PAR
                            &.p-row-odd {
                                background-color: var(--background-125);
                            }

                            &.p-row-odd + tr {
                                &.p-datatable-row-expansion {
                                    background-color: var(--background-125);
                                }
                            }

                            td {
                                border: none;
                                padding: 0;
                                cursor: pointer;

                                .ldn {
                                    height: 100%;
                                    display: grid;
                                    place-items: center start;
                                }
                            }
                        }
                    }
                }
            }
        }
    }
</style>
