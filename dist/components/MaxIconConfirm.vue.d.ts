type __VLS_Props = {
    /** Nome do ícone (ex: 'mdi:home') */
    icon?: string;
    /** Alias para o nome do ícone */
    i?: string;
    /** link para abrir em nova aba */
    blank?: string;
    /** Rotação do ícone em graus */
    route?: string;
    /** Query data */
    data?: any;
    /** params data */
    params?: any;
    /** Rotação do ícone em graus */
    rotate?: number;
    /** Inversão do ícone */
    flip?: 'horizontal' | 'vertical' | 'h' | 'v' | 'x' | 'y' | 'xy';
    /** Tamanho do ícone (em px ou multiplicador) */
    size?: string | number;
    /** Alias para o tamanho */
    scale?: string | number;
    /** Mensagem de confirmação */
    message?: string;
    /** Icone de mensagem de confirmação */
    messageIcon?: string;
    /** Label do botão de sim */
    acceptLabel?: string;
    /** Icone do botão de sim */
    acceptIcon?: string;
    /** Label do botão de não */
    rejectProps?: {
        label: string;
        icon?: string;
        action: Function;
    };
    acceptProps?: {
        label: string;
        icon?: string;
        action: Function;
    };
    /** Icone do botão de não */
    cancelIcon?: string;
    loading?: boolean;
    /** Largura específica */
    width?: string | number;
    /** Altura específica */
    height?: string | number;
    /** Icone escuro referente ao fundo */
    dark?: boolean | string | number | undefined;
    /** Icone claro referente ao fundo */
    light?: boolean | string | number | undefined;
    /** Icone de checagem */
    checked?: boolean | string | number | undefined;
    /** Icone de adição opcional */
    plus?: boolean | string | number | undefined;
};
declare const _default: import('vue').DefineComponent<__VLS_Props, {}, {}, {}, {}, import('vue').ComponentOptionsMixin, import('vue').ComponentOptionsMixin, {}, string, import('vue').PublicProps, Readonly<__VLS_Props> & Readonly<{}>, {
    dark: string | number | boolean;
    light: string | number | boolean;
    loading: boolean;
    rejectProps: {
        label: string;
        icon?: string;
        action: Function;
    };
    acceptProps: {
        label: string;
        icon?: string;
        action: Function;
    };
}, {}, {}, {}, string, import('vue').ComponentProvideOptions, false, {
    el: import('vue').CreateComponentPublicInstanceWithMixins<Readonly<{
        icon?: string;
        i?: string;
        blank?: string;
        route?: string;
        data?: any;
        params?: any;
        rotate?: number;
        flip?: "horizontal" | "vertical" | "h" | "v" | "x" | "y" | "xy";
        size?: string | number;
        scale?: string | number;
        width?: string | number;
        height?: string | number;
        dark?: boolean | string | number | undefined;
        light?: boolean | string | number | undefined;
        checked?: boolean | string | number | undefined;
        plus?: boolean | string | number | undefined;
    }> & Readonly<{}>, {}, {}, {}, {}, import('vue').ComponentOptionsMixin, import('vue').ComponentOptionsMixin, {}, import('vue').PublicProps, {
        dark: string | number | boolean;
        light: string | number | boolean;
    }, false, {}, {}, import('vue').GlobalComponents, import('vue').GlobalDirectives, string, {
        icon_ref: HTMLDivElement;
    }, HTMLDivElement, import('vue').ComponentProvideOptions, {
        P: {};
        B: {};
        D: {};
        C: {};
        M: {};
        Defaults: {};
    }, Readonly<{
        icon?: string;
        i?: string;
        blank?: string;
        route?: string;
        data?: any;
        params?: any;
        rotate?: number;
        flip?: "horizontal" | "vertical" | "h" | "v" | "x" | "y" | "xy";
        size?: string | number;
        scale?: string | number;
        width?: string | number;
        height?: string | number;
        dark?: boolean | string | number | undefined;
        light?: boolean | string | number | undefined;
        checked?: boolean | string | number | undefined;
        plus?: boolean | string | number | undefined;
    }> & Readonly<{}>, {}, {}, {}, {}, {
        dark: string | number | boolean;
        light: string | number | boolean;
    }> | null;
}, any>;
export default _default;
//# sourceMappingURL=MaxIconConfirm.vue.d.ts.map