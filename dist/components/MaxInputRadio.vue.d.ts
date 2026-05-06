type __VLS_Props = {
    modelValue: any;
    value?: any;
    name?: string;
};
declare const _default: import('vue').DefineComponent<__VLS_Props, {}, {}, {}, {}, import('vue').ComponentOptionsMixin, import('vue').ComponentOptionsMixin, {
    "update:modelValue": (...args: any[]) => void;
}, string, import('vue').PublicProps, Readonly<__VLS_Props> & Readonly<{
    "onUpdate:modelValue"?: ((...args: any[]) => any) | undefined;
}>, {
    value: any;
    modelValue: any;
}, {}, {}, {}, string, import('vue').ComponentProvideOptions, false, {
    button: {
        $props: import('primevue/radiobutton').RadioButtonProps & import('vue').VNodeProps & import('vue').AllowedComponentProps & import('vue').ComponentCustomProps;
        $slots: import('primevue/radiobutton').RadioButtonSlots;
        $emit: ((e: "update:modelValue", value: any) => void) & ((e: "value-change", value: any) => void) & ((e: "blur", event: Event) => void) & ((e: "change", event: Event) => void) & ((e: "focus", event: Event) => void);
    } | null;
}, HTMLDivElement>;
export default _default;
//# sourceMappingURL=MaxInputRadio.vue.d.ts.map