import { MaybeRefOrGetter } from 'vue';
type T = Record<string, any> | any[] | null | undefined;
/**
 * Filtra uma coleção removendo os elementos que possuem um determinado valor para uma chave.
 *
 * @param collection A coleção de objetos.
 * @param key A chave a ser verificada.
 * @param value O valor ou array de valores a serem excluídos (padrão é true).
 * @returns A coleção filtrada.
 */
export declare function filterByNot(collection: MaybeRefOrGetter<T>, key: string, value?: any): T[] | Record<string, T>;
export {};
//# sourceMappingURL=filterByNot.d.ts.map