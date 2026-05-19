type __VLS_Props = {
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
    targetValue?: string;
    caution?: string | boolean | undefined;
    required?: boolean;
};
type __VLS_PublicProps = {
    modelValue?: any;
} & __VLS_Props;
declare function __VLS_template(): {
    attrs: Partial<{}>;
    slots: {
        option?(_: {
            option: any;
            selected: boolean;
            index: number;
        }): any;
    };
    refs: {};
    rootEl: any;
};
type __VLS_TemplateResult = ReturnType<typeof __VLS_template>;
declare const __VLS_component: import('vue').DefineComponent<__VLS_PublicProps, {}, {}, {}, {}, import('vue').ComponentOptionsMixin, import('vue').ComponentOptionsMixin, {
    "update:modelValue": (value: any) => any;
}, string, import('vue').PublicProps, Readonly<__VLS_PublicProps> & Readonly<{
    "onUpdate:modelValue"?: ((value: any) => any) | undefined;
}>, {
    done: boolean;
    caution: string | boolean;
    required: boolean;
}, {}, {}, {}, string, import('vue').ComponentProvideOptions, false, {}, any>;
declare const _default: __VLS_WithTemplateSlots<typeof __VLS_component, __VLS_TemplateResult["slots"]>;
export default _default;
type __VLS_WithTemplateSlots<T, S> = T & {
    new (): {
        $slots: S;
    };
};
//# sourceMappingURL=MaxPhoneField.vue.d.ts.map