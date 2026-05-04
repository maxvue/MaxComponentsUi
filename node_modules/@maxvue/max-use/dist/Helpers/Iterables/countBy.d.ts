import { MaybeRefOrGetter } from 'vue';
type T = Record<string, any> | null | undefined;
/**
 * Conta o número de elementos em uma coleção que possuem um determinado valor para uma chave.
 *
 * @param collection A coleção de objetos.
 * @param key A chave a ser verificada.
 * @param value O valor a ser comparado (padrão é true).
 * @returns O número de elementos correspondentes.
 */
export declare function countBy(collection: MaybeRefOrGetter<T>, key: string, value?: T[keyof T] | any): number;
export {};
//# sourceMappingURL=countBy.d.ts.map