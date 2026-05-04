import { MaybeRefOrGetter } from 'vue';
type T = Record<string, any> | any[] | null | undefined | string;
type OrderCriteria = string | null | any | any[] | Record<string, 'asc' | 'desc'>;
/**
 * Ordena uma coleção de objetos com base em um ou mais critérios.
 *
 * @param collection A coleção de objetos a ser ordenada.
 * @param criteria O(s) critério(s) de ordenação (string, array de strings ou objeto com chaves e direções).
 * @param defaultOrder A direção de ordenação padrão se não for especificada (padrão é 'desc').
 * @returns Um novo array contendo a coleção ordenada.
 */
export declare function orderBy(collection: MaybeRefOrGetter<T>, criteria: OrderCriteria, defaultOrder?: 'asc' | 'desc'): T[];
export {};
//# sourceMappingURL=orderBy.d.ts.map