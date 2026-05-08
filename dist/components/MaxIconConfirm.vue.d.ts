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
    /** Label do botão de sim */
    acceptLabel?: string;
    /** Icone do botão de sim */
    acceptIcon?: string;
    /** Label do botão de não */
    cancelLabel?: string;
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
declare const _default: import('vue').DefineComponent<__VLS_Props, {}, {}, {}, {}, import('vue').ComponentOptionsMixin, import('vue').ComponentOptionsMixin, {
    confirm: (value: boolean) => any;
    accept: (value: boolean) => any;
    cancel: (value: boolean) => any;
    reject: (value: boolean) => any;
}, string, import('vue').PublicProps, Readonly<__VLS_Props> & Readonly<{
    onConfirm?: ((value: boolean) => any) | undefined;
    onAccept?: ((value: boolean) => any) | undefined;
    onCancel?: ((value: boolean) => any) | undefined;
    onReject?: ((value: boolean) => any) | undefined;
}>, {
    dark: string | number | boolean;
    light: string | number | boolean;
    loading: boolean;
}, {}, {}, {}, string, import('vue').ComponentProvideOptions, false, {
    op: ({
        $props: import('primevue/popover').PopoverProps & import('vue').VNodeProps & import('vue').AllowedComponentProps & import('vue').ComponentCustomProps;
        $slots: import('primevue/popover').PopoverSlots;
        $emit: ((e: "show") => void) & ((e: "hide") => void);
    } & import('primevue/popover').PopoverMethods) | null;
}, any>;
export default _default;
//# sourceMappingURL=MaxIconConfirm.vue.d.ts.map