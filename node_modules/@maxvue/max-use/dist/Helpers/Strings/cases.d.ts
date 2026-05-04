import { MaybeRefOrGetter } from 'vue';
type RefString = MaybeRefOrGetter<string | number | null | undefined>;
/**
 * Converte uma string para o formato snake_case.
 *
 * @param value A string a ser convertida.
 * @returns A string em formato snake_case.
 */
export declare function snakeCase(value: RefString): string;
/**
 * Converte uma string para o formato kebab-case.
 *
 * @param value A string a ser convertida.
 * @returns A string em formato kebab-case.
 */
export declare function kebabCase(value: RefString): string;
/**
 * Converte uma string para o formato camelCase.
 *
 * @param value A string a ser convertida.
 * @returns A string em formato camelCase.
 */
export declare function camelCase(value: RefString): string;
/**
 * Garante que apenas a primeira letra da string seja maiúscula e o restante minúscula.
 *
 * @param value A string a ser formatada.
 */
export declare function capitalize(value: RefString): string;
export {};
//# sourceMappingURL=cases.d.ts.map