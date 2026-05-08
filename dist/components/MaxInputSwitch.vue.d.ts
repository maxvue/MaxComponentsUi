type __VLS_Props = {
    /** Valor booleano do switch */
    modelValue: boolean;
    /** Pergunta ou rótulo exibido ao lado do switch */
    question?: string;
    /** Ícone opcional */
    icon?: string | undefined;
    /** Alias para o ícone */
    i?: string | undefined;
    /** Desabilita o campo */
    disabled?: boolean | undefined;
    /** Estilo FloatLabel */
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
declare const _default: import('vue').DefineComponent<__VLS_Props, {}, {}, {}, {}, import('vue').ComponentOptionsMixin, import('vue').ComponentOptionsMixin, {
    "update:modelValue": (...args: any[]) => void;
}, string, import('vue').PublicProps, Readonly<__VLS_Props> & Readonly<{
    "onUpdate:modelValue"?: ((...args: any[]) => any) | undefined;
}>, {
    done: boolean;
    modelValue: boolean;
    caution: string | boolean;
    required: boolean;
}, {}, {}, {}, string, import('vue').ComponentProvideOptions, false, {}, any>;
export default _default;
//# sourceMappingURL=MaxInputSwitch.vue.d.ts.map