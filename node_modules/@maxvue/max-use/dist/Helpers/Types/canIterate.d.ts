import { MaybeRefOrGetter } from 'vue';
/**
 * Verifica se um objeto é iterável.
 *
 * @param obj O objeto a ser verificado.
 * @returns Retorna true se for iterável.
 */
export declare function canIterate<T>(obj: MaybeRefOrGetter<any>): obj is Iterable<T>;
export declare const isIterable: typeof canIterate;
//# sourceMappingURL=canIterate.d.ts.map