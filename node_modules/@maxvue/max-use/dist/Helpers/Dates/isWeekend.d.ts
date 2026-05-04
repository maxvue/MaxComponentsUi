import { MaybeRefOrGetter } from 'vue';
type TDate = string | number | Date | null | undefined;
/**
 * Retorna true se a data informada cair em um sábado ou domingo.
 * Utilidade: Regras de negócio para cálculo de prazos, agendamentos e bloqueios de interface em dias não úteis.
 *
 * @param dateValue A data a ser verificada.
 * @returns Retorna true se a data cair em um sábado ou domingo.
 */
export declare function isWeekend(dateValue: MaybeRefOrGetter<TDate>): boolean;
export {};
//# sourceMappingURL=isWeekend.d.ts.map