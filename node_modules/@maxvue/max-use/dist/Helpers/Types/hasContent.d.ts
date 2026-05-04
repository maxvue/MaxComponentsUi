import { MaybeRefOrGetter } from 'vue';
type RefString = MaybeRefOrGetter<string | number | null | undefined>;
/**
 * Verifica se um valor possui algum conteúdo, não sendo vazio, nulo, indefinido ou um array/objeto sem chaves.
 *
 * @param value O valor a ser verificado.
 * @param if_zero Define se o número 0 é considerado como tendo conteúdo (padrão é false).
 * @returns Retorna verdadeiro se o valor contiver dados.
 */
export declare function hasContent(value: RefString, if_zero?: boolean): boolean;
export {};
//# sourceMappingURL=hasContent.d.ts.map