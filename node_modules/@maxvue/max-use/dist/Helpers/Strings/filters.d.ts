import { MaybeRefOrGetter } from 'vue';
type RefString = MaybeRefOrGetter<string | number | null | undefined>;
/**
 * Filtra uma string, mantendo apenas letras (e opcionalmente espaços).
 *
 * @param value O valor a ser filtrado.
 * @param space Se verdadeiro, mantém os espaços na string retornada.
 * @returns A string contendo apenas letras.
 */
export declare function onlyLetters(value: RefString, space?: boolean): string;
/**
 * Filtra uma string, mantendo apenas números (e opcionalmente espaços).
 *
 * @param value O valor a ser filtrado.
 * @param space Se verdadeiro, mantém os espaços na string retornada.
 * @returns A string contendo apenas números.
 */
export declare function onlyNumbers(value: RefString, space?: boolean): string;
/**
 * Filtra uma string, mantendo apenas símbolos (caracteres não alfanuméricos).
 *
 * @param value O valor a ser filtrado.
 * @returns A string contendo apenas símbolos.
 */
export declare function onlySymbols(value: RefString): string;
/**
 * Filtra uma string, mantendo apenas letras e números (e opcionalmente espaços).
 *
 * @param value O valor a ser filtrado.
 * @param space Se verdadeiro, mantém os espaços na string retornada.
 * @returns A string contendo apenas letras e números.
 */
export declare function onlyLettersAndNumbers(value: RefString, space?: boolean): string;
/**
 * Remove todos os espaços de uma string.
 *
 * @param value O valor a ser processado.
 * @returns A string sem nenhum espaço.
 */
export declare function removeSpaces(value: RefString): string;
export {};
//# sourceMappingURL=filters.d.ts.map