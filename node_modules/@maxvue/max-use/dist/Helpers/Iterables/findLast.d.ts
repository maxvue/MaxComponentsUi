import { MaybeRefOrGetter } from 'vue';
/**
 * Encontra o último item de uma lista que satisfaça uma condição.
 *
 * @param collection A coleção para pesquisar.
 * @param predicate A função executada por iteração.
 * @returns Retorna o elemento correspondente encontrado, ou undefined.
 */
export declare function findLast<T>(collection: MaybeRefOrGetter<T[] | null | undefined>, predicate: (value: T, index: number, collection: T[]) => boolean): T | undefined;
//# sourceMappingURL=findLast.d.ts.map