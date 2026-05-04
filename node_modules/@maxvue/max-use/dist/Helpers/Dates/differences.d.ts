import { MaybeRefOrGetter } from 'vue';
type RefDate = MaybeRefOrGetter<string | number | Date | null | undefined>;
/**
 * Calcula a diferença absoluta em segundos entre duas datas.
 */
export declare function diffInSeconds(date1: RefDate, date2: RefDate): number;
/**
 * Calcula a diferença absoluta em minutos entre duas datas.
 */
export declare function diffInMinutes(date1: RefDate, date2: RefDate): number;
/**
 * Calcula a diferença absoluta em horas entre duas datas.
 */
export declare function diffInHours(date1: RefDate, date2: RefDate): number;
/**
 * Calcula a diferença absoluta em dias entre duas datas.
 */
export declare function diffInDays(date1: RefDate, date2: RefDate): number;
/**
 * Calcula a diferença absoluta em meses entre duas datas.
 */
export declare function diffInMonths(date1: RefDate, date2: RefDate): number;
/**
 * Calcula a diferença absoluta em anos entre duas datas.
 */
export declare function diffInYears(date1: RefDate, date2: RefDate): number;
export {};
//# sourceMappingURL=differences.d.ts.map