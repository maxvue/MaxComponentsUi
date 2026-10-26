export interface MaxSegmentOption {
    /** Valor escalar único associado à opção */
    value: string | number | null;
    /** Texto descritivo exibido na opção */
    label: string;
    /** Ícone opcional exibido junto ao rótulo */
    icon?: string;
    /** Indica se a opção está desabilitada para seleção e foco */
    disabled?: boolean;
}
export interface MaxSegmentedControlProps {
    /** Valor atualmente selecionado */
    modelValue: string | number | null;
    /** Coleção de opções disponíveis */
    options: MaxSegmentOption[];
    /** Rótulo acessível obrigatório para o grupo de opções */
    ariaLabel: string;
    /** Desabilita todo o controle de opções */
    disabled?: boolean;
    /** Dimensão visual compacta, padrão ou expandida */
    size?: 'small' | 'normal' | 'large';
}
//# sourceMappingURL=selection.d.ts.map