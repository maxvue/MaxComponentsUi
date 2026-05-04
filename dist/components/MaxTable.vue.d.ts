declare var __VLS_7: {}, __VLS_10: {
    data: any;
    index: number;
};
type __VLS_Slots = {} & {
    default?: (props: typeof __VLS_7) => any;
} & {
    expansion?: (props: typeof __VLS_10) => any;
};
declare const __VLS_base: import("vue").DefineComponent<globalThis.ExtractPropTypes<{
    /** Mensagem exibida durante o carregamento */
    loadingMessage: {
        type: StringConstructor;
        default: string;
    };
    modelValue: {
        type: globalThis.PropType<any[]>;
    };
}>, {}, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {
    "update:modelValue": (value: any[]) => any;
}, string, import("vue").PublicProps, Readonly<globalThis.ExtractPropTypes<{
    /** Mensagem exibida durante o carregamento */
    loadingMessage: {
        type: StringConstructor;
        default: string;
    };
    modelValue: {
        type: globalThis.PropType<any[]>;
    };
}>> & Readonly<{
    "onUpdate:modelValue"?: ((value: any[]) => any) | undefined;
}>, {
    loadingMessage: string;
}, {}, {}, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
declare const __VLS_export: __VLS_WithSlots<typeof __VLS_base, __VLS_Slots>;
declare const _default: typeof __VLS_export;
export default _default;
type __VLS_WithSlots<T, S> = T & {
    new (): {
        $slots: S;
    };
};
//# sourceMappingURL=MaxTable.vue.d.ts.map