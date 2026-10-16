export interface MaxFilterBarProps {
    /** Rótulo acessível da região de filtros */
    ariaLabel?: string;
    /** Quantidade de filtros ativos no momento */
    activeCount?: number;
    /** Indica se os dados filtrados estão carregando */
    loading?: boolean;
    /** Desabilita as interações de filtro */
    disabled?: boolean;
    /** Exibe o botão de aplicação explícita de filtros */
    showApply?: boolean;
}
