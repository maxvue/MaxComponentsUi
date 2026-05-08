type __VLS_Props = {
    /** Nome do ícone (ex: 'mdi:home') */
    icon?: string;
    /** Alias para o nome do ícone */
    i?: string;
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
    /** Icone escuro referente ao fundo */
    dark?: boolean | string | number | undefined;
    /** Icone claro referente ao fundo */
    light?: boolean | string | number | undefined;
    /** Icone de checagem */
    checked?: boolean | string | number | undefined;
    /** Icone de adição */
    plus?: boolean | string | number | undefined;
    /** Icone de adição */
    color?: string;
    /** Icone de adição */
    colorHover?: string;
};
declare const _default: import('vue').DefineComponent<__VLS_Props, {}, {}, {}, {}, import('vue').ComponentOptionsMixin, import('vue').ComponentOptionsMixin, {}, string, import('vue').PublicProps, Readonly<__VLS_Props> & Readonly<{}>, {
    dark: string | number | boolean;
    light: string | number | boolean;
    color: string;
}, {}, {}, {}, string, import('vue').ComponentProvideOptions, false, {}, HTMLDivElement>;
export default _default;
//# sourceMappingURL=MaxIcon.vue.d.ts.map