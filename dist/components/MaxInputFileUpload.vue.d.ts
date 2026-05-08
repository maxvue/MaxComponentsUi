type __VLS_Props = {
    /** Token CSRF para autenticação no upload */
    token?: string;
    /** Dados adicionais para enviar via FormData no upload */
    uploadData?: Record<string, any>;
    /** Rótulo descritivo do campo */
    label?: string;
    /** Campo da resposta da API que contém os dados do arquivo (vazio para usar a resposta completa) */
    responseField?: string;
};
type __VLS_PublicProps = {
    modelValue?: any[];
} & __VLS_Props;
declare function __VLS_template(): {
    attrs: Partial<{}>;
    slots: {
        default?(_: {}): any;
        default?(_: {}): any;
        error?(_: {}): any;
        error?(_: {}): any;
    };
    refs: {
        fileUploadRef: ({
            $props: import('primevue/fileupload').FileUploadProps & import('vue').VNodeProps & import('vue').AllowedComponentProps & import('vue').ComponentCustomProps;
            $slots: import('primevue/fileupload').FileUploadSlots;
            $emit: ((e: "clear") => void) & ((e: "progress", event: import('primevue/fileupload').FileUploadProgressEvent) => void) & ((e: "select", event: import('primevue/fileupload').FileUploadSelectEvent) => void) & ((e: "error", event: import('primevue/fileupload').FileUploadErrorEvent) => void) & ((e: "before-upload", event: import('primevue/fileupload').FileUploadBeforeUploadEvent) => void) & ((e: "upload", event: import('primevue/fileupload').FileUploadUploadEvent) => void) & ((e: "uploader", event: import('primevue/fileupload').FileUploadUploaderEvent) => void) & ((e: "before-send", event: import('primevue/fileupload').FileUploadBeforeSendEvent) => void) & ((e: "remove", event: import('primevue/fileupload').FileUploadRemoveEvent) => void) & ((e: "removeUploadedFile", event: import('primevue/fileupload').FileUploadRemoveUploadedFile) => void);
        } & import('primevue/fileupload').FileUploadMethods) | null;
    };
    rootEl: HTMLDivElement;
};
type __VLS_TemplateResult = ReturnType<typeof __VLS_template>;
declare const __VLS_component: import('vue').DefineComponent<__VLS_PublicProps, {}, {}, {}, {}, import('vue').ComponentOptionsMixin, import('vue').ComponentOptionsMixin, {
    "file-click": (...args: any[]) => void;
    "upload-error": (...args: any[]) => void;
    "update:modelValue": (value: any[]) => void;
}, string, import('vue').PublicProps, Readonly<__VLS_PublicProps> & Readonly<{
    "onUpdate:modelValue"?: ((value: any[]) => any) | undefined;
    "onFile-click"?: ((...args: any[]) => any) | undefined;
    "onUpload-error"?: ((...args: any[]) => any) | undefined;
}>, {
    label: string;
    uploadData: Record<string, any>;
    responseField: string;
}, {}, {}, {}, string, import('vue').ComponentProvideOptions, false, {
    fileUploadRef: ({
        $props: import('primevue/fileupload').FileUploadProps & import('vue').VNodeProps & import('vue').AllowedComponentProps & import('vue').ComponentCustomProps;
        $slots: import('primevue/fileupload').FileUploadSlots;
        $emit: ((e: "clear") => void) & ((e: "progress", event: import('primevue/fileupload').FileUploadProgressEvent) => void) & ((e: "select", event: import('primevue/fileupload').FileUploadSelectEvent) => void) & ((e: "error", event: import('primevue/fileupload').FileUploadErrorEvent) => void) & ((e: "before-upload", event: import('primevue/fileupload').FileUploadBeforeUploadEvent) => void) & ((e: "upload", event: import('primevue/fileupload').FileUploadUploadEvent) => void) & ((e: "uploader", event: import('primevue/fileupload').FileUploadUploaderEvent) => void) & ((e: "before-send", event: import('primevue/fileupload').FileUploadBeforeSendEvent) => void) & ((e: "remove", event: import('primevue/fileupload').FileUploadRemoveEvent) => void) & ((e: "removeUploadedFile", event: import('primevue/fileupload').FileUploadRemoveUploadedFile) => void);
    } & import('primevue/fileupload').FileUploadMethods) | null;
}, HTMLDivElement>;
declare const _default: __VLS_WithTemplateSlots<typeof __VLS_component, __VLS_TemplateResult["slots"]>;
export default _default;
type __VLS_WithTemplateSlots<T, S> = T & {
    new (): {
        $slots: S;
    };
};
//# sourceMappingURL=MaxInputFileUpload.vue.d.ts.map