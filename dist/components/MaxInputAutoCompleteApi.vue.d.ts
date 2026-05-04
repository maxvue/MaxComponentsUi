type __VLS_Props = {
    /** Valor selecionado */
    modelValue: any;
    /** Rota da API para busca */
    route: string;
    /** Dados adicionais para enviar no corpo da requisição */
    data?: any;
    /** Ícone opcional */
    icon?: string | undefined;
    /** Alias para o ícone */
    i?: string | undefined;
    /** Desabilita o campo */
    disabled?: boolean | undefined;
    /** Ativa estilo FloatLabel */
    float?: boolean | undefined;
    /** Mensagem de feedback (alias) */
    msg?: string | undefined;
    /** Mensagem de feedback */
    message?: string | undefined;
    /** Ícone da mensagem de feedback */
    iconMessage?: string | undefined;
    /** Rótulo do campo */
    label?: string | undefined;
    /** Estado de conclusão/validação manual */
    done?: boolean | undefined;
    /** Mensagem ou estado de erro */
    error?: string | boolean | undefined;
    /** Valor para comparação (opcional) */
    targetValue?: string;
    /** Mensagem ou estado de atenção */
    caution?: string | boolean | undefined;
    /** Define se o campo é obrigatório */
    required?: boolean;
};
declare const __VLS_export: import("vue").DefineComponent<__VLS_Props, {}, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {
    "update:modelValue": (...args: any[]) => void;
}, string, import("vue").PublicProps, Readonly<__VLS_Props> & Readonly<{
    "onUpdate:modelValue"?: ((...args: any[]) => any) | undefined;
}>, {
    modelValue: any;
    done: boolean;
    required: boolean;
    caution: string | boolean;
}, {}, {}, {}, string, import("vue").ComponentProvideOptions, false, {}, any>;
declare const _default: typeof __VLS_export;
export default _default;
//# sourceMappingURL=MaxInputAutoCompleteApi.vue.d.ts.map