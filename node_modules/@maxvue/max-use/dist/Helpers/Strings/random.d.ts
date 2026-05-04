import { MaybeRefOrGetter } from 'vue';
type Typecode = `${string}${'lower' | 'ulid' | 'upper'}${string}`;
/**
 * Gera uma string aleatória.
 *
 * @param arg1 Comprimento ou código de tipo.
 * @param arg2 Comprimento ou código de tipo.
 * @returns Retorna a string gerada.
 */
export declare function Random(arg1?: MaybeRefOrGetter<number | Typecode>, arg2?: MaybeRefOrGetter<number | Typecode>): string;
/**
 * Gera um Universally Unique Lexicographically Sortable Identifier (ULID) em letras minúsculas.
 *
 * @returns Retorna o ULID gerado.
 */
export declare function ulid(): string;
/**
 * Gera um número aleatório em um intervalo.
 *
 * @param min Valor mínimo.
 * @param max Valor máximo.
 * @returns Retorna o número gerado.
 */
export declare function intervalRandom(min?: MaybeRefOrGetter<number>, max?: MaybeRefOrGetter<number>): number;
export {};
//# sourceMappingURL=random.d.ts.map