import { ButtonProps } from 'primevue/button';
interface btnProps extends /* @vue-ignore */ ButtonProps {
    icon?: string;
    i?: string;
    iconLeft?: string;
    iconRight?: string;
    sizeIcon?: number | string;
    iconSize?: number | string;
    route?: string | null;
    params?: any;
    data?: any;
    query?: any;
    dark?: boolean | string | number | undefined;
    light?: boolean | string | number | undefined;
    label: string | undefined;
    action?: () => void;
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
declare const __VLS_component: import('vue').DefineComponent<btnProps, {}, {}, {}, {}, import('vue').ComponentOptionsMixin, import('vue').ComponentOptionsMixin, {
    click: (value: boolean) => any;
}, string, import('vue').PublicProps, Readonly<btnProps> & Readonly<{
    onClick?: ((value: boolean) => any) | undefined;
}>, {
    dark: string | number | boolean;
    light: string | number | boolean;
    data: any;
    route: string | null;
    params: any;
    query: any;
    iconSize: number | string;
}, {}, {}, {}, string, import('vue').ComponentProvideOptions, false, {}, any>;
declare const _default: __VLS_WithTemplateSlots<typeof __VLS_component, __VLS_TemplateResult["slots"]>;
export default _default;
type __VLS_WithTemplateSlots<T, S> = T & {
    new (): {
        $slots: S;
    };
};
//# sourceMappingURL=MaxButton.vue.d.ts.map