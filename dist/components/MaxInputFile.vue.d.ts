type __VLS_Props = {
    modelValue: File[];
    label?: string;
};
declare function __VLS_template(): {
    attrs: Partial<{}>;
    slots: {
        button?(_: {
            flex: boolean;
        }): any;
        filesPreview?(_: {
            flex: boolean;
        }): any;
    };
    refs: {
        dropZoneRef: HTMLDivElement;
    };
    rootEl: HTMLDivElement;
};
type __VLS_TemplateResult = ReturnType<typeof __VLS_template>;
declare const __VLS_component: import('vue').DefineComponent<__VLS_Props, {}, {}, {}, {}, import('vue').ComponentOptionsMixin, import('vue').ComponentOptionsMixin, {
    "update:modelValue": (...args: any[]) => void;
}, string, import('vue').PublicProps, Readonly<__VLS_Props> & Readonly<{
    "onUpdate:modelValue"?: ((...args: any[]) => any) | undefined;
}>, {
    modelValue: File[];
}, {}, {}, {}, string, import('vue').ComponentProvideOptions, false, {
    dropZoneRef: HTMLDivElement;
}, HTMLDivElement>;
declare const _default: __VLS_WithTemplateSlots<typeof __VLS_component, __VLS_TemplateResult["slots"]>;
export default _default;
type __VLS_WithTemplateSlots<T, S> = T & {
    new (): {
        $slots: S;
    };
};
//# sourceMappingURL=MaxInputFile.vue.d.ts.map