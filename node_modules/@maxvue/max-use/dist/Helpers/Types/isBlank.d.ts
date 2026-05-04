import { MaybeRefOrGetter } from 'vue';
type RefString = MaybeRefOrGetter<string | number | null | undefined>;
/**
 * Verifica se um valor está "em branco".
 *
 * @param value O valor a ser verificado.
 * @param if_zero Se true, considera o número 0 como NÃO estando em branco.
 * @returns Retorna true se estiver em branco.
 */
export declare function isBlank(value: RefString, if_zero?: boolean): boolean;
export {};
//# sourceMappingURL=isBlank.d.ts.map