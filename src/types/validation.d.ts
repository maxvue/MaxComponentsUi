export interface MaxValidationIssue {
    /** Chave identificadora única da ocorrência de erro */
    key: string;
    /** Rótulo legível do campo ou categoria com erro */
    label: string;
    /** Mensagem descritiva do erro */
    message: string;
    /** ID HTML nativo do campo de entrada para foco e navegação */
    inputId?: string;
}
export interface MaxFormValidationSummaryProps {
    /** Lista ordenada de problemas de validação */
    errors?: MaxValidationIssue[];
    /** Mensagem de erro global não associada a um campo específico */
    generalError?: string | null;
    /** Título descritivo do bloco de resumo */
    title?: string;
    /** Habilita foco e scroll automático até o campo ao clicar */
    focusField?: boolean;
}
//# sourceMappingURL=validation.d.ts.map