import { MaybeRefOrGetter } from 'vue';
type TDate = string | number | Date | null | undefined;
type TUnit = 'day' | 'days' | 'month' | 'months' | 'year' | 'years' | 'hour' | 'hours' | 'minute' | 'minutes' | 'second' | 'seconds';
/**
 * Adiciona ou subtrai uma quantidade específica de tempo a uma data.
 *
 * @param dateValue A data base.
 * @param amount A quantidade de tempo a adicionar (ou subtrair se negativo).
 * @param unit A unidade de tempo.
 * @returns Retorna o objeto Date resultante.
 */
export declare function addTime(dateValue: MaybeRefOrGetter<TDate>, amount: MaybeRefOrGetter<number>, unit?: MaybeRefOrGetter<TUnit>): Date | null;
export {};
//# sourceMappingURL=addTime.d.ts.map