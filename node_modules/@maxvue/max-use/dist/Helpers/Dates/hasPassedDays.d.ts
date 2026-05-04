import { MaybeRefOrGetter } from 'vue';
type TPassed = string | Date | null | undefined;
/**
 * Verifica se um determinado número de dias se passou desde a data fornecida.
 *
 * @param dateValue A data inicial.
 * @param days Quantidade de dias.
 * @returns Retorna true se o tempo já passou.
 */
export declare function hasPassedDays(dateValue: MaybeRefOrGetter<TPassed>, days?: number): boolean;
export {};
//# sourceMappingURL=hasPassedDays.d.ts.map