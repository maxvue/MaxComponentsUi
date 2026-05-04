import { MaybeRefOrGetter } from 'vue';
type TDateArray = Date[] | string[];
type Operator = 'and' | 'or';
/**
 * Verifica se as datas fornecidas são do mesmo dia.
 *
 * @param dates Array de datas.
 * @param operator Operador de comparação ('and' ou 'or').
 * @returns Retorna true conforme o operador.
 */
export declare function isSameDay(dates: MaybeRefOrGetter<TDateArray>, operator?: Operator): boolean;
export {};
//# sourceMappingURL=isSameDay.d.ts.map