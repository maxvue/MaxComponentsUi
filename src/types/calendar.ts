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
export function isValidLocalDate(value: unknown): value is MaxLocalDate {
    if (typeof value !== 'string') return false;
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) return false;
    const y = Number(match[1]);
    const m = Number(match[2]);
    const d = Number(match[3]);
    if (m < 1 || m > 12 || d < 1 || d > 31) return false;
    const daysInMonth = getDaysInCivilMonth(y, m);
    return d <= daysInMonth;
}

/**
 * Retorna a quantidade de dias de um determinado mês civil considerando anos bissextos.
 */
export function getDaysInCivilMonth(year: number, month: number): number {
    if (month === 2) {
        const isLeap = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
        return isLeap ? 29 : 28;
    }
    if ([4, 6, 9, 11].includes(month)) return 30;
    return 31;
}

/**
 * Formata ano, mês e dia no formato YYYY-MM-DD sem shift de timezone.
 */
export function formatCivilDate(year: number, month: number, day: number): MaxLocalDate {
    const mm = String(month).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${year}-${mm}-${dd}`;
}

/**
 * Calcula o dia da semana para uma data civil (0 = Domingo, 6 = Sábado) usando congruência de Zeller / algoritmo determinístico.
 */
export function getCivilDayOfWeek(year: number, month: number, day: number): number {
    // Algoritmo de Sakamoto para dia da semana gregoriano (0 = domingo)
    const t = [0, 3, 2, 5, 0, 3, 5, 1, 4, 6, 2, 4];
    let y = year;
    if (month < 3) y -= 1;
    return (y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) + t[month - 1] + day) % 7;
}
