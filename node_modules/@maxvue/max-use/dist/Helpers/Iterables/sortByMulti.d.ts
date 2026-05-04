import { MaybeRefOrGetter } from 'vue';
/**
 * Ordena um array por múltiplos critérios.
 *
 * @param collection A coleção para ordenar.
 * @param criteria Lista de critérios (string de chave ou função de extração de valor).
 * @param orders Lista de ordens ('asc' ou 'desc') correspondente aos critérios.
 * @returns Retorna o novo array ordenado.
 */
export declare function sortByMulti<T>(collection: MaybeRefOrGetter<T[] | null | undefined>, criteria: ((item: T) => any | string)[], orders?: ('asc' | 'desc')[]): T[];
//# sourceMappingURL=sortByMulti.d.ts.map