type __VLS_Props = {
    /** Valor do documento (apenas números) */
    modelValue: string | null;
    /** Força a máscara e validação de CPF */
    cpf?: boolean;
    /** Força a máscara e validação de CNPJ */
    cnpj?: boolean;
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
    complete: (...args: any[]) => void;
}, string, import('vue').PublicProps, Readonly<__VLS_Props> & Readonly<{
    "onUpdate:modelValue"?: ((...args: any[]) => any) | undefined;
    onComplete?: ((...args: any[]) => any) | undefined;
}>, {
    done: boolean;
    modelValue: string | null;
    caution: string | boolean;
    required: boolean;
}, {}, {}, {}, string, import('vue').ComponentProvideOptions, false, {
    el: {
        $props: import('primevue/inputtext').InputTextProps & import('vue').VNodeProps & import('vue').AllowedComponentProps & import('vue').ComponentCustomProps;
        $slots: import('primevue/inputtext').InputTextSlots;
        $emit: ((e: "update:modelValue", value: string | undefined) => void) & ((e: "value-change", value: string | undefined) => void);
    } | null;
}, any>;
export default _default;
//# sourceMappingURL=MaxInputCpfCnpj.vue.d.ts.map