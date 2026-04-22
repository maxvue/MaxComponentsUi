import { App } from 'vue';
import { ComponentOptionsMixin } from 'vue';
import { ComponentProvideOptions } from 'vue';
import { DefineComponent } from 'vue';
import { PrimeVueConfiguration } from 'primevue/config';
import { PublicProps } from 'vue';

declare const __VLS_component: DefineComponent<Props, {}, {}, {}, {}, ComponentOptionsMixin, ComponentOptionsMixin, {} & {
click: (event: MouseEvent) => any;
}, string, PublicProps, Readonly<Props> & Readonly<{
onClick?: ((event: MouseEvent) => any) | undefined;
}>, {
size: "small" | "large";
severity: "primary" | "secondary" | "success" | "info" | "warning" | "help" | "danger" | "contrast";
disabled: boolean;
loading: boolean;
iconPos: "left" | "right";
}, {}, {}, {}, string, ComponentProvideOptions, false, {}, any>;

declare type __VLS_Props = {
    icon?: string;
    i?: string;
    rotate?: number;
    flip?: 'horizontal' | 'vertical' | 'h' | 'v' | 'x' | 'y' | 'xy';
    size?: string | number;
    scale?: string | number;
    width?: string | number;
    height?: string | number;
};

declare type __VLS_Props_2 = {
    modelValue: string;
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

declare function __VLS_template(): {
    attrs: Partial<{}>;
    slots: {
        icon?(_: {}): any;
        icon?(_: {}): any;
    };
    refs: {};
    rootEl: any;
};

declare type __VLS_TemplateResult = ReturnType<typeof __VLS_template>;

declare type __VLS_WithTemplateSlots<T, S> = T & {
    new (): {
        $slots: S;
    };
};

export declare interface BaseComponentProps {
    class?: string;
    style?: string | Record<string, any>;
}

export declare interface ButtonProps extends BaseComponentProps {
    label?: string;
    icon?: string;
    severity?: 'secondary' | 'success' | 'info' | 'warning' | 'help' | 'danger' | 'contrast';
    size?: 'small' | 'large';
    disabled?: boolean;
    loading?: boolean;
    variant?: 'outlined' | 'text' | 'link';
}

export declare interface ComponentEmits {
    click: [event: MouseEvent];
}

declare const _default: __VLS_WithTemplateSlots<typeof __VLS_component, __VLS_TemplateResult["slots"]>;
export { _default as Button }
export { _default as MaxButton }

declare const _default_2: DefineComponent<__VLS_Props_2, {}, {}, {}, {}, ComponentOptionsMixin, ComponentOptionsMixin, {
"update:modelValue": (...args: any[]) => void;
}, string, PublicProps, Readonly<__VLS_Props_2> & Readonly<{
"onUpdate:modelValue"?: ((...args: any[]) => any) | undefined;
}>, {
done: boolean;
modelValue: string;
caution: string | boolean;
required: boolean;
}, {}, {}, {}, string, ComponentProvideOptions, false, {}, any>;
export { _default_2 as InputText }
export { _default_2 as MaxInputText }

declare function install(app: App, options?: PrimeVueConfiguration): void;
export default install;

export declare const MaxIcon: DefineComponent<__VLS_Props, {}, {}, {}, {}, ComponentOptionsMixin, ComponentOptionsMixin, {}, string, PublicProps, Readonly<__VLS_Props> & Readonly<{}>, {}, {}, {}, {}, string, ComponentProvideOptions, false, {}, HTMLDivElement>;

declare interface Props {
    label?: string;
    icon?: string;
    i?: string;
    severity?: 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'help' | 'danger' | 'contrast';
    size?: 'small' | 'large';
    disabled?: boolean;
    loading?: boolean;
    variant?: 'outlined' | 'text' | 'link';
    iconPos?: 'left' | 'right';
}

export { }
