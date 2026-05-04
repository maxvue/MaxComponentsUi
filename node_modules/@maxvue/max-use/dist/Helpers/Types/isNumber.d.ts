import { MaybeRefOrGetter } from 'vue';
type RefString = MaybeRefOrGetter<string | number | null | undefined>;
/**
 * Verifica se um valor é um número válido.
 *
 * @param value O valor a ser verificado.
 * @returns Retorna true se for um número.
 */
export declare function isNumber(value: RefString): boolean;
export declare const isNumeric: typeof isNumber;
export declare const numeric: typeof isNumber;
export {};
//# sourceMappingURL=isNumber.d.ts.map