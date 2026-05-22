type __VLS_Props = {
    modelValue: any;
    options: any;
    icon?: string | undefined;
    i?: string | undefined;
    disabled?: boolean | undefined;
    optionLabel?: string | undefined;
    optionValue?: string | undefined;
    float?: boolean | undefined;
    msg?: string | undefined;
    message?: string | undefined;
    iconMessage?: string | undefined;
    placeholder?: string | undefined;
    label?: string | undefined;
    done?: boolean | undefined;
    error?: string | boolean | undefined;
    targetValue?: string;
    caution?: string | boolean | undefined;
    required?: boolean;
};
declare const _default: import('vue').DefineComponent<__VLS_Props, {}, {}, {}, {}, import('vue').ComponentOptionsMixin, import('vue').ComponentOptionsMixin, {
    "update:modelValue": (...args: any[]) => void;
}, string, import('vue').PublicProps, Readonly<__VLS_Props> & Readonly<{
    "onUpdate:modelValue"?: ((...args: any[]) => any) | undefined;
}>, {
    done: boolean;
    modelValue: any;
    error: string | boolean;
    caution: string | boolean;
    required: boolean;
    options: any;
    optionLabel: string;
}, {}, {}, {}, string, import('vue').ComponentProvideOptions, false, {}, any>;
export default _default;
//# sourceMappingURL=MaxInputAutoComplete.vue.d.ts.map