import { MaybeRefOrGetter } from 'vue';
/**
 * Cria um array de elementos, ordenados em ordem crescente pelos resultados da execução de cada iteratee.
 * Semelhante ao _.sortBy do Lodash.
 *
 * @param collection A coleção para iterar.
 * @param iteratees Os iteratees para ordenar.
 * @returns Retorna o novo array ordenado.
 */
export declare function sortBy<T>(collection: MaybeRefOrGetter<T[] | Record<string, T> | any>, iteratees?: any | any[]): T[];
//# sourceMappingURL=sortBy.d.ts.map