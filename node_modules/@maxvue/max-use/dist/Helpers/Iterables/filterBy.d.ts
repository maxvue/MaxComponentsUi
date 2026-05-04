import { MaybeRefOrGetter } from 'vue';
type T = Record<string, any>;
/**
 * Filtra uma coleção mantendo apenas os elementos que possuem um determinado valor para uma chave.
 *
 * @param collection A coleção de objetos.
 * @param key A chave a ser verificada.
 * @param value O valor a ser comparado (padrão é true).
 * @returns A coleção filtrada.
 */
export declare function filterBy(collection: MaybeRefOrGetter<T[] | Record<string, T> | null | undefined>, key: keyof T, value?: T[keyof T] | unknown): T[] | Record<string, T>;
export {};
//# sourceMappingURL=filterBy.d.ts.map