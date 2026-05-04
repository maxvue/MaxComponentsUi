import { MaybeRefOrGetter } from 'vue';
type T = Record<string, any>;
/**
 * Soma os valores de uma propriedade específica em uma coleção de objetos.
 *
 * @param collection A coleção de objetos.
 * @param key A chave que contém o valor numérico a ser somado.
 * @returns A soma total dos valores numéricos da chave especificada.
 */
export declare function sumBy(collection: MaybeRefOrGetter<T[] | Record<string, T> | null | undefined>, key: keyof T): number;
export {};
//# sourceMappingURL=sumBy.d.ts.map