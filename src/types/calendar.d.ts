import type { MaxSeverity } from './feedback';
import type { MaxMonthPeriod } from './period';
/** Representação estrita de data civil no formato YYYY-MM-DD */
export type MaxLocalDate = string;
export interface MaxCalendarEvent {
    /** Identificador único do evento */
    id: string;
    /** Data civil do evento no formato YYYY-MM-DD */
    date: MaxLocalDate;
    /** Título descritivo do evento */
    label: string;
    /** Severidade visual do marcador */
    severity?: MaxSeverity;
}
export interface MaxCalendarRange {
    /** Início inclusivo do intervalo (YYYY-MM-DD) */
    start: MaxLocalDate;
    /** Fim exclusivo do intervalo (YYYY-MM-DD) */
    endExclusive: MaxLocalDate;
}
export interface MaxCalendarProps {
    /** Mês e ano exibidos na grade */
    period: MaxMonthPeriod;
    /** Data civil atualmente selecionada */
    selectedDate?: MaxLocalDate | null;
    /** Data civil considerada hoje */
    today?: MaxLocalDate;
    /** Coleção de eventos associados aos dias civis */
    events?: MaxCalendarEvent[];
    /** Data mínima permitida para seleção */
    minDate?: MaxLocalDate;
    /** Data máxima permitida para seleção */
    maxDate?: MaxLocalDate;
    /** Desabilita a interação com o calendário */
    disabled?: boolean;
    /** Rótulo acessível da grade de calendário */
    ariaLabel?: string;
}
/**
 * Valida se uma string é uma data civil válida no formato YYYY-MM-DD.
 */
export declare function isValidLocalDate(value: unknown): value is MaxLocalDate;
/**
 * Retorna a quantidade de dias de um determinado mês civil considerando anos bissextos.
 */
export declare function getDaysInCivilMonth(year: number, month: number): number;
/**
 * Formata ano, mês e dia no formato YYYY-MM-DD sem shift de timezone.
 */
export declare function formatCivilDate(year: number, month: number, day: number): MaxLocalDate;
/**
 * Calcula o dia da semana para uma data civil (0 = Domingo, 6 = Sábado) usando congruência de Zeller / algoritmo determinístico.
 */
export declare function getCivilDayOfWeek(year: number, month: number, day: number): number;
//# sourceMappingURL=calendar.d.ts.map