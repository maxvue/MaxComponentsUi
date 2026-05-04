declare function __VLS_template(): {
    attrs: Partial<{}>;
    slots: {
        default?(_: {}): any;
        expansion?(_: {
            data: any;
            index: number;
        }): any;
    };
    refs: {
        element_ref: ({
            $props: import('primevue/datatable').DataTableProps<any> & import('vue').VNodeProps & import('vue').AllowedComponentProps & import('vue').ComponentCustomProps;
            $slots: import('primevue/datatable').DataTableSlots<any>;
            $emit: ((e: "filter", event: import('primevue/datatable').DataTableFilterEvent) => void) & ((e: "sort", event: import('primevue/datatable').DataTableSortEvent) => void) & ((e: "value-change", value: any[]) => void) & ((e: "update:first", value: number) => void) & ((e: "update:rows", value: number) => void) & ((e: "update:sortField", value: string) => void) & ((e: "update:sortOrder", value: number | undefined) => void) & ((e: "update:multiSortMeta", value: import('primevue/datatable').DataTableSortMeta[] | null | undefined) => void) & ((e: "update:selection", value: any) => void) & ((e: "update:contextMenuSelection", value: any) => void) & ((e: "update:expandedRows", value: any[] | import('primevue/datatable').DataTableExpandedRows) => void) & ((e: "update:expandedRowGroups", value: any[] | import('primevue/datatable').DataTableExpandedRows) => void) & ((e: "update:filters", value: import('primevue/datatable').DataTableFilterMeta) => void) & ((e: "update:editingRows", value: any[] | import('primevue/datatable').DataTableEditingRows) => void) & ((e: "page", event: import('primevue/datatable').DataTablePageEvent) => void) & ((e: "row-click", event: import('primevue/datatable').DataTableRowClickEvent<any>) => void) & ((e: "row-dblclick", event: import('primevue/datatable').DataTableRowDoubleClickEvent) => void) & ((e: "row-contextmenu", event: import('primevue/datatable').DataTableRowContextMenuEvent) => void) & ((e: "row-select", event: import('primevue/datatable').DataTableRowSelectEvent<any>) => void) & ((e: "row-select-all", event: import('primevue/datatable').DataTableRowSelectAllEvent<any>) => void) & ((e: "row-unselect-all", event: import('primevue/datatable').DataTableRowUnselectAllEvent) => void) & ((e: "row-unselect", event: import('primevue/datatable').DataTableRowUnselectEvent) => void) & ((e: "select-all-change", event: import('primevue/datatable').DataTableSelectAllChangeEvent) => void) & ((e: "column-resize-end", event: import('primevue/datatable').DataTableColumnResizeEndEvent) => void) & ((e: "column-reorder", event: import('primevue/datatable').DataTableColumnReorderEvent) => void) & ((e: "row-reorder", event: import('primevue/datatable').DataTableRowReorderEvent) => void) & ((e: "row-expand", event: import('primevue/datatable').DataTableRowExpandEvent<any>) => void) & ((e: "row-collapse", event: import('primevue/datatable').DataTableRowCollapseEvent) => void) & ((e: "rowgroup-expand", event: import('primevue/datatable').DataTableRowExpandEvent<any>) => void) & ((e: "rowgroup-collapse", event: import('primevue/datatable').DataTableRowCollapseEvent) => void) & ((e: "cell-edit-init", event: import('primevue/datatable').DataTableCellEditInitEvent<any>) => void) & ((e: "cell-edit-complete", event: import('primevue/datatable').DataTableCellEditCompleteEvent<any>) => void) & ((e: "cell-edit-cancel", event: import('primevue/datatable').DataTableCellEditCancelEvent) => void) & ((e: "row-edit-init", event: import('primevue/datatable').DataTableRowEditInitEvent<any>) => void) & ((e: "row-edit-save", event: import('primevue/datatable').DataTableRowEditSaveEvent<any>) => void) & ((e: "row-edit-cancel", event: import('primevue/datatable').DataTableRowEditCancelEvent<any>) => void) & ((e: "state-restore", event: import('primevue/datatable').DataTableStateEvent<any>) => void) & ((e: "state-save", event: import('primevue/datatable').DataTableStateEvent<any>) => void);
        } & import('primevue/datatable').DataTableMethods) | null;
    };
    rootEl: HTMLDivElement;
};
type __VLS_TemplateResult = ReturnType<typeof __VLS_template>;
declare const __VLS_component: import('vue').DefineComponent<globalThis.ExtractPropTypes<{
    modelValue: {
        default: string;
    };
}>, {}, {}, {}, {}, import('vue').ComponentOptionsMixin, import('vue').ComponentOptionsMixin, {}, string, import('vue').PublicProps, Readonly<globalThis.ExtractPropTypes<{
    modelValue: {
        default: string;
    };
}>> & Readonly<{}>, {
    modelValue: string;
}, {}, {}, {}, string, import('vue').ComponentProvideOptions, true, {
    element_ref: ({
        $props: import('primevue/datatable').DataTableProps<any> & import('vue').VNodeProps & import('vue').AllowedComponentProps & import('vue').ComponentCustomProps;
        $slots: import('primevue/datatable').DataTableSlots<any>;
        $emit: ((e: "filter", event: import('primevue/datatable').DataTableFilterEvent) => void) & ((e: "sort", event: import('primevue/datatable').DataTableSortEvent) => void) & ((e: "value-change", value: any[]) => void) & ((e: "update:first", value: number) => void) & ((e: "update:rows", value: number) => void) & ((e: "update:sortField", value: string) => void) & ((e: "update:sortOrder", value: number | undefined) => void) & ((e: "update:multiSortMeta", value: import('primevue/datatable').DataTableSortMeta[] | null | undefined) => void) & ((e: "update:selection", value: any) => void) & ((e: "update:contextMenuSelection", value: any) => void) & ((e: "update:expandedRows", value: any[] | import('primevue/datatable').DataTableExpandedRows) => void) & ((e: "update:expandedRowGroups", value: any[] | import('primevue/datatable').DataTableExpandedRows) => void) & ((e: "update:filters", value: import('primevue/datatable').DataTableFilterMeta) => void) & ((e: "update:editingRows", value: any[] | import('primevue/datatable').DataTableEditingRows) => void) & ((e: "page", event: import('primevue/datatable').DataTablePageEvent) => void) & ((e: "row-click", event: import('primevue/datatable').DataTableRowClickEvent<any>) => void) & ((e: "row-dblclick", event: import('primevue/datatable').DataTableRowDoubleClickEvent) => void) & ((e: "row-contextmenu", event: import('primevue/datatable').DataTableRowContextMenuEvent) => void) & ((e: "row-select", event: import('primevue/datatable').DataTableRowSelectEvent<any>) => void) & ((e: "row-select-all", event: import('primevue/datatable').DataTableRowSelectAllEvent<any>) => void) & ((e: "row-unselect-all", event: import('primevue/datatable').DataTableRowUnselectAllEvent) => void) & ((e: "row-unselect", event: import('primevue/datatable').DataTableRowUnselectEvent) => void) & ((e: "select-all-change", event: import('primevue/datatable').DataTableSelectAllChangeEvent) => void) & ((e: "column-resize-end", event: import('primevue/datatable').DataTableColumnResizeEndEvent) => void) & ((e: "column-reorder", event: import('primevue/datatable').DataTableColumnReorderEvent) => void) & ((e: "row-reorder", event: import('primevue/datatable').DataTableRowReorderEvent) => void) & ((e: "row-expand", event: import('primevue/datatable').DataTableRowExpandEvent<any>) => void) & ((e: "row-collapse", event: import('primevue/datatable').DataTableRowCollapseEvent) => void) & ((e: "rowgroup-expand", event: import('primevue/datatable').DataTableRowExpandEvent<any>) => void) & ((e: "rowgroup-collapse", event: import('primevue/datatable').DataTableRowCollapseEvent) => void) & ((e: "cell-edit-init", event: import('primevue/datatable').DataTableCellEditInitEvent<any>) => void) & ((e: "cell-edit-complete", event: import('primevue/datatable').DataTableCellEditCompleteEvent<any>) => void) & ((e: "cell-edit-cancel", event: import('primevue/datatable').DataTableCellEditCancelEvent) => void) & ((e: "row-edit-init", event: import('primevue/datatable').DataTableRowEditInitEvent<any>) => void) & ((e: "row-edit-save", event: import('primevue/datatable').DataTableRowEditSaveEvent<any>) => void) & ((e: "row-edit-cancel", event: import('primevue/datatable').DataTableRowEditCancelEvent<any>) => void) & ((e: "state-restore", event: import('primevue/datatable').DataTableStateEvent<any>) => void) & ((e: "state-save", event: import('primevue/datatable').DataTableStateEvent<any>) => void);
    } & import('primevue/datatable').DataTableMethods) | null;
}, HTMLDivElement>;
declare const _default: __VLS_WithTemplateSlots<typeof __VLS_component, __VLS_TemplateResult["slots"]>;
export default _default;
type __VLS_WithTemplateSlots<T, S> = T & {
    new (): {
        $slots: S;
    };
};
//# sourceMappingURL=MaxTable.vue.d.ts.map