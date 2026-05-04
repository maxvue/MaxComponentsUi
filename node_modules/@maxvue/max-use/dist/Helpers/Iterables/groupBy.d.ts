import { MaybeRefOrGetter } from 'vue';
/**
 * Agrupa os elementos de uma coleção de acordo com o resultado de um iteratee.
 * Semelhante ao _.groupBy do Lodash.
 *
 * @param collection A coleção para iterar.
 * @param iteratee O iteratee para transformar as chaves.
 * @returns Retorna o objeto agrupado.
 */
export declare function groupBy<T>(collection: MaybeRefOrGetter<T[] | Record<string, T> | any>, iteratee: string | ((item: T) => string | number)): Record<string, T[]>;
//# sourceMappingURL=groupBy.d.ts.map