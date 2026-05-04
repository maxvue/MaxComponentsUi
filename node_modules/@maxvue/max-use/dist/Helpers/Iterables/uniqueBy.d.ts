import { MaybeRefOrGetter } from 'vue';
/**
 * Retorna itens únicos de um array de objetos com base em uma propriedade específica.
 * Útil para limpar listas de dados vindas de múltiplas fontes ou após junções de arrays.
 *
 * @param array O array a ser processado (pode ser um Ref).
 * @param key A chave usada para identificar a unicidade ou uma função seletora.
 * @returns Retorna o novo array de valores únicos.
 */
export declare function uniqueBy<T>(array: MaybeRefOrGetter<T[] | any>, key: string | ((item: T) => any)): T[];
//# sourceMappingURL=uniqueBy.d.ts.map