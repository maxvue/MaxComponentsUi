import { MaybeRefOrGetter } from 'vue';
type T = Record<string, any> | any[] | null | undefined;
/**
 * Cria um objeto composto por chaves geradas a partir dos resultados da execução de cada elemento de uma coleção através de uma chave especificada.
 *
 * @param collection A coleção de objetos.
 * @param key A chave a ser usada como índice do novo objeto.
 * @returns Um objeto mapeado pela chave especificada.
 */
export declare function keyBy(collection: MaybeRefOrGetter<T | any[]>, key: string): Record<string, T>;
export {};
//# sourceMappingURL=keyBy.d.ts.map