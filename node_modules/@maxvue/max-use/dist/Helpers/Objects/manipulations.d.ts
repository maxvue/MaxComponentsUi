import { MaybeRefOrGetter } from 'vue';
/**
 * Cria um novo objeto contendo apenas as chaves que você especificar do objeto original.
 *
 * @param obj O objeto original (pode ser um Ref).
 * @param keys As chaves a serem mantidas.
 */
export declare function pick<T extends object, K extends keyof T>(obj: MaybeRefOrGetter<T>, keys: K[]): Pick<T, K>;
/**
 * Cria um novo objeto removendo as chaves que você não deseja do objeto original.
 *
 * @param obj O objeto original (pode ser um Ref).
 * @param keys As chaves a serem removidas.
 */
export declare function omit<T extends object, K extends keyof T>(obj: MaybeRefOrGetter<T>, keys: K[]): Omit<T, K>;
//# sourceMappingURL=manipulations.d.ts.map