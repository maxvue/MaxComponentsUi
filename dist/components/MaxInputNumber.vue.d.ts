type __VLS_Props = {
    modelValue: number | null;
    icon?: string | undefined;
    i?: string | undefined;
    disabled?: boolean | undefined;
    float?: boolean | undefined;
    msg?: string | undefined;
    message?: string | undefined;
    iconMessage?: string | undefined;
    label?: string | undefined;
    done?: boolean | undefined;
    error?: string | boolean | undefined;
    targetValue?: string | number;
    caution?: string | boolean | undefined;
    required?: boolean;
};
declare const _default: import('vue').DefineComponent<__VLS_Props, {}, {}, {}, {}, import('vue').ComponentOptionsMixin, import('vue').ComponentOptionsMixin, {
    "update:modelValue": (...args: any[]) => void;
}, string, import('vue').PublicProps, Readonly<__VLS_Props> & Readonly<{
    "onUpdate:modelValue"?: ((...args: any[]) => any) | undefined;
}>, {
    done: boolean;
    modelValue: number | null;
    caution: string | boolean;
    required: boolean;
}, {}, {}, {}, string, import('vue').ComponentProvideOptions, false, {
    primevueInput: ({
        $props: import('primevue/inputnumber').InputNumberProps & import('vue').VNodeProps & import('vue').AllowedComponentProps & import('vue').ComponentCustomProps;
        $slots: import('primevue/inputnumber').InputNumberSlots;
        $emit: ((e: "input", event: import('primevue/inputnumber').InputNumberInputEvent) => void) & ((e: "update:modelValue", value: number) => void) & ((e: "value-change", value: number) => void) & ((e: "blur", event: import('primevue/inputnumber').InputNumberBlurEvent) => void) & ((e: "focus", event: Event) => void);
    } & import('primevue/inputnumber').InputNumberMethods) | null;
}, any>;
export default _default;
//# sourceMappingURL=MaxInputNumber.vue.d.ts.map