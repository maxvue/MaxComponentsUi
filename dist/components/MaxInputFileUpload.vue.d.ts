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
type __VLS_ModelProps = {
    modelValue?: any[];
};
type __VLS_PublicProps = __VLS_Props & __VLS_ModelProps;
declare var __VLS_15: {}, __VLS_22: {}, __VLS_25: {}, __VLS_27: {};
type __VLS_Slots = {} & {
    default?: (props: typeof __VLS_15) => any;
} & {
    error?: (props: typeof __VLS_22) => any;
} & {
    default?: (props: typeof __VLS_25) => any;
} & {
    error?: (props: typeof __VLS_27) => any;
};
declare const __VLS_base: import("vue").DefineComponent<__VLS_PublicProps, {}, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {
    "file-click": (...args: any[]) => void;
    "upload-error": (...args: any[]) => void;
    "update:modelValue": (value: any[]) => void;
}, string, import("vue").PublicProps, Readonly<__VLS_PublicProps> & Readonly<{
    "onUpdate:modelValue"?: ((value: any[]) => any) | undefined;
    "onFile-click"?: ((...args: any[]) => any) | undefined;
    "onUpload-error"?: ((...args: any[]) => any) | undefined;
}>, {
    uploadData: Record<string, any>;
    label: string;
    responseField: string;
}, {}, {}, {}, string, import("vue").ComponentProvideOptions, false, {}, any>;
declare const __VLS_export: __VLS_WithSlots<typeof __VLS_base, __VLS_Slots>;
declare const _default: typeof __VLS_export;
export default _default;
type __VLS_WithSlots<T, S> = T & {
    new (): {
        $slots: S;
    };
};
//# sourceMappingURL=MaxInputFileUpload.vue.d.ts.map