import { MaybeRefOrGetter } from 'vue';
type TDate = string | Date | null | undefined;
type IDateInterval = {
    start: Date | string;
    end?: Date | string | null;
};
/**
 * Verifica se uma data está dentro de um intervalo.
 *
 * @param value A data a ser verificada.
 * @param interval O intervalo (início e fim).
 * @returns Retorna true se estiver no intervalo.
 */
export declare function inDateInterval(value: MaybeRefOrGetter<TDate>, interval: MaybeRefOrGetter<IDateInterval>): boolean;
/**
 * Alias para inDateInterval. Verifica se uma data está dentro de um intervalo.
 *
 * @param value A data a ser verificada.
 * @param interval O intervalo (início e fim).
 * @returns Retorna true se estiver no intervalo.
 */
export declare function isInDateInterval(value: MaybeRefOrGetter<TDate>, interval: MaybeRefOrGetter<IDateInterval>): boolean;
export {};
//# sourceMappingURL=inDateInterval.d.ts.map