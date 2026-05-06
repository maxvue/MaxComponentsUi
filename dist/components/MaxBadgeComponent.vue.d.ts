type __VLS_Props = {
    /** Nome do ícone (ex: 'mdi:home') */
    icon?: string;
    /** Alias para o nome do ícone */
    i?: string;
    /** Texto do badge */
    label?: string;
    /** Alias para o texto do badge */
    value?: string;
    /** Alias para o texto do badge */
    msg?: string;
    /** Alias para o texto do badge */
    mensagem?: string;
    /** Alias para o texto do badge */
    text?: string;
    /** Alias para o texto do badge */
    txt?: string;
    /** Alias para o nome do ícone */
    number?: string;
    /** Rotação do ícone em graus */
    rotate?: number;
    /** Inversão do ícone */
    flip?: 'horizontal' | 'vertical' | 'h' | 'v' | 'x' | 'y' | 'xy';
    /** Tamanho do ícone (em px ou multiplicador) */
    size?: string | number;
    /** Alias para o tamanho */
    scale?: string | number;
    /** Largura específica */
    width?: string | number;
    /** Altura específica */
    height?: string | number;
    /** Cor do ícone */
    iconColor?: string;
    /** Valor do ícone */
    iconValue?: string;
    /** Apenas se estiver usando overlay = true */
    badge?: any;
    /** Apenas se estiver usando overlay = true */
    overlay?: boolean | undefined;
};
declare const _default: import('vue').DefineComponent<__VLS_Props, {}, {}, {}, {}, import('vue').ComponentOptionsMixin, import('vue').ComponentOptionsMixin, {}, string, import('vue').PublicProps, Readonly<__VLS_Props> & Readonly<{}>, {}, {}, {}, {}, string, import('vue').ComponentProvideOptions, false, {
    badgeElem: {
        $props: import('primevue/badge').BadgeProps & import('vue').VNodeProps & import('vue').AllowedComponentProps & import('vue').ComponentCustomProps;
        $slots: import('primevue/badge').BadgeSlots;
        $emit: (e: string, ...args: any[]) => void;
    } | null;
}, HTMLDivElement>;
export default _default;
//# sourceMappingURL=MaxBadgeComponent.vue.d.ts.map