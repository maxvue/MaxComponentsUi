import { MaybeRefOrGetter } from 'vue';
type TPassed = string | Date | null | undefined;
/**
 * Verifica se um determinado número de horas se passou desde a data fornecida.
 *
 * @param dateValue A data inicial.
 * @param hours Quantidade de horas.
 * @returns Retorna true se o tempo já passou.
 */
export declare function hasPassedHours(dateValue: MaybeRefOrGetter<TPassed>, hours?: number): boolean;
export {};
//# sourceMappingURL=hasPassedHours.d.ts.map