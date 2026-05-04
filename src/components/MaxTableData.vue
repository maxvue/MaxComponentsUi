<template>
    <div class="div-table-data-main">
        <DataTable v-bind="attrs" stripedRows>
            <template #empty>
                <slot name="empty"></slot>
            </template>
            <template #header>
                <slot name="header"></slot>
            </template>
            <slot></slot>
            <template #footer>
                <slot name="footer"></slot>
            </template>
        </DataTable>
    </div>
</template>

<script setup lang="ts">
    const attrs = useAttrs();
</script>

<style lang="scss">
    .div-table-data-main {
        position: relative;
        width: 100%;
        height: 100% !important;
        display: grid;
        grid-template-rows: 1fr;
        place-items: center;
        grid-column: span 24;
        border: 1px solid var(--primary-200);
        overflow: hidden;
        border-radius: 1rem !important;

        .p-datatable {
            width: 100%;

            .p-datatable-header {
                padding: 0 !important;
            }

            thead {
                tr {
                    th {
                        background-color: var(--blue-800) !important;
                        color: var(--background-100) !important;
                        border-bottom: none;
                        padding: 0;
                        width: 100%;
                        min-height: 36px;

                        &:not(:first-of-type) {
                            border-left: 1px solid var(--primary-d);
                        }

                        .p-datatable-column-header-content {
                            width: 100%;
                            place-items: center;
                            display: grid;
                            height: 100%;
                        }
                    }
                }
            }

            tbody {
                tr {
                    border: none;

                    &.p-row-even {
                        background-color: var(--primary-50);
                    }

                    td {
                        width: 100%;
                        min-height: 40px;
                        border-bottom: none;
                        padding: 4px !important;
                        position: relative;
                    }

                    [data-pc-section='emptymessagecell'] {
                        min-height: 0 !important;
                        padding: 0 !important;
                    }
                }
            }

            .p-datatable-footer {
                padding: 0;
                border: none;
            }
        }
    }
</style>
