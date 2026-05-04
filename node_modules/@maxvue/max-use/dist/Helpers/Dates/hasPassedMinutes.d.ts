import { MaybeRefOrGetter } from 'vue';
type TPassed = string | Date | null | undefined;
/**
 * Verifica se um determinado número de minutos se passou desde a data fornecida.
 *
 * @param dateValue A data inicial.
 * @param minutes Quantidade de minutos.
 * @returns Retorna true se o tempo já passou.
 */
export declare function hasPassedMinutes(dateValue: MaybeRefOrGetter<TPassed>, minutes?: number): boolean;
export {};
//# sourceMappingURL=hasPassedMinutes.d.ts.map