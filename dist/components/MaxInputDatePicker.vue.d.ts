type __VLS_Props = {
    icon?: string;
    label?: string;
    required?: boolean;
    disabled?: boolean;
    done?: boolean;
    error?: string | boolean;
    caution?: string | boolean;
};
type __VLS_PublicProps = {
    modelValue?: string | Date;
} & __VLS_Props;
declare const _default: import('vue').DefineComponent<__VLS_PublicProps, {}, {}, {}, {}, import('vue').ComponentOptionsMixin, import('vue').ComponentOptionsMixin, {
    "update:modelValue": (value: string | Date) => any;
}, string, import('vue').PublicProps, Readonly<__VLS_PublicProps> & Readonly<{
    "onUpdate:modelValue"?: ((value: string | Date) => any) | undefined;
}>, {
    required: boolean;
}, {}, {}, {}, string, import('vue').ComponentProvideOptions, false, {}, any>;
export default _default;
//# sourceMappingURL=MaxInputDatePicker.vue.d.ts.map