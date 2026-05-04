import { MaybeRefOrGetter } from 'vue';
/**
 * Obtém um elemento aleatório de uma coleção.
 * Semelhante ao _.sample do Lodash.
 *
 * @param collection A coleção de onde extrair o elemento.
 * @returns Retorna o elemento aleatório.
 */
export declare function sample<T>(collection: MaybeRefOrGetter<T[] | Record<string, T> | any>): T | undefined;
//# sourceMappingURL=sample.d.ts.map