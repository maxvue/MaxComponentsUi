import { MaybeRefOrGetter } from 'vue';
type T = Record<string, any> | any[] | null | undefined;
/**
 * Filtra uma coleção com base em uma função de callback.
 *
 * @param collection A coleção de objetos.
 * @param callback A função de callback para avaliar cada item.
 * @returns A coleção filtrada.
 */
export declare function filter(collection: MaybeRefOrGetter<T>, callback: (card: any) => void): T[] | Record<string, T>;
export {};
//# sourceMappingURL=filter.d.ts.map