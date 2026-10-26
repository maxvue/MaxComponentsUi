export interface MaxMonthPeriod {
    /** Ano calendário (ex: 2026) */
    year: number;
    /** Mês civil de 1 a 12 */
    month: number;
}
export interface MaxPeriodNavigatorProps {
    /** Período atualmente selecionado */
    modelValue: MaxMonthPeriod;
    /** Período de referência atual injetado pela aplicação */
    currentPeriod?: MaxMonthPeriod;
    /** Limite temporal mínimo permitido */
    minPeriod?: MaxMonthPeriod;
    /** Limite temporal máximo permitido */
    maxPeriod?: MaxMonthPeriod;
    /** Desabilita a navegação */
    disabled?: boolean;
    /** Rótulo acessível da barra de navegação */
    ariaLabel?: string;
}
//# sourceMappingURL=period.d.ts.map