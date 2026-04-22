interface Props {
    value?: string;
    modelValue?: string | undefined;
    icon?: string | undefined;
    iconLeft?: string | undefined;
    iconRight?: string | undefined;
    i?: string | undefined;
    disabled?: boolean | undefined;
    float?: boolean | undefined;
    msg?: string | undefined;
    message?: string | undefined;
    iconMessage?: string | undefined;
    label?: string | undefined;
    done?: boolean | undefined;
    error?: string | boolean | undefined;
    caution?: string | boolean | undefined;
    required?: boolean | undefined;
}
declare function __VLS_template(): {
    attrs: Partial<{}>;
    slots: {
        default?(_: {}): any;
    };
    refs: {};
    rootEl: any;
};
type __VLS_TemplateResult = ReturnType<typeof __VLS_template>;
declare const __VLS_component: import('vue').DefineComponent<Props, {}, {}, {}, {}, import('vue').ComponentOptionsMixin, import('vue').ComponentOptionsMixin, {}, string, import('vue').PublicProps, Readonly<Props> & Readonly<{}>, {
    value: string;
}, {}, {}, {}, string, import('vue').ComponentProvideOptions, false, {}, any>;
declare const _default: __VLS_WithTemplateSlots<typeof __VLS_component, __VLS_TemplateResult["slots"]>;
export default _default;
type __VLS_WithTemplateSlots<T, S> = T & {
    new (): {
        $slots: S;
    };
};
//# sourceMappingURL=InputBase.vue.d.ts.map