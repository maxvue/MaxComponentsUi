declare function __VLS_template(): {
    attrs: Partial<{}>;
    slots: {
        default?(_: {}): any;
        expansion?(_: {
            data: any;
            index: number;
        }): any;
    };
    refs: {};
    rootEl: HTMLDivElement;
};
type __VLS_TemplateResult = ReturnType<typeof __VLS_template>;
declare const __VLS_component: import('vue').DefineComponent<globalThis.ExtractPropTypes<{
    /** Mensagem exibida durante o carregamento */
    loadingMessage: {
        type: StringConstructor;
        default: string;
    };
    modelValue: {
        type: globalThis.PropType<any[]>;
    };
}>, {}, {}, {}, {}, import('vue').ComponentOptionsMixin, import('vue').ComponentOptionsMixin, {
    "update:modelValue": (value: any[]) => any;
}, string, import('vue').PublicProps, Readonly<globalThis.ExtractPropTypes<{
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
}, {}, {}, {}, string, import('vue').ComponentProvideOptions, true, {}, HTMLDivElement>;
declare const _default: __VLS_WithTemplateSlots<typeof __VLS_component, __VLS_TemplateResult["slots"]>;
export default _default;
type __VLS_WithTemplateSlots<T, S> = T & {
    new (): {
        $slots: S;
    };
};
//# sourceMappingURL=MaxTable.vue.d.ts.map