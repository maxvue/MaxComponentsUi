<template>
    <div class="max-table-main-div">
        <div class="p-datatable">
            <div class="p-datatable-table-container">
                <table>
                    <thead v-if="slots.header">
                        <tr>
                            <slot name="header" />
                        </tr>
                    </thead>
                    <tbody>
                        <template v-for="name in slotNames.filter(n => n !== 'buttons' && n !== 'header' && n !== 'footer')" :key="name">
                            <slot :name="name" v-bind="{}" />
                        </template>
                        <slot />
                        <tr v-if="slotNames.includes('buttons')" class="p-column max-table-column-buttons" :style="`width: ${width}px; max-width: ${width}px;`">
                            <td class="p-datatable-cell">
                                <div class="max-table-buttons" ref="el">
                                    <slot name="buttons" v-bind="{ data: {}, index: 0 }" />
                                </div>
                            </td>
                        </tr>
                    </tbody>
                    <tfoot v-if="slots.footer">
                        <tr>
                            <slot name="footer" />
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { useAttrs, useSlots, computed, ref, useTemplateRef, watch } from 'vue';
    import { useElementSize } from '@maxvue/max-use';

    const _attrs = useAttrs();
    const slots: Record<string, any> = useSlots() as Record<string, any>;

    const slotNames = computed<string[]>(() => Object.keys(slots || {}));

    const el = useTemplateRef('el');
    const width = ref(1);
    const { width: calculated_width } = useElementSize(el as any);

    watch(calculated_width, () => {
        if (calculated_width.value === 0) return;
        if (width.value > 1) return;
        else if (width.value === 1 && calculated_width.value > 0) width.value = calculated_width.value + 10;
    }, { immediate: true });

    defineExpose({
        width
    });
</script>

<style lang="scss">
.max-table-main-div {
    border-radius: 1rem;
    overflow: hidden !important;
    max-height: 100%;
    width: 100%;
    height: 100%;
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
                            height: 100%;

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
                    display: flex !important;
                    flex-direction: column;

                    tr {
                        width: 100% !important;
                        display: flex;
                        height: auto !important;
                        gap: 0 6px;
                        padding: 3px 6px !important;

                        &:first-of-type {
                            padding-top: 6px !important;
                        }

                        &:last-of-type {
                            padding-bottom: 6px !important;
                        }

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
                            outline: none !important;
                            border: none !important;
                            border-radius: 0 !important;

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
                            gap: 8px;
                            width: auto;
                            padding: 0 6px;
                        }
                    }
                }
            }
        }
    }
}
</style>
