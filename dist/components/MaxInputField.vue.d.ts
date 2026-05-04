type __VLS_Props = {
    modelValue: any;
};
declare const _default: import('vue').DefineComponent<__VLS_Props, {
    setFocus: () => void;
}, {}, {}, {}, import('vue').ComponentOptionsMixin, import('vue').ComponentOptionsMixin, {
    "update:modelValue": (...args: any[]) => void;
}, string, import('vue').PublicProps, Readonly<__VLS_Props> & Readonly<{
    "onUpdate:modelValue"?: ((...args: any[]) => any) | undefined;
}>, {
    modelValue: any;
}, {}, {}, {}, string, import('vue').ComponentProvideOptions, false, {
    primevueInput: {
        $props: import('primevue/inputtext').InputTextProps & import('vue').VNodeProps & import('vue').AllowedComponentProps & import('vue').ComponentCustomProps;
        $slots: import('primevue/inputtext').InputTextSlots;
        $emit: ((e: "update:modelValue", value: string | undefined) => void) & ((e: "value-change", value: string | undefined) => void);
    } | null;
}, any>;
export default _default;
//# sourceMappingURL=MaxInputField.vue.d.ts.map