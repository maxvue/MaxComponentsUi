type __VLS_Props = {
    /** URL da imagem do avatar */
    imageUrl?: string;
    /** Nome do usuário (usado para gerar iniciais ou tooltip) */
    name?: string;
    /** Define se exibe um tooltip com o nome ao passar o mouse */
    showTooltip?: boolean;
    /** Define a rota que deve ser chamada para carregar a imagem */
    routeImage?: string | null | undefined;
    /** Define a rota que deve ser chamada para carregar a imagem */
    requestImageData?: string | null | undefined;
};
declare const _default: import('vue').DefineComponent<__VLS_Props, {}, {}, {}, {}, import('vue').ComponentOptionsMixin, import('vue').ComponentOptionsMixin, {}, string, import('vue').PublicProps, Readonly<__VLS_Props> & Readonly<{}>, {
    showTooltip: boolean;
}, {}, {}, {}, string, import('vue').ComponentProvideOptions, false, {}, any>;
export default _default;
//# sourceMappingURL=MaxUserAvatar.vue.d.ts.map