/**
 * Propriedades base para componentes de entrada (inputs).
 * Este componente serve como wrapper para padronizar o layout, ícones e mensagens.
 */
interface Props {
    /** Valor do input (suporta v-model) */
    value?: any;
    /** Valor do input para v-model no Vue 3 */
    modelValue?: any;
    /** Ícone principal (ex: 'mdi:user') */
    icon?: string | undefined;
    /** Ícone posicionado à esquerda */
    iconLeft?: string | undefined;
    /** Ícone posicionado à direita (ex: ícone de carregamento ou olho para senha) */
    iconRight?: string | undefined;
    /** Alias para o ícone principal */
    i?: string | undefined;
    /** Estado desabilitado do componente */
    disabled?: boolean | undefined;
    /** Ativa o estilo de label flutuante (FloatLabel) */
    float?: boolean | undefined;
    /** Mensagem de feedback ou instrução (alias para message) */
    msg?: string | undefined;
    /** Mensagem de feedback, erro ou aviso exibida abaixo do input */
    message?: string | undefined;
    /** Ícone exibido ao lado da mensagem de feedback */
    iconMessage?: string | undefined;
    /** Rótulo (label) exibido acima ou dentro do campo */
    label?: string | undefined;
    /** Define se o campo foi preenchido corretamente (exibe ícone de check) */
    done?: boolean | undefined;
    /** Mensagem de erro ou estado de erro (exibe em destaque) */
    error?: string | boolean | undefined;
    /** Mensagem de atenção ou estado de alerta (exibe em laranja) */
    caution?: string | boolean | undefined;
    /** Indica se o preenchimento deste campo é obrigatório (exibe asterisco) */
    required?: boolean | undefined;
    /** Alinha o texto do input ao centro */
    textCenter?: boolean | undefined;
}
declare var __VLS_25: {};
type __VLS_Slots = {} & {
    default?: (props: typeof __VLS_25) => any;
};
declare const __VLS_base: import("vue").DefineComponent<Props, {}, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {}, string, import("vue").PublicProps, Readonly<Props> & Readonly<{}>, {
    value: any;
    textCenter: boolean;
}, {}, {}, {}, string, import("vue").ComponentProvideOptions, false, {}, any>;
declare const __VLS_export: __VLS_WithSlots<typeof __VLS_base, __VLS_Slots>;
declare const _default: typeof __VLS_export;
export default _default;
type __VLS_WithSlots<T, S> = T & {
    new (): {
        $slots: S;
    };
};
//# sourceMappingURL=InputBase.vue.d.ts.map