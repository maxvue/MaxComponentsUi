import { MaybeRefOrGetter } from 'vue';
type RefString = MaybeRefOrGetter<string | number | null | undefined>;
/**
 * Converte uma string ou número em uma string padronizada, sem acentos, sem caracteres especiais e em letras minúsculas (ideal para busca).
 *
 * @param value O valor a ser normalizado.
 * @returns A string normalizada.
 */
export declare function toSearchableString(value: RefString): string;
export declare const normalizeToSearch: typeof toSearchableString;
/**
 * Converte um valor em um número, com a opção de arredondar para uma quantidade específica de casas decimais.
 *
 * @param value O valor a ser convertido.
 * @param decimals Opcional. A quantidade de casas decimais.
 * @returns O número convertido ou arredondado.
 */
export declare function toNumber(value: RefString, decimals?: number | null): number;
export {};
//# sourceMappingURL=converters.d.ts.map