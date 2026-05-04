import { MaybeRefOrGetter } from 'vue';
type T = Record<string, any> | any[] | null | undefined;
/**
 * Extrai e retorna um array plano (flat) contendo os valores de uma chave específica de todos os objetos em uma coleção.
 *
 * @param collection A coleção de objetos.
 * @param key A chave a ser extraída de cada objeto.
 * @param default_value O valor padrão a ser usado caso a chave não exista ou seja nula (padrão é false).
 * @returns Um array contendo os valores extraídos.
 */
export declare function valuesInKey(collection: MaybeRefOrGetter<T>, key: string, default_value?: any): any[];
export {};
//# sourceMappingURL=valuesInKey.d.ts.map